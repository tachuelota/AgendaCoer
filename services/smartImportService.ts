
import { GoogleGenAI, Schema, Type } from "@google/genai";
import * as XLSX from 'xlsx';
import type { Contact } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("Gemini API Key is missing. Import features will not work.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-init' });

// Schema definition to ensure Gemini returns strict JSON matching our Contact type
const contactSchema: Schema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "Full name of the contact" },
            positions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of job titles or roles" },
            company: { type: Type.STRING, description: "Organization, Company, or Institution name" },
            emails: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of email addresses" },
            phones: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of phone numbers" },
            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Inferred tags based on context and Sheet Name" },
            notes: { type: Type.STRING, description: "Any extra information found" }
        },
        required: ["name", "positions", "company", "emails", "phones", "tags"]
    }
};

/**
 * Converts a File object to a Base64 string.
 */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

interface FileChunk {
    context: string;
    content: string;
    sheetName?: string; // Explicitly carry the clean sheet name
}

/**
 * Breaks down an Excel file into manageable text chunks for the AI.
 * Splitting strategy: Per sheet, then per configured batch size.
 */
function getExcelChunks(file: File, batchSize: number): Promise<FileChunk[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const chunks: FileChunk[] = [];
                const ROWS_PER_CHUNK = batchSize;

                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (jsonData.length === 0) return;

                    // If small enough, just one chunk
                    if (jsonData.length <= ROWS_PER_CHUNK) {
                        const csv = XLSX.utils.sheet_to_csv(worksheet);
                        if (csv.trim()) {
                            chunks.push({
                                context: `Sheet Name: ${sheetName}`,
                                content: csv,
                                sheetName: sheetName
                            });
                        }
                    } else {
                        // Split large sheets
                        const headers = jsonData[0] as string[];
                        for (let i = 1; i < jsonData.length; i += ROWS_PER_CHUNK) {
                            const slice = jsonData.slice(i, i + ROWS_PER_CHUNK);
                            // Prepend headers to every chunk so AI understands columns
                            const chunkData = [headers, ...slice];
                            const tempSheet = XLSX.utils.aoa_to_sheet(chunkData);
                            const csv = XLSX.utils.sheet_to_csv(tempSheet);

                            if (csv.trim()) {
                                chunks.push({
                                    context: `Sheet Name: ${sheetName} (Part ${(Math.floor(i / ROWS_PER_CHUNK)) + 1})`,
                                    content: csv,
                                    sheetName: sheetName
                                });
                            }
                        }
                    }
                });

                if (chunks.length === 0) {
                    reject(new Error("El archivo Excel parece estar vacío."));
                } else {
                    resolve(chunks);
                }
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function deduplicateContacts(contacts: Omit<Contact, 'id'>[]): Omit<Contact, 'id'>[] {
    const uniqueContacts = new Map<string, Omit<Contact, 'id'>>();

    contacts.forEach(contact => {
        if (!contact.name) return;
        const normalizedName = contact.name.trim().toLowerCase();

        if (!uniqueContacts.has(normalizedName)) {
            uniqueContacts.set(normalizedName, { ...contact });
        } else {
            const existing = uniqueContacts.get(normalizedName)!;
            existing.positions = [...new Set([...existing.positions, ...contact.positions])];
            existing.emails = [...new Set([...existing.emails, ...contact.emails])];
            existing.phones = [...new Set([...existing.phones, ...contact.phones])];
            existing.tags = [...new Set([...existing.tags, ...contact.tags])];
            if (contact.company && !existing.company.includes(contact.company)) {
                existing.company = existing.company ? `${existing.company} / ${contact.company}` : contact.company;
            }
            if (contact.notes) {
                existing.notes = existing.notes ? `${existing.notes}\n${contact.notes}` : contact.notes;
            }
        }
    });

    return Array.from(uniqueContacts.values());
}

/**
 * Utility to wait for a specified time (used for rate limiting).
 */
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to call AI for a specific chunk of text.
 */
