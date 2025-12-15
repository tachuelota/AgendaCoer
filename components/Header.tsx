
import React, { useRef, useState } from 'react';
import { FilterIcon } from './icons/FilterIcon';
import { SearchIcon } from './icons/SearchIcon';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { AdjustmentsIcon } from './icons/AdjustmentsIcon';
import { TagIcon } from './icons/TagIcon';
import { UsersIcon } from './icons/UsersIcon';
import { SendIcon } from './icons/SendIcon';
import { CogIcon } from './icons/CogIcon';
import { TableCellsIcon } from './icons/TableCellsIcon';
import { Squares2X2Icon } from './icons/Squares2X2Icon';
import type { Filters } from '../App';
import { initialContacts } from '../data/initialData';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    currentView: 'contacts' | 'tags';
    onViewChange: (view: 'contacts' | 'tags') => void;
    contactViewMode: 'card' | 'table';
    onContactViewModeChange: (mode: 'card' | 'table') => void;
    filters: Filters;
    onFiltersChange: (filters: Filters) => void;
    allTags: string[];
    selectedTags: string[];
    onSelectedTagsChange: (tags: string[]) => void;
    onImport: (file: File) => void;
    onExport: (format: 'csv' | 'json' | 'xlsx', scope: 'filtered' | 'all') => void;
    onBulkEmail: () => void;
    onBulkWhatsApp: () => void;
    filteredContactsCount: number;
    totalContactsCount: number;
    onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, contactViewMode, onContactViewModeChange, filters, onFiltersChange, allTags, selectedTags, onSelectedTagsChange, onImport, onExport, onBulkEmail, onBulkWhatsApp, filteredContactsCount, totalContactsCount, onOpenSettings }) => {
    const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
    const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user, signOut } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInitialMigration = async () => {
        if (!confirm("¿Estás seguro de subir la DATA INICIAL a Supabase? Esto podría duplicar contactos si ya existen.")) return;

        setLoading(true);
        try {
            const batchSize = 50;
            // initialContacts doesn't have ID, so we just map it directly
            const contactsToUpload = initialContacts.map((contact) => ({
                ...contact,
                created_by: user?.id
            }));

            for (let i = 0; i < contactsToUpload.length; i += batchSize) {
                const batch = contactsToUpload.slice(i, i + batchSize);
                const { error } = await supabase.from('contacts').insert(batch);
                if (error) throw error;
            }
            alert("¡Migración completada con éxito!");
            // Optional: onRefresh(); // If passed prop
        } catch (error: any) {
            console.error(error);
            alert("Error en la migración: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFiltersChange({ ...filters, [e.target.name]: e.target.value });
    };

    const handleTagChange = (tag: string) => {
        const newSelectedTags = selectedTags.includes(tag)
            ? selectedTags.filter(t => t !== tag)
            : [...selectedTags, tag];
        onSelectedTagsChange(newSelectedTags);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImport(file);
            // Reset input so same file can be selected again if needed
            event.target.value = '';
        }
    };

    const activeAdvancedFiltersCount = Object.values(filters).filter((v, i) => i > 0 && v !== '').length;

    // Helper class strings for active/inactive states
    const activeInputClass = "border-brand-blue bg-blue-50 ring-1 ring-brand-blue/20";
    const inactiveInputClass = "border-gray-300 bg-white";

    const activeButtonClass = "border-brand-blue bg-blue-50 text-brand-blue";
    const inactiveButtonClass = "border-gray-300 hover:bg-gray-100 text-gray-600";

    return (
        <header className="bg-white shadow-md sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-4 border-b">
                    <h1 className="text-2xl sm:text-3xl font-bold text-brand-blue">
                        Agenda Coer Moquegua
                        {user && (
                            <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:float-right text-base font-normal">
                                <span className="text-sm opacity-90 hidden lg:block text-gray-600 mr-2">
                                    {user.email}
                                </span>
                                {totalContactsCount === 0 && (
                                    <button
                                        onClick={handleInitialMigration}
                                        disabled={loading}
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2 shadow-sm transition-colors"
                                        title="Migrar Data Inicial"
                                    >
                                        <UploadIcon className="h-4 w-4" />
                                        {loading ? 'Subiendo...' : 'Migrar Data'}
                                    </button>
                                )}
                                <button
                                    onClick={() => signOut()}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs transition-colors border border-red-200"
                                >
                                    Salir
                                </button>
                            </div>
                        )}
                    </h1>
                    {currentView === 'contacts' && (
                        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
                            <div className="relative w-full sm:w-56">
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Buscar por nombre..."
                                    value={filters.name}
                                    onChange={handleFilterChange}
                                    className={`w-full pl-10 pr-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-lightblue transition-colors text-gray-900 ${filters.name ? activeInputClass : inactiveInputClass}`}
                                />
                                <SearchIcon className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${filters.name ? 'text-brand-blue' : 'text-gray-400'}`} />
                            </div>

                            {/* View Toggle Buttons */}
                            <div className="flex items-center border rounded-full overflow-hidden bg-gray-50">
                                <button
                                    onClick={() => onContactViewModeChange('card')}
                                    className={`p-2 transition-colors ${contactViewMode === 'card' ? 'bg-brand-blue text-white' : 'text-gray-500 hover:bg-gray-200'}`}
                                    title="Vista de Tarjetas"
                                >
                                    <Squares2X2Icon className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => onContactViewModeChange('table')}
                                    className={`p-2 transition-colors ${contactViewMode === 'table' ? 'bg-brand-blue text-white' : 'text-gray-500 hover:bg-gray-200'}`}
                                    title="Vista de Tabla"
                                >
                                    <TableCellsIcon className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
                                    className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm transition ${activeAdvancedFiltersCount > 0 || isAdvancedSearchOpen ? activeButtonClass : inactiveButtonClass}`}
                                >
                                    <AdjustmentsIcon className={`h-5 w-5 ${activeAdvancedFiltersCount > 0 ? 'text-brand-blue' : 'text-gray-500'}`} />
                                    <span>Avanzado</span>
                                    {activeAdvancedFiltersCount > 0 && (
                                        <span className="bg-brand-blue text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{activeAdvancedFiltersCount}</span>
                                    )}
                                </button>
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setIsTagFilterOpen(!isTagFilterOpen)}
                                    className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm transition ${selectedTags.length > 0 || isTagFilterOpen ? activeButtonClass : inactiveButtonClass}`}
                                >
                                    <FilterIcon className={`h-5 w-5 ${selectedTags.length > 0 ? 'text-brand-blue' : 'text-gray-500'}`} />
                                    <span>Etiquetas</span>
                                    {selectedTags.length > 0 && (
                                        <span className="bg-brand-blue text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{selectedTags.length}</span>
                                    )}
                                </button>
                                {isTagFilterOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-30 p-4">
                                        <h3 className="font-semibold text-sm mb-2">Filtrar por Etiquetas</h3>
                                        <div className="max-h-60 overflow-y-auto space-y-1">
                                            {allTags.map(tag => {
                                                const isSelected = selectedTags.includes(tag);
                                                return (
                                                    <label key={tag} className={`flex items-center gap-2 text-sm p-2 rounded cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 text-brand-blue font-medium' : 'hover:bg-gray-50 text-gray-700'}`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleTagChange(tag)}
                                                            className="rounded text-brand-blue focus:ring-brand-lightblue border-gray-300"
                                                        />
                                                        {tag}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".csv, .json, .xlsx, .xls, .pdf, .jpg, .jpeg, .png"
                                />
                                <button onClick={handleImportClick} title="Importar Contactos (Inteligente)" className="p-2 border rounded-full hover:bg-gray-100 transition text-brand-blue bg-blue-50">
                                    <UploadIcon className="h-5 w-5" />
                                </button>
                                <div className="relative">
                                    <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} title="Exportar Contactos" className="p-2 border rounded-full hover:bg-gray-100 transition">
                                        <DownloadIcon className="h-5 w-5 text-gray-500" />
                                    </button>
                                    {isExportMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-30 overflow-hidden">
                                            <div className="px-4 py-2 text-xs text-gray-500 uppercase">Filtrados</div>
                                            <button onClick={() => { onExport('xlsx', 'filtered'); setIsExportMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 font-medium text-green-700 bg-green-50">Exportar Excel (XLSX)</button>
                                            <button onClick={() => { onExport('csv', 'filtered'); setIsExportMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Exportar como CSV</button>
                                            <button onClick={() => { onExport('json', 'filtered'); setIsExportMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Exportar como JSON</button>
                                            <div className="border-t my-1"></div>
                                            <div className="px-4 py-2 text-xs text-gray-500 uppercase">Todos</div>
                                            <button onClick={() => { onExport('xlsx', 'all'); setIsExportMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 font-medium text-green-700 bg-green-50">Exportar Excel (XLSX)</button>
                                            <button onClick={() => { onExport('csv', 'all'); setIsExportMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Exportar como CSV</button>
                                            <button onClick={() => { onExport('json', 'all'); setIsExportMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Exportar como JSON</button>
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <button onClick={() => setIsActionMenuOpen(!isActionMenuOpen)} title="Acciones en Lote" className="p-2 border rounded-full hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={filteredContactsCount === 0}>
                                        <SendIcon className="h-5 w-5 text-gray-500" />
                                    </button>
                                    {isActionMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-30 overflow-hidden">
                                            <div className="px-4 py-2 text-xs text-gray-500 uppercase">Para Lista Filtrada ({filteredContactsCount})</div>
                                            <button onClick={() => { onBulkEmail(); setIsActionMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Enviar Email a todos</button>
                                            <button onClick={() => { onBulkWhatsApp(); setIsActionMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Enviar WhatsApp a todos</button>
                                        </div>
                                    )}
                                </div>
                                <button onClick={onOpenSettings} title="Configuración" className="p-2 border rounded-full hover:bg-gray-100 transition text-gray-600">
                                    <CogIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => onViewChange('contacts')} className={`flex items-center gap-2 py-3 px-2 font-semibold transition-colors ${currentView === 'contacts' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-gray-500 hover:text-gray-800'}`}>
                        <UsersIcon className="h-5 w-5" />
                        Contactos
                    </button>
                    <button onClick={() => onViewChange('tags')} className={`flex items-center gap-2 py-3 px-2 font-semibold transition-colors ${currentView === 'tags' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-gray-500 hover:text-gray-800'}`}>
                        <TagIcon className="h-5 w-5" />
                        Etiquetas
                    </button>
                </div>

                {isAdvancedSearchOpen && currentView === 'contacts' && (
                    <div className="p-4 bg-gray-50 border-t">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className={`text-xs font-semibold ${filters.position ? 'text-brand-blue' : 'text-gray-600'}`}>Cargo</label>
                                <input
                                    type="text"
                                    name="position"
                                    placeholder="ej., Alcalde"
                                    value={filters.position}
                                    onChange={handleFilterChange}
                                    className={`w-full mt-1 px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-lightblue transition-colors text-gray-900 ${filters.position ? activeInputClass : inactiveInputClass}`}
                                />
                            </div>
                            <div>
                                <label className={`text-xs font-semibold ${filters.company ? 'text-brand-blue' : 'text-gray-600'}`}>Empresa / Institución</label>
                                <input
                                    type="text"
                                    name="company"
                                    placeholder="ej., Municipalidad"
                                    value={filters.company}
                                    onChange={handleFilterChange}
                                    className={`w-full mt-1 px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-lightblue transition-colors text-gray-900 ${filters.company ? activeInputClass : inactiveInputClass}`}
                                />
                            </div>
                            <div>
                                <label className={`text-xs font-semibold ${filters.phone ? 'text-brand-blue' : 'text-gray-600'}`}>Teléfono</label>
                                <input
                                    type="text"
                                    name="phone"
                                    placeholder="ej., 9..."
                                    value={filters.phone}
                                    onChange={handleFilterChange}
                                    className={`w-full mt-1 px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-lightblue transition-colors text-gray-900 ${filters.phone ? activeInputClass : inactiveInputClass}`}
                                />
                            </div>
                            <div>
                                <label className={`text-xs font-semibold ${filters.email ? 'text-brand-blue' : 'text-gray-600'}`}>Correo</label>
                                <input
                                    type="text"
                                    name="email"
                                    placeholder="ej., @..."
                                    value={filters.email}
                                    onChange={handleFilterChange}
                                    className={`w-full mt-1 px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-lightblue transition-colors text-gray-900 ${filters.email ? activeInputClass : inactiveInputClass}`}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
