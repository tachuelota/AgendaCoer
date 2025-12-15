
import React, { useState, useEffect } from 'react';
import type { Contact } from '../types';
import { XIcon } from './icons/XIcon';

interface ContactFormProps {
    contact: Contact | null;
    onSave: (contact: Contact) => void;
    onClose: () => void;
    allTags: string[];
    onAddNewTag: (tagName: string) => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ contact, onSave, onClose, allTags, onAddNewTag }) => {
    const [formData, setFormData] = useState<Omit<Contact, 'id'>>({
        name: '',
        positions: [''],
        company: '',
        emails: [''],
        phones: [''],
        tags: [],
        notes: ''
    });
    const [newTagInput, setNewTagInput] = useState('');

    useEffect(() => {
        if (contact) {
            setFormData({
                name: contact.name,
                positions: contact.positions.length > 0 ? [...contact.positions] : [''],
                company: contact.company,
                emails: contact.emails.length > 0 ? [...contact.emails] : [''],
                phones: contact.phones.length > 0 ? [...contact.phones] : [''],
                tags: [...contact.tags],
                notes: contact.notes || ''
            });
        }
    }, [contact]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDynamicListChange = (listName: 'positions' | 'emails' | 'phones', index: number, value: string) => {
        const list = [...formData[listName]];
        list[index] = value;
        setFormData(prev => ({ ...prev, [listName]: list }));
    };

    const addDynamicListItem = (listName: 'positions' | 'emails' | 'phones') => {
        setFormData(prev => ({ ...prev, [listName]: [...prev[listName], ''] }));
    };

    const removeDynamicListItem = (listName: 'positions' | 'emails' | 'phones', index: number) => {
        if (formData[listName].length > 1) {
            const list = [...formData[listName]];
            list.splice(index, 1);
            setFormData(prev => ({ ...prev, [listName]: list }));
        }
    };

    const handleTagToggle = (tag: string) => {
        setFormData(prev => {
            const newTags = prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag];
            return { ...prev, tags: newTags };
        });
    };
    
    const handleAddNewTagFromInput = () => {
        const trimmedTag = newTagInput.trim();
        if (trimmedTag) {
            onAddNewTag(trimmedTag);
            if (!formData.tags.includes(trimmedTag)) {
                setFormData(prev => ({...prev, tags: [...prev.tags, trimmedTag]}));
            }
            setNewTagInput('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalContact: Contact = {
            ...contact,
            ...formData,
            positions: formData.positions.filter(p => p.trim() !== ''),
            emails: formData.emails.filter(e => e.trim() !== ''),
            phones: formData.phones.filter(p => p.trim() !== ''),
        };
        onSave(finalContact);
    };
    
    const getFieldNameSingular = (fieldName: string) => {
        switch (fieldName) {
            case 'positions': return 'cargo';
            case 'phones': return 'teléfono';
            case 'emails': return 'correo';
            default: return '';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-brand-blue">{contact ? 'Editar Contacto' : 'Añadir Nuevo Contacto'}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><XIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="overflow-y-auto">
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-lightblue focus:border-brand-lightblue bg-white text-gray-900" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Empresa / Institución</label>
                            <input type="text" name="company" value={formData.company} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-lightblue focus:border-brand-lightblue bg-white text-gray-900" />
                        </div>
                        
                        {Object.entries({positions: 'Cargos', phones: 'Teléfonos', emails: 'Correos'}).map(([fieldName, fieldLabel]) => (
                            <div key={fieldName}>
                                <label className="block text-sm font-medium text-gray-700 capitalize">{fieldLabel}</label>
                                {(formData[fieldName as keyof typeof formData] as string[]).map((value, index) => (
                                    <div key={index} className="flex items-center mt-1">
                                        <input type="text" value={value} onChange={e => handleDynamicListChange(fieldName as 'positions' | 'emails' | 'phones', index, e.target.value)} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-lightblue focus:border-brand-lightblue bg-white text-gray-900" />
                                        {(formData[fieldName as keyof typeof formData] as string[]).length > 1 && <button type="button" onClick={() => removeDynamicListItem(fieldName as 'positions' | 'emails' | 'phones', index)} className="ml-2 text-red-500 hover:text-red-700 p-1">Quitar</button>}
                                    </div>
                                ))}
                                <button type="button" onClick={() => addDynamicListItem(fieldName as 'positions' | 'emails' | 'phones')} className="mt-2 text-sm text-brand-blue hover:underline">Añadir otro {getFieldNameSingular(fieldName)}</button>
                            </div>
                        ))}
                        
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Notas</label>
                            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-lightblue focus:border-brand-lightblue bg-white text-gray-900" />
                        </div>

                         <div>
                            <label className="block text-sm font-medium text-gray-700">Etiquetas</label>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {allTags.map(tag => (
                                    <button type="button" key={tag} onClick={() => handleTagToggle(tag)} className={`px-3 py-1 rounded-full text-sm ${formData.tags.includes(tag) ? 'bg-brand-blue text-white' : 'bg-gray-200 text-gray-700'}`}>
                                        {tag}
                                    </button>
                                ))}
                            </div>
                             <div className="mt-3 flex items-center gap-2">
                                <input 
                                    type="text" 
                                    value={newTagInput}
                                    onChange={(e) => setNewTagInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewTagFromInput())}
                                    placeholder="Crear nueva etiqueta..."
                                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-brand-lightblue focus:border-brand-lightblue bg-white text-gray-900"
                                />
                                <button type="button" onClick={handleAddNewTagFromInput} className="px-4 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700">Añadir</button>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue">Guardar Contacto</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ContactForm;
