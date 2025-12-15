
import React from 'react';
import type { Contact } from '../types';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { MailIcon } from './icons/MailIcon';
import { BuildingIcon } from './icons/BuildingIcon';
import { ShareIcon } from './icons/ShareIcon';
import { createWhatsAppUrl } from '../utils/messagingUtils';

interface ContactItemProps {
    contact: Contact;
    isSelected: boolean;
    onToggleSelect: (id: number) => void;
    onEdit: (contact: Contact) => void;
    onDelete: (id: number) => void;
    onVerify: (contact: Contact) => void;
}

const WhatsAppIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 32 32" className="w-4 h-4" {...props}>
        <path d=" M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.044-.53-.044-.302 0-.53.09-.68.22-.24.32-.68.78-.68 1.816 0 1.04.857 2.061 1.018 2.213.19.187 1.17 1.96 2.83 2.913.578.32 1.03.52 1.43.66.71.24 1.35.21 1.79.07.57-.18 1.76-.73 2.04-1.39.28-.66.28-1.21.18-1.39-.07-.143-.21-.21-.48-.21z" fill="#FFFFFF"></path>
        <path d=" M20.5 0 L15.21 0 A15.21 15.21 0 0 0 0 15.21 A15.21 15.21 0 0 0 15.21 30.42 A15.21 15.21 0 0 0 30.42 15.21 A15.21 15.21 0 0 0 20.5 0 Z M15.21 27.63 A12.42 12.42 0 0 1 2.79 15.21 A12.42 12.42 0 0 1 15.21 2.79 A12.42 12.42 0 0 1 27.63 15.21 A12.42 12.42 0 0 1 15.21 27.63 Z" fill="#25D366"></path>
    </svg>
);

const ContactItem: React.FC<ContactItemProps> = ({ contact, isSelected, onToggleSelect, onEdit, onDelete, onVerify }) => {
    
    const handleShare = async () => {
        const shareData = {
            title: `Contacto: ${contact.name}`,
            text: `Nombre: ${contact.name}\nCargo(s): ${contact.positions.join(', ')}\nEmpresa/Institución: ${contact.company}\nTeléfonos: ${contact.phones.join(', ')}\nCorreos: ${contact.emails.join(', ')}`,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback for browsers that don't support Web Share API
                await navigator.clipboard.writeText(shareData.text);
                alert('¡Detalles del contacto copiados al portapapeles!');
            }
        } catch (err) {
            console.error('Error sharing contact:', err);
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-200 flex flex-col border-2 ${isSelected ? 'border-brand-blue shadow-2xl scale-105' : 'border-transparent hover:shadow-2xl'}`}>
            <div className="p-5 flex-grow">
                 <div className="flex justify-between items-start">
                    <div className="flex-grow">
                        <h3 className="text-xl font-bold text-brand-blue">{contact.name}</h3>
                        <p className="text-sm text-gray-600">{contact.positions.join(' / ')}</p>
                    </div>
                    <div className="flex items-center space-x-1 pl-2">
                        <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-gray-300 text-brand-blue focus:ring-brand-lightblue"
                            checked={isSelected}
                            onChange={() => onToggleSelect(contact.id!)}
                            aria-label={`Seleccionar ${contact.name}`}
                        />
                    </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center text-gray-700">
                        <BuildingIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{contact.company}</span>
                    </div>
                    {contact.phones.length > 0 && (
                        <div className="flex items-start">
                            <PhoneIcon className="h-4 w-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                            <div className="flex flex-col gap-1">
                                {contact.phones.map((phone, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <a href={`tel:${phone}`} className="hover:text-brand-blue transition">{phone}</a>
                                        <a 
                                            href={createWhatsAppUrl(phone)} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="opacity-70 hover:opacity-100 transition-opacity transform hover:scale-110"
                                            title="Abrir WhatsApp"
                                        >
                                            <WhatsAppIcon />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {contact.emails.length > 0 && (
                         <div className="flex items-start">
                            <MailIcon className="h-4 w-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                             <div className="flex flex-wrap gap-x-2">
                                {contact.emails.map((email, i) => <a key={i} href={`mailto:${email}`} className="hover:text-brand-blue transition break-all">{email}</a>)}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                    {contact.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">{tag}</span>
                    ))}
                </div>
            </div>
            <div className="bg-gray-50 px-5 py-3 flex justify-between items-center">
                <div className="flex items-center gap-4">
                     <button onClick={() => onEdit(contact)} className="text-gray-400 hover:text-brand-lightblue p-1 rounded-full transition" title="Editar"><EditIcon className="h-5 w-5" /></button>
                     <button onClick={() => onDelete(contact.id!)} className="text-gray-400 hover:text-red-500 p-1 rounded-full transition" title="Eliminar"><TrashIcon className="h-5 w-5" /></button>
                     <button onClick={handleShare} className="text-gray-400 hover:text-brand-lightblue p-1 rounded-full transition" title="Compartir">
                        <ShareIcon className="h-5 w-5" />
                    </button>
                </div>
                <button
                    onClick={() => onVerify(contact)}
                    className="flex items-center text-sm text-brand-blue font-semibold hover:underline"
                >
                    <SparklesIcon className="h-5 w-5 mr-1" />
                    Verificar
                </button>
            </div>
        </div>
    );
};

export default ContactItem;
