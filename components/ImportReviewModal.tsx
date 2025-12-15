
import React, { useState, useEffect } from 'react';
import type { Contact } from '../types';
import { XIcon } from './icons/XIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ImportReviewModalProps {
    isLoading: boolean;
    extractedContacts: Omit<Contact, 'id'>[];
    onConfirm: (contacts: Omit<Contact, 'id'>[]) => void;
    onClose: () => void;
    fileName: string;
}

const ImportReviewModal: React.FC<ImportReviewModalProps> = ({ isLoading, extractedContacts, onConfirm, onClose, fileName }) => {
    const [editableContacts, setEditableContacts] = useState<Omit<Contact, 'id'>[]>([]);

    useEffect(() => {
        setEditableContacts(extractedContacts);
    }, [extractedContacts]);

    const handleDelete = (index: number) => {
        setEditableContacts(prev => prev.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: keyof Omit<Contact, 'id'>, value: string) => {
        setEditableContacts(prev => {
            const newContacts = [...prev];
            const contact = { ...newContacts[index] };
            
            if (field === 'positions' || field === 'emails' || field === 'phones' || field === 'tags') {
                // Simple comma separated split for editing arrays in a single input
                contact[field] = value.split(',').map(s => s.trim()).filter(Boolean);
            } else if (field === 'name' || field === 'company' || field === 'notes') {
                contact[field] = value;
            }
            
            newContacts[index] = contact;
            return newContacts;
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b bg-brand-bg flex justify-between items-center rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-blue p-2 rounded-full text-white">
                            <SparklesIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-brand-blue">Importación Inteligente</h2>
                            <p className="text-xs text-gray-500">Analizando: {fileName}</p>
                        </div>
                    </div>
                    {!isLoading && <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><XIcon className="h-6 w-6" /></button>}
                </div>

                {/* Body */}
                <div className="flex-grow overflow-hidden flex flex-col">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full py-20">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-blue mb-4"></div>
                            <h3 className="text-lg font-semibold text-gray-700">Analizando archivo con IA...</h3>
                            <p className="text-gray-500 max-w-md text-center mt-2">Estamos leyendo la estructura, extrayendo contactos e infiriendo etiquetas automáticamente.</p>
                        </div>
                    ) : (
                        <div className="flex-grow overflow-y-auto p-4">
                            {editableContacts.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    No se encontraron contactos en este archivo.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-md text-sm text-blue-800">
                                        Se han encontrado <strong>{editableContacts.length}</strong> contactos. Revisa la información abajo, edita si es necesario y confirma para guardar.
                                    </div>
                                    <table className="min-w-full divide-y divide-gray-200 border rounded-lg overflow-hidden">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo / Empresa</th>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datos (Tel/Email)</th>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etiquetas (Inferidas)</th>
                                                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {editableContacts.map((contact, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2">
                                                        <input 
                                                            type="text" 
                                                            className="w-full border-gray-300 rounded text-sm focus:ring-brand-blue focus:border-brand-blue"
                                                            value={contact.name}
                                                            onChange={(e) => handleChange(idx, 'name', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input 
                                                            type="text" 
                                                            className="w-full border-gray-300 rounded text-sm mb-1 focus:ring-brand-blue focus:border-brand-blue"
                                                            value={contact.positions.join(', ')}
                                                            onChange={(e) => handleChange(idx, 'positions', e.target.value)}
                                                            placeholder="Cargos"
                                                        />
                                                        <input 
                                                            type="text" 
                                                            className="w-full border-gray-300 rounded text-xs text-gray-600 focus:ring-brand-blue focus:border-brand-blue"
                                                            value={contact.company}
                                                            onChange={(e) => handleChange(idx, 'company', e.target.value)}
                                                            placeholder="Empresa"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input 
                                                            type="text" 
                                                            className="w-full border-gray-300 rounded text-sm mb-1 focus:ring-brand-blue focus:border-brand-blue"
                                                            value={contact.phones.join(', ')}
                                                            onChange={(e) => handleChange(idx, 'phones', e.target.value)}
                                                            placeholder="Teléfonos"
                                                        />
                                                        <input 
                                                            type="text" 
                                                            className="w-full border-gray-300 rounded text-xs text-gray-600 focus:ring-brand-blue focus:border-brand-blue"
                                                            value={contact.emails.join(', ')}
                                                            onChange={(e) => handleChange(idx, 'emails', e.target.value)}
                                                            placeholder="Emails"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input 
                                                            type="text" 
                                                            className="w-full border-gray-300 rounded text-sm focus:ring-brand-blue focus:border-brand-blue bg-gray-50"
                                                            value={contact.tags.join(', ')}
                                                            onChange={(e) => handleChange(idx, 'tags', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <button 
                                                            onClick={() => handleDelete(idx)}
                                                            className="text-red-500 hover:text-red-700 p-1"
                                                            title="Eliminar de la importación"
                                                        >
                                                            <TrashIcon className="h-5 w-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                    {!isLoading && (
                        <>
                            <button 
                                onClick={onClose} 
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 font-medium"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={() => onConfirm(editableContacts)} 
                                disabled={editableContacts.length === 0}
                                className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                Importar {editableContacts.length} Contactos
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportReviewModal;
