
import type { Contact } from '../types';

type ImportedContact = Omit<Contact, 'id'>;

export function parseCSV(file: File): Promise<ImportedContact[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split('\n');
                if (lines.length < 2) resolve([]);
                
                const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                const contacts: ImportedContact[] = [];

                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim() === '') continue;
                    // This is a simple CSV parser; for more complex CSVs, a library would be better.
                    const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
                    const row = values.map(v => v.trim().replace(/"/g, ''));
                    
                    const contact: ImportedContact = {
                        name: '',
                        positions: [],
                        company: '',
                        emails: [],
                        phones: [],
                        tags: [],
                        notes: ''
                    };
                    
                    header.forEach((col, index) => {
                        const val = row[index] || '';
                        switch (col.toLowerCase()) {
                            case 'name': contact.name = val; break;
                            case 'positions': contact.positions = val.split(';').map(p => p.trim()).filter(Boolean); break;
                            case 'company': contact.company = val; break;
                            case 'emails': contact.emails = val.split(';').map(e => e.trim()).filter(Boolean); break;
                            case 'phones': contact.phones = val.split(';').map(p => p.trim()).filter(Boolean); break;
                            case 'tags': contact.tags = val.split(';').map(t => t.trim()).filter(Boolean); break;
                            case 'notes': contact.notes = val; break;
                        }
                    });

                    if(contact.name) contacts.push(contact);
                }
                resolve(contacts);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
}

export function parseJSON(file: File): Promise<ImportedContact[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const data = JSON.parse(text);
                // Basic validation
                if (Array.isArray(data) && data.every(item => 'name' in item)) {
                    resolve(data.map(({id, ...rest}) => rest)); // Remove ID to treat as new
                } else {
                    reject(new Error('Invalid JSON format for contacts.'));
                }
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
}
