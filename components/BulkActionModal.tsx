
import React from 'react';
import type { Contact } from '../types';
import { XIcon } from './icons/XIcon';
import { createWhatsAppUrl } from '../utils/messagingUtils';

const WhatsAppIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 32 32" className="w-5 h-5" {...props}>
        <path d=" M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.044-.53-.044-.302 0-.53.09-.68.22-.24.32-.68.78-.68 1.816 0 1.04.857 2.061 1.018 2.213.19.187 1.17 1.96 2.83 2.913.578.32 1.03.52 1.43.66.71.24 1.35.21 1.79.07.57-.18 1.76-.73 2.04-1.39.28-.66.28-1.21.18-1.39-.07-.143-.21-.21-.48-.21z" fill="#FFFFFF"></path>
        <path d=" M20.5 0 L15.21 0 A15.21 15.21 0 0 0 0 15.21 A15.21 15.21 0 0 0 15.21 30.42 A15.21 15.21 0 0 0 30.42 15.21 A15.21 15.21 0 0 0 20.5 0 Z M15.21 27.63 A12.42 12.42 0 0 1 2.79 15.21 A12.42 12.42 0 0 1 15.21 2.79 A12.42 12.42 0 0 1 27.63 15.21 A12.42 12.42 0 0 1 15.21 27.63 Z" fill="#25D366"></path>
    </svg>
);

interface BulkActionModalProps {
    actionType: 'whatsapp';
    contacts: Contact[];
    onClose: () => void;
}

const BulkActionModal: React.FC<BulkActionModalProps> = ({ actionType, contacts, onClose }) => {
    const title = actionType === 'whatsapp' ? 'Enviar Mensajes de WhatsApp' : '';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-bold text-brand-blue">{title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><XIcon className="h-6 w-6" /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <p className="text-sm text-gray-600 mb-4">
                        WhatsApp no permite enviar un mensaje a varios contactos a la vez. Haz clic en cada enlace para abrir una conversación individual.
                    </p>
                    <ul className="space-y-2">
                        {contacts.map(contact => (
                            contact.phones.map(phone => (
                                <li key={`${contact.id}-${phone}`}>
                                    <a
                                        href={createWhatsAppUrl(phone)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-md transition"
                                    >
                                        <div>
                                            <p className="font-semibold text-gray-800">{contact.name}</p>
                                            <p className="text-sm text-gray-500">{phone}</p>
                                        </div>
                                        <WhatsAppIcon />
                                    </a>
                                </li>
                            ))
                        ))}
                    </ul>
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default BulkActionModal;