async function processChunk(text: string, contextNote: string, fixedTag?: string): Promise<Omit<Contact, 'id'>[]> {
    // Determine the tag instruction based on whether we have a specific sheet name
    let tagInstruction = "2. Infer useful tags based on context.";
    if (fixedTag) {
        tagInstruction = `2. MANDATORY: Add the tag "${fixedTag}" to ALL contacts in this list. Do NOT number it (e.g., do not use '${fixedTag} 1'). Use exactly "${fixedTag}".`;
    }

    const prompt = `
        Context: You are reading a segment of a contact list file. 
        Debug Info for this segment: ${contextNote}.
        
        Task: Extract contacts into JSON.
        
        Rules:
        1. Extract Name, Positions, Company, Emails, Phones.
        ${tagInstruction}
        3. Infer other tags from roles (e.g., 'Alcalde' -> 'Autoridad').
        4. Clean phone numbers.
        5. Return strictly a JSON array.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }, { text: text }] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: contactSchema,
            temperature: 0.1
        }
    });

    if (response.text) {
        try {
            return JSON.parse(response.text) as Omit<Contact, 'id'>[];
        } catch (error) {
            console.warn("JSON Parse Error in chunk, attempting repair:", error);
            // Simple repair for truncated JSON in a chunk
            const text = response.text.trim();
            if (text.startsWith('[')) {
                const lastObjectEnd = text.lastIndexOf('}');
                if (lastObjectEnd !== -1) {
                    const repairedJson = text.substring(0, lastObjectEnd + 1) + ']';
                    return JSON.parse(repairedJson) as Omit<Contact, 'id'>[];
                }
            }
            return []; // Skip chunk if unrecoverable
        }
    }
    return [];
}

/**
 * Wrapper for processChunk that implements Exponential Backoff for 429 errors.
 */
async function processChunkWithRetry(text: string, contextNote: string, fixedTag?: string): Promise<Omit<Contact, 'id'>[]> {
    const maxRetries = 5;
    // START WITH HIGHER DELAY: 10 seconds. 
    // Free tier is often sensitive to bursts. 10s wait clears most rolling windows.
    let delay = 10000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await processChunk(text, contextNote, fixedTag);
        } catch (error: any) {
            // Check specifically for Rate Limit / Quota errors
            const isRateLimit = error.status === 429 ||
                error.code === 429 ||
                (error.message && (
                    error.message.includes('429') ||
                    error.message.includes('quota') ||
                    error.message.includes('RESOURCE_EXHAUSTED')
                ));

            if (isRateLimit) {
                if (attempt < maxRetries - 1) {
                    console.warn(`Rate limit hit (429) on chunk "${contextNote}". Retrying in ${delay / 1000}s (Attempt ${attempt + 1}/${maxRetries})...`);
                    await wait(delay);
                    delay *= 2; // Exponential backoff: 10s, 20s, 40s...
                    continue;
                } else {
                    console.error(`Max retries reached for chunk "${contextNote}" due to rate limiting.`);
                    throw error;
                }
            }
            // If it's not a rate limit error, throw immediately (or handle other errors as needed)
            throw error;
        }
    }
    return [];
}

export async function processFileWithGemini(file: File, batchSize: number = 20): Promise<Omit<Contact, 'id'>[]> {
    let allContacts: Omit<Contact, 'id'>[] = [];
    const mimeType = file.type;
    let consecutiveFailures = 0;

    try {
        // Strategy for Excel: Chunking
        if (
            mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            mimeType === 'application/vnd.ms-excel' ||
            file.name.endsWith('.xlsx') ||
            file.name.endsWith('.xls')
        ) {
            const chunks = await getExcelChunks(file, batchSize);
            console.log(`File split into ${chunks.length} chunks for processing with batch size ${batchSize}.`);

            // Process sequentially to manage rate limits and ensure partial success
            for (let i = 0; i < chunks.length; i++) {
                try {
                    const chunk = chunks[i];
                    console.log(`Processing chunk ${i + 1}/${chunks.length}: ${chunk.context}`);
                    // Use the Retry Wrapper
                    const extracted = await processChunkWithRetry(chunk.content, chunk.context, chunk.sheetName);
                    allContacts.push(...extracted);

                    // Reset consecutive failures on success
                    consecutiveFailures = 0;

                    // CONSERVATIVE DELAY: 6 seconds between chunks.
                    if (i < chunks.length - 1) {
                        await wait(6000);
                    }

                } catch (chunkError) {
                    console.error(`Error processing chunk ${i + 1}`, chunkError);
                    consecutiveFailures++;

                    if (consecutiveFailures >= 3) {
                        console.warn("Too many consecutive failures. Stopping import and returning partial results.");
                        break;
                    }
                }
            }

        } else if (mimeType === 'application/pdf' || mimeType.startsWith('image/')) {
            // Logic for Images/PDFs
            const base64Data = await fileToBase64(file);
            const parts = [
                { inlineData: { mimeType: mimeType === 'application/pdf' ? 'application/pdf' : mimeType, data: base64Data } },
                { text: "Extract contacts to JSON. Use the filename (without extension) as a primary tag." }
            ];
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: parts },
                config: { responseMimeType: 'application/json', responseSchema: contactSchema }
            });
            if (response.text) allContacts = JSON.parse(response.text);

        } else {
            // Text/CSV (Simple single pass)
            const textContent = await readTextFile(file);
            allContacts = await processChunkWithRetry(textContent, "Text File Import");
        }

        return deduplicateContacts(allContacts);

    } catch (error) {
        console.error("Smart Import Critical Error:", error);
        if (allContacts.length > 0) {
            console.warn("Returning partial results despite error.");
            return deduplicateContacts(allContacts);
        }
        throw error;
    }
}
