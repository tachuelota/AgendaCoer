
import React from 'react';
import type { Contact } from '../types';
import { XIcon } from './icons/XIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface VerificationModalProps {
    contact: Contact;
    result: { text: string; sources: string[] } | null;
    isLoading: boolean;
    onClose: () => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({ contact, result, isLoading, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-4 border-b flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="h-6 w-6 text-brand-blue" />
                        <h2 className="text-lg font-bold text-brand-blue">Resultado de Verificación (IA)</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><XIcon className="h-6 w-6" /></button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4">
                        Verificando si <strong>{contact.name}</strong> sigue ocupando el cargo de <strong>{contact.positions.join(' / ')}</strong>.
                    </p>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
                            <p className="mt-3 text-sm text-gray-500">Consultando fuentes recientes...</p>
                        </div>
                    ) : result ? (
                        <div>
                            <p className="bg-gray-100 p-3 rounded-md whitespace-pre-wrap">{result.text}</p>
                            {result.sources.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-semibold text-sm">Fuentes:</h4>
                                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                                        {result.sources.map((source, index) => (
                                            <li key={index}>
                                                <a href={source} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                                    {new URL(source).hostname}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500">No hay resultado disponible.</p>
                    )}
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default VerificationModal;
