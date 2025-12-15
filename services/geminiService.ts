
import { GoogleGenAI, GroundingMetadata } from "@google/genai";

// FIX: Per coding guidelines, the API key must be read directly from process.env.API_KEY
// during client initialization, and we should assume it is always available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function verifyContactPosition(name: string, position: string): Promise<{ text: string; sources: string[] }> {
    try {
        const prompt = `Using recent internet search results, please verify if ${name} is currently the ${position}. Provide a concise answer: 'Confirmed', 'Uncertain', or 'Contradictory', followed by a brief summary.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text ?? 'No response text found.';

        const groundingMetadata: GroundingMetadata | undefined = response.candidates?.[0]?.groundingMetadata;
        
        const sources = groundingMetadata?.groundingChunks
            ?.map(chunk => chunk.web?.uri)
            .filter((uri): uri is string => !!uri) ?? [];
        
        return { text, sources };

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            return {
                text: `An error occurred during verification: ${error.message}`,
                sources: []
            };
        }
        return {
            text: "An unknown error occurred during verification.",
            sources: []
        };
    }
}
