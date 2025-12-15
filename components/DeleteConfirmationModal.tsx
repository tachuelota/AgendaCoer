
import React from 'react';
import { XIcon } from './icons/XIcon';
import { TrashIcon } from './icons/TrashIcon';

interface DeleteConfirmationModalProps {
    contactName: string;
    onConfirm: () => void;
    onClose: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ contactName, onConfirm, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fade-in-up">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Confirmar Eliminación</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-center mb-6">
                        <div className="bg-red-100 p-4 rounded-full">
                            <TrashIcon className="h-10 w-10 text-red-600" />
                        </div>
                    </div>
                    <p className="text-center text-gray-600 text-lg">
                        ¿Estás seguro de que quieres eliminar a <br/>
                        <span className="font-bold text-gray-800">{contactName}</span>?
                    </p>
                    <p className="text-center text-sm text-gray-500 mt-2">
                        Esta acción eliminará el contacto permanentemente de la base de datos.
                    </p>
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-center gap-4 rounded-b-lg">
                    <button 
                        onClick={onClose} 
                        className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors font-medium shadow-sm"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="px-5 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium shadow-md flex items-center gap-2"
                    >
                        <TrashIcon className="h-5 w-5" />
                        Sí, Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
