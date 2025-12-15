
import type { Contact } from '../types';
import * as XLSX from 'xlsx';

function convertToCSV(contacts: Contact[]): string {
    const header = ['Name', 'Positions', 'Company', 'Emails', 'Phones', 'Tags', 'Notes'];
    const rows = contacts.map(contact => [
        `"${contact.name}"`,
        `"${contact.positions.join('; ')}"`,
        `"${contact.company}"`,
        `"${contact.emails.join('; ')}"`,
        `"${contact.phones.join('; ')}"`,
        `"${contact.tags.join('; ')}"`,
        `"${contact.notes || ''}"`
    ].join(','));
    return [header.join(','), ...rows].join('\n');
}

function triggerDownload(content: string, fileName: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function downloadCSV(contacts: Contact[]) {
    const csvContent = convertToCSV(contacts);
    triggerDownload(csvContent, 'agenda_contactos.csv', 'text/csv;charset=utf-8;');
}

export function downloadJSON(contacts: Contact[]) {
    const jsonContent = JSON.stringify(contacts, null, 2);
    triggerDownload(jsonContent, 'agenda_contactos.json', 'application/json');
}

export function downloadXLSX(contacts: Contact[]) {
    // 1. Transform Data for Presentation
    // Flatten arrays into readable strings and use Spanish headers
    const data = contacts.map(c => ({
        "Nombre Completo": c.name,
        "Cargo(s)": c.positions.join(', '),
        "Empresa / Institución": c.company,
        "Teléfonos": c.phones.join(', '),
        "Correos Electrónicos": c.emails.join(', '),
        "Etiquetas": c.tags.join(', '),
        "Notas": c.notes || ''
    }));

    // 2. Create Worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 3. Set Column Widths (Formatted for printing/viewing)
    // wch = characters width approx
    const wscols = [
        { wch: 35 }, // Nombre
        { wch: 35 }, // Cargo
        { wch: 30 }, // Empresa
        { wch: 25 }, // Teléfonos
        { wch: 30 }, // Correos
        { wch: 25 }, // Etiquetas
        { wch: 40 }  // Notas
    ];
    worksheet['!cols'] = wscols;

    // 4. Create Workbook and Append Sheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Agenda COER");

    // 5. Generate File
    // Note: Using writeFile from xlsx handles the download trigger automatically in browsers
    XLSX.writeFile(workbook, `Agenda_COER_Moquegua_${new Date().toISOString().split('T')[0]}.xlsx`);
}
