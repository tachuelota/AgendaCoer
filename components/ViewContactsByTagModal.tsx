
import React, { useState, useEffect } from 'react';
import type { Contact } from '../types';
import { db } from '../services/dbService';
import { XIcon } from './icons/XIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { downloadCSV, downloadJSON, downloadXLSX } from '../utils/exportUtils';

interface ViewContactsByTagModalProps {
    tag: string;
    onClose: () => void;
}

const ViewContactsByTagModal: React.FC<ViewContactsByTagModalProps> = ({ tag, onClose }) => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    useEffect(() => {
        const fetchContacts = async () => {
            setIsLoading(true);
            const taggedContacts = await db.contacts.where('tags').equals(tag).toArray();
            setContacts(taggedContacts);
            setIsLoading(false);
        };
        fetchContacts();
    }, [tag]);
    
    const handleExport = (format: 'csv' | 'json' | 'xlsx') => {
        if(format === 'csv') downloadCSV(contacts);
        else if (format === 'json') downloadJSON(contacts);
        else if (format === 'xlsx') downloadXLSX(contacts);
        setIsExportMenuOpen(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-brand-blue">Contactos con la Etiqueta: "{tag}"</h2>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                           <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="flex items-center gap-2 px-3 py-1.5 border rounded-full text-sm hover:bg-gray-100 transition">
                                <DownloadIcon className="h-5 w-5 text-gray-500" />
                                <span>Exportar</span>
                            </button>
                             {isExportMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-30 overflow-hidden">
                                    <button onClick={() => handleExport('xlsx')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 font-medium text-green-700 bg-green-50">Excel (XLSX)</button>
                                    <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">CSV</button>
                                    <button onClick={() => handleExport('json')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">JSON</button>
                                </div>
                            )}
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><XIcon className="h-6 w-6" /></button>
                    </div>
                </div>
                <div className="overflow-y-auto p-6">
                    {isLoading ? (
                        <p>Cargando contactos...</p>
                    ) : contacts.length > 0 ? (
                         <ul className="space-y-3">
                            {contacts.map(contact => (
                                <li key={contact.id} className="p-3 bg-gray-50 rounded-md">
                                    <p className="font-semibold text-brand-lightblue">{contact.name}</p>
                                    <p className="text-sm text-gray-600">{contact.positions.join(' / ')} en {contact.company}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No se encontraron contactos con esta etiqueta.</p>
                    )}
                </div>
                 <div className="p-4 bg-gray-50 border-t flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default ViewContactsByTagModal;
