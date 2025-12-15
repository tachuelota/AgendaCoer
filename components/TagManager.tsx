
import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { EyeIcon } from './icons/EyeIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface TagManagerProps {
    tags: string[];
    onAddNewTag: (tagName: string) => void;
    onEditTag: (oldTag: string, newTag: string) => Promise<void>;
    onDeleteTag: (tag: string) => Promise<void>;
    onViewTag: (tag: string) => void;
    onOptimizeTags: () => Promise<void>;
}

const TagManager: React.FC<TagManagerProps> = ({ tags, onAddNewTag, onEditTag, onDeleteTag, onViewTag, onOptimizeTags }) => {
    const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
    const [editingTag, setEditingTag] = useState<string | null>(null);
    const [newTagName, setNewTagName] = useState('');
    const [newTagInput, setNewTagInput] = useState('');

    useEffect(() => {
        const fetchCounts = async () => {
            const counts: Record<string, number> = {};
            for (const tag of tags) {
                const count = await db.contacts.where('tags').equals(tag).count();
                counts[tag] = count;
            }
            setTagCounts(counts);
        };
        fetchCounts();
    }, [tags]);
    
    const handleEditClick = (tag: string) => {
        setEditingTag(tag);
        setNewTagName(tag);
    };

    const handleSaveEdit = async () => {
        if (editingTag && newTagName.trim()) {
            await onEditTag(editingTag, newTagName.trim());
            setEditingTag(null);
            setNewTagName('');
        }
    };
    
    const handleCancelEdit = () => {
        setEditingTag(null);
        setNewTagName('');
    };

    const handleAddNewTagSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddNewTag(newTagInput);
        setNewTagInput('');
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-brand-blue">Gestión de Etiquetas</h2>
                    <p className="text-sm text-gray-500 mt-1">Administra, renombra o fusiona categorías.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <button 
                        onClick={() => onOptimizeTags()} 
                        className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-md hover:bg-purple-100 transition shadow-sm text-sm font-medium"
                        title="Fusionar etiquetas duplicadas o numeradas (ej. 'Tag 1' -> 'Tag')"
                    >
                        <SparklesIcon className="h-4 w-4" />
                        Optimizar Etiquetas
                    </button>

                    <form onSubmit={handleAddNewTagSubmit} className="flex items-center gap-2 w-full sm:w-auto">
                        <input 
                            type="text"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            placeholder="Nueva etiqueta..."
                            className="w-full sm:w-auto px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-lightblue bg-white text-gray-900"
                        />
                        <button type="submit" className="px-4 py-2 bg-brand-blue text-white text-sm font-semibold rounded-md hover:bg-brand-lightblue shadow-sm whitespace-nowrap">
                            Añadir
                        </button>
                    </form>
                </div>
            </div>

            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre de Etiqueta</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contactos</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {tags.map(tag => (
                            <tr key={tag} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {editingTag === tag ? (
                                        <input 
                                            type="text"
                                            value={newTagName}
                                            onChange={(e) => setNewTagName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                            className="border-gray-300 rounded-md shadow-sm bg-white text-gray-900 px-2 py-1 w-full max-w-xs"
                                            autoFocus
                                        />
                                    ) : (
                                        tag
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {tagCounts[tag] || 0}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {editingTag === tag ? (
                                        <div className="flex justify-end gap-3">
                                            <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-900 font-semibold">Guardar</button>
                                            <button onClick={handleCancelEdit} className="text-gray-600 hover:text-gray-900">Cancelar</button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end items-center gap-4">
                                            <button onClick={() => onViewTag(tag)} title="Ver Contactos y Gestionar" className="text-gray-400 hover:text-brand-blue transition-colors"><EyeIcon className="h-5 w-5" /></button>
                                            <button onClick={() => handleEditClick(tag)} title="Renombrar Etiqueta" className="text-gray-400 hover:text-brand-lightblue transition-colors"><EditIcon className="h-5 w-5" /></button>
                                            <button onClick={() => onDeleteTag(tag)} title="Eliminar Etiqueta" className="text-gray-400 hover:text-red-500 transition-colors"><TrashIcon className="h-5 w-5" /></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {tags.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                                    No hay etiquetas creadas. Añade una nueva o importa contactos.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TagManager;
