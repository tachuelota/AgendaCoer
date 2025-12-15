
import React, { useState } from 'react';
import { XIcon } from './icons/XIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UploadIcon } from './icons/UploadIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface SettingsModalProps {
    currentBatchSize: number;
    onSaveBatchSize: (size: number) => void;
    onClearDatabase: () => Promise<void>;
    onRestoreDefaults: () => Promise<void>;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ currentBatchSize, onSaveBatchSize, onClearDatabase, onRestoreDefaults, onClose }) => {
    const [batchSize, setBatchSize] = useState(currentBatchSize);
    
    // View state: 'menu' | 'confirm-clear' | 'confirm-restore' | 'processing' | 'success'
    const [view, setView] = useState<'menu' | 'confirm-clear' | 'confirm-restore' | 'processing' | 'success'>('menu');
    const [resultMessage, setResultMessage] = useState<string>('');

    const handleBatchSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = parseInt(e.target.value, 10);
        setBatchSize(val);
        onSaveBatchSize(val);
    };

    const handleClearConfirm = async () => {
        setView('processing');
        try {
            await onClearDatabase();
            setResultMessage("Base de datos vaciada correctamente.");
            setView('success');
        } catch (error) {
            console.error(error);
            setResultMessage("Error al vaciar la base de datos.");
            setView('success'); // Show error state in success view for simplicity or add error view
        }
    };

    const handleRestoreConfirm = async () => {
        setView('processing');
        try {
            await onRestoreDefaults();
            setResultMessage("Datos iniciales restaurados con éxito.");
            setView('success');
        } catch (error) {
             console.error(error);
             setResultMessage("Error al restaurar datos.");
             setView('success');
        }
    };

    const renderMenu = () => (
        <div className="space-y-8">
            {/* IA Import Settings */}
            <div>
                <h3 className="text-lg font-semibold text-brand-blue mb-2">Importación con IA</h3>
                <p className="text-sm text-gray-600 mb-3">
                    Ajusta cuántas filas se envían a la IA por vez. 
                    <br/>
                    <span className="text-xs text-gray-500 italic">Valores más altos son más rápidos pero pueden causar errores de cuota si no tienes una API Key de pago.</span>
                </p>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño del Lote (Filas por petición)</label>
                    <select 
                        value={batchSize} 
                        onChange={handleBatchSizeChange}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-blue focus:border-brand-blue bg-white text-gray-900 py-2 px-3"
                    >
                        <option value={20}>20 filas (Recomendado - Gratuito)</option>
                        <option value={50}>50 filas (Rápido)</option>
                        <option value={100}>100 filas (Alto Rendimiento)</option>
                    </select>
                </div>
            </div>

            <hr className="border-gray-200" />

            {/* Database Management */}
            <div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">Zona de Peligro</h3>
                <p className="text-sm text-gray-600 mb-3">
                    Gestiona el estado de tu base de datos local.
                </p>
                <div className="space-y-3">
                     <button 
                        onClick={() => setView('confirm-restore')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                    >
                        <UploadIcon className="h-5 w-5" />
                        Restaurar Datos Iniciales
                    </button>
                    
                    <button 
                        onClick={() => setView('confirm-clear')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors"
                    >
                        <TrashIcon className="h-5 w-5" />
                        Vaciar Base de Datos
                    </button>
                </div>
            </div>
        </div>
    );

    const renderConfirmClear = () => (
        <div className="text-center py-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <TrashIcon className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">¿Vaciar Base de Datos?</h3>
            <p className="text-gray-500 mb-8">
                Esta acción eliminará <strong>permanentemente</strong> todos los contactos y etiquetas actuales. <br/>
                No podrás deshacer esta acción.
            </p>
            <div className="flex gap-4 justify-center">
                <button onClick={() => setView('menu')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                    Cancelar
                </button>
                <button onClick={handleClearConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-bold">
                    Sí, Vaciar Todo
                </button>
            </div>
        </div>
    );

    const renderConfirmRestore = () => (
        <div className="text-center py-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
                <UploadIcon className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">¿Restaurar Datos Iniciales?</h3>
            <p className="text-gray-500 mb-8">
                Esto <strong>borrará todos los datos actuales</strong> y cargará la lista oficial de contactos predeterminada.
            </p>
            <div className="flex gap-4 justify-center">
                <button onClick={() => setView('menu')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                    Cancelar
                </button>
                <button onClick={handleRestoreConfirm} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold">
                    Sí, Restaurar
                </button>
            </div>
        </div>
    );

    const renderProcessing = () => (
        <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900">Procesando...</h3>
            <p className="text-gray-500">Por favor espera un momento.</p>
        </div>
    );

    const renderSuccess = () => (
        <div className="text-center py-8 animate-fade-in-up">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <SparklesIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">{resultMessage}</h3>
            <button onClick={onClose} className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue font-medium">
                Entendido, Cerrar
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Configuración</h2>
                    {view !== 'processing' && (
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                            <XIcon className="h-6 w-6" />
                        </button>
                    )}
                </div>
                
                <div className="p-6">
                    {view === 'menu' && renderMenu()}
                    {view === 'confirm-clear' && renderConfirmClear()}
                    {view === 'confirm-restore' && renderConfirmRestore()}
                    {view === 'processing' && renderProcessing()}
                    {view === 'success' && renderSuccess()}
                </div>

                {view === 'menu' && (
                    <div className="p-4 bg-gray-50 border-t flex justify-end">
                        <button onClick={onClose} className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue">
                            Cerrar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsModal;
