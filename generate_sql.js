const fs = require('fs');
const path = require('path');

// Read the TypeScript file
const inputPath = path.join(__dirname, 'data', 'initialData.ts');
const outputPath = path.join(__dirname, 'data_migration.sql');

try {
    let content = fs.readFileSync(inputPath, 'utf8');

    // Simple regex parsing to extract the array content
    // We assume the structure export const initialContacts: ... = [ ... ];
    const match = content.match(/export const initialContacts[^\[]*\[([\s\S]*?)\];/);

    if (!match) {
        throw new Error("Could not find initialContacts array in the file.");
    }

    // Evaluate the array content safely
    // We wrap it in brackets to make it a valid JSON-like array string, 
    // but we need to handle trailing commas and unquoted keys if present.
    // However, the file seems to have valid JS object syntax.
    // Let's use Function constructor to eval the array string (safe enough for this local task)
    const arrayString = '[' + match[1] + ']';

    // Using eval (or Function) is risky generally, but here we are parsing known local file only.
    const contacts = eval(arrayString);

    let sql = `-- Migration Script for Initial Data
-- Run this in Supabase SQL Editor

INSERT INTO contacts (name, positions, company, emails, phones, tags, notes, created_by)
VALUES
`;

    const values = contacts.map(contact => {
        const escape = (str) => {
            if (!str) return 'NULL';
            // Replace single quotes with double single quotes for SQL
            return `'${str.replace(/'/g, "''")}'`;
        };

        const escapeArray = (arr) => {
            if (!arr || arr.length === 0) return "'{}'";
            // PostgreSQL array syntax: '{"item1","item2"}'
            // Escape double quotes in items if necessary
            const items = arr.map(item => `"${item.replace(/"/g, '\\"')}"`);
            return `'${'{' + items.join(',') + '}'}'`;
        };

        return `(
    ${escape(contact.name)},
    ${escapeArray(contact.positions)},
    ${escape(contact.company)},
    ${escapeArray(contact.emails)},
    ${escapeArray(contact.phones)},
    ${escapeArray(contact.tags)},
    ${escape(contact.notes)},
    auth.uid() -- This assumes you run it as an authenticated user, or replace with specific UUID
)`;
    });

    sql += values.join(',\n');
    sql += ';\n';

    fs.writeFileSync(outputPath, sql);
    console.log(`Successfully generated SQL with ${contacts.length} contacts to ${outputPath}`);

} catch (err) {
    console.error("Error processing file:", err);
}
