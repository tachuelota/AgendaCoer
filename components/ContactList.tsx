
import React from 'react';
import type { Contact } from '../types';
import ContactItem from './ContactItem';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { createWhatsAppUrl } from '../utils/messagingUtils';

interface ContactListProps {
    contacts: Contact[];
    selectedContactIds: number[];
    onToggleSelect: (id: number) => void;
    onSelectAll: () => void;
    onEdit: (contact: Contact) => void;
    onDelete: (id: number) => void;
    onVerify: (contact: Contact) => void;
    viewMode: 'card' | 'table';
}

const WhatsAppIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 32 32" className="w-4 h-4" {...props}>
        <path d=" M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.044-.53-.044-.302 0-.53.09-.68.22-.24.32-.68.78-.68 1.816 0 1.04.857 2.061 1.018 2.213.19.187 1.17 1.96 2.83 2.913.578.32 1.03.52 1.43.66.71.24 1.35.21 1.79.07.57-.18 1.76-.73 2.04-1.39.28-.66.28-1.21.18-1.39-.07-.143-.21-.21-.48-.21z" fill="#FFFFFF"></path>
        <path d=" M20.5 0 L15.21 0 A15.21 15.21 0 0 0 0 15.21 A15.21 15.21 0 0 0 15.21 30.42 A15.21 15.21 0 0 0 30.42 15.21 A15.21 15.21 0 0 0 20.5 0 Z M15.21 27.63 A12.42 12.42 0 0 1 2.79 15.21 A12.42 12.42 0 0 1 15.21 2.79 A12.42 12.42 0 0 1 27.63 15.21 A12.42 12.42 0 0 1 15.21 27.63 Z" fill="#25D366"></path>
    </svg>
);

const ContactList: React.FC<ContactListProps> = ({ contacts, selectedContactIds, onToggleSelect, onSelectAll, onEdit, onDelete, onVerify, viewMode }) => {
    if (contacts.length === 0) {
        return (
            <div className="text-center py-16 px-4">
                <h2 className="text-xl font-semibold text-gray-700">No se encontraron contactos</h2>
                <p className="text-gray-500 mt-2">Intenta ajustar tu búsqueda o criterios de filtro.</p>
            </div>
        );
    }
    
    const allFilteredSelected = contacts.length > 0 && contacts.every(c => selectedContactIds.includes(c.id!));

    return (
        <div>
            {/* Header / Select All for both views */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center">
                     {/* Only show "Select All" here if in Card view, in Table view it's in the header */}
                    {viewMode === 'card' && (
                        <>
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-lightblue"
                                checked={allFilteredSelected}
                                onChange={onSelectAll}
                                aria-label="Seleccionar todos los contactos visibles"
                            />
                            <label className="ml-2 text-sm text-gray-600">
                                Seleccionar todo ({contacts.length} {contacts.length === 1 ? 'contacto' : 'contactos'})
                            </label>
                        </>
                    )}
                     {viewMode === 'table' && (
                        <span className="text-sm text-gray-600">
                             Mostrando {contacts.length} {contacts.length === 1 ? 'contacto' : 'contactos'}
                        </span>
                    )}
                </div>
            </div>

            {viewMode === 'card' ? (
                // GRID VIEW
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {contacts.map(contact => (
                        <ContactItem
                            key={contact.id}
                            contact={contact}
                            isSelected={selectedContactIds.includes(contact.id!)}
                            onToggleSelect={onToggleSelect}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onVerify={onVerify}
                        />
                    ))}
                </div>
            ) : (
                // TABLE VIEW
                <div className="bg-white rounded-lg shadow overflow-x-auto border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left w-10">
                                     <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-lightblue"
                                        checked={allFilteredSelected}
                                        onChange={onSelectAll}
                                    />
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo / Empresa</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etiquetas</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {contacts.map((contact) => {
                                const isSelected = selectedContactIds.includes(contact.id!);
                                return (
                                    <tr key={contact.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                             <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-lightblue"
                                                checked={isSelected}
                                                onChange={() => onToggleSelect(contact.id!)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-brand-blue">{contact.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{contact.positions[0]}</div>
                                            <div className="text-xs text-gray-500">{contact.company}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-sm">
                                                {contact.phones.slice(0, 2).map((phone, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <a 
                                                            href={`tel:${phone}`} 
                                                            className="text-gray-600 hover:text-brand-blue hover:underline transition-colors"
                                                            title="Llamar"
                                                        >
                                                            {phone}
                                                        </a>
                                                        <a 
                                                            href={createWhatsAppUrl(phone)} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="opacity-50 hover:opacity-100 transition-opacity"
                                                            title="Abrir WhatsApp"
                                                        >
                                                            <WhatsAppIcon />
                                                        </a>
                                                    </div>
                                                ))}
                                                {contact.emails.slice(0, 1).map((email, i) => (
                                                    <a key={i} href={`mailto:${email}`} className="text-blue-600 hover:underline text-xs truncate max-w-[150px]">
                                                        {email}
                                                    </a>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {contact.tags.slice(0, 3).map((tag, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {contact.tags.length > 3 && (
                                                    <span className="text-xs text-gray-400">+{contact.tags.length - 3}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => onVerify(contact)} title="Verificar con IA" className="text-gray-400 hover:text-brand-blue">
                                                    <SparklesIcon className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => onEdit(contact)} title="Editar" className="text-gray-400 hover:text-brand-lightblue">
                                                    <EditIcon className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => onDelete(contact.id!)} title="Eliminar" className="text-gray-400 hover:text-red-500">
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ContactList;
