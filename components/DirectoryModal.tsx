
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';

// Define interfaces for this specific view to match SIT_v2 structure
interface DirectoryContact {
    id: number;
    name: string;
    phones: string[];
    category: string;
    region: string;
    province?: string;
    notes?: string;
    is_hero: boolean;
}

interface DirectoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    isAdmin: boolean; // Computed from parent session
}

// Icon mapping to replicate FontAwesome with SVGs
const Icons = {
    Phone: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
    Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    Close: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>,
    Shield: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, // Simplified shield
    HeartPulse: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
    Gavel: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, // Placeholder for Gavel/Building
    Bolt: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    Admin: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Share: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>,
};

const categoryStyles: Record<string, { icon: React.FC<any>, color: string, bg: string }> = {
    'Seguridad y Rescate': { icon: Icons.Shield, color: 'text-sky-600', bg: 'bg-sky-50' },
    'Salud': { icon: Icons.HeartPulse, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    'Apoyo y Denuncias': { icon: Icons.Gavel, color: 'text-amber-600', bg: 'bg-amber-50' },
    'Seguridad Local': { icon: Icons.Shield, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    'Servicios Públicos': { icon: Icons.Bolt, color: 'text-slate-600', bg: 'bg-slate-50' },
    'default': { icon: Icons.Phone, color: 'text-slate-500', bg: 'bg-slate-50' }
};

const DirectoryModal: React.FC<DirectoryModalProps> = ({ isOpen, onClose, isAdmin }) => {
    const [contacts, setContacts] = useState<DirectoryContact[]>([]);
    const [currentFilter, setCurrentFilter] = useState('all');
    const [currentProvince, setCurrentProvince] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    // Admin Mode State (Toggle inside the modal)
    const [showAdminPanel, setShowAdminPanel] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchContacts();
        }
    }, [isOpen]);

    const fetchContacts = async () => {
        setLoading(true);
        // Supabase select from new table
        const { data, error } = await supabase
            .from('public_directory')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching directory:', error);
            // Optionally handle error UI
        } else if (data) {
            setContacts(data as any[]); // Cast to match interface if needed
        }
        setLoading(false);
    };

    // Filter Logic
    const filteredContacts = useMemo(() => {
        return contacts.filter(item => {
            const inScope = (item.region === 'all' && (currentFilter === 'all' || currentFilter === 'Moquegua' || currentFilter === 'Lima')) || item.region === currentFilter;
            const matchesFilter = currentFilter === 'all' || inScope;

            let matchesProvince = true;
            if (currentFilter === 'Moquegua') {
                matchesProvince = (currentProvince === 'all') || (item.province === currentProvince) || (item.province === 'all' && item.region === 'Moquegua');
            }

            const matchesSearch = !searchTerm ||
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
                item.category.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesFilter && matchesProvince && matchesSearch;
        });
    }, [contacts, currentFilter, currentProvince, searchTerm]);

    const heroContacts = useMemo(() => contacts.filter(c => c.is_hero), [contacts]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-50 w-full max-w-[95vw] h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">

                {/* Header: SIT_v2 Style */}
                <header className="bg-white px-6 py-4 shadow-sm flex justify-between items-center z-10 sticky top-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-sky-100 p-2 rounded-lg text-sky-600">
                            <Icons.Phone />
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Directorio de Emergencias</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {isAdmin && (
                            <button
                                onClick={() => setShowAdminPanel(!showAdminPanel)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${showAdminPanel ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Icons.Admin />
                                    {showAdminPanel ? 'Ver Público' : 'Administrar'}
                                </div>
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500 hover:text-red-500">
                            <Icons.Close />
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">

                    {showAdminPanel ? (
                        /* ADMIN PANEL (Placeholder for CRUD - using user's existing logic style later if needed, but for now simple table) */
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-2xl font-bold mb-6 text-slate-800 border-b pb-4">Gestión de Directorio Público</h2>
                            <p className="text-slate-500 mb-4">Esta tabla administra los datos de {`public_directory`}. Es independiente de tu lista de contactos principal.</p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
                                        <tr>
                                            <th className="px-4 py-3">Nombre</th>
                                            <th className="px-4 py-3">Categoría</th>
                                            <th className="px-4 py-3">Teléfonos</th>
                                            <th className="px-4 py-3">Región</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {contacts.map(c => (
                                            <tr key={c.id} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                                                <td className="px-4 py-3">{c.category}</td>
                                                <td className="px-4 py-3 text-slate-600">{c.phones.join(', ')}</td>
                                                <td className="px-4 py-3 text-slate-500">{c.region}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-8 p-4 bg-amber-50 text-amber-800 rounded-lg text-sm">
                                <strong>Nota:</strong> Para editar o agregar nuevos registros, usa la consola de Supabase SQL por ahora, o solicítame agregar el formulario completo aquí.
                            </div>
                        </div>
                    ) : (
                        /* PUBLIC VIEW (Direct Clone of SIT_v2) */
                        <div className="max-w-7xl mx-auto space-y-8">

                            {/* Hero Section */}
                            {!searchTerm && currentFilter === 'all' && (
                                <section>
                                    <h2 className="text-2xl font-bold text-slate-700 text-center mb-6">Contactos Clave Nacionales</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        {heroContacts.map(hero => {
                                            const style = categoryStyles[hero.category] || categoryStyles['default'];
                                            const Icon = style.icon;
                                            return (
                                                <a href={`tel:${hero.phones[0].replace(/\s/g, '')}`} key={hero.id} className="block bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                                    <div className="flex flex-col items-center text-center">
                                                        <div className={`w-14 h-14 rounded-full ${style.bg} ${style.color} flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition`}>
                                                            <Icon />
                                                        </div>
                                                        <h3 className="text-xl font-bold text-slate-800 mb-1">{hero.name}</h3>
                                                        <p className={`text-2xl font-black ${style.color} tracking-wider`}>{hero.phones[0]}</p>
                                                    </div>
                                                </a>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {/* Filters & Search */}
                            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg border border-slate-100 sticky top-0 z-10">
                                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {[
                                            { id: 'all', label: 'Nacional' },
                                            { id: 'Moquegua', label: 'Región Moquegua' },
                                            { id: 'Lima', label: 'Lima y Callao' }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => { setCurrentFilter(tab.id); setCurrentProvince('all'); }}
                                                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${currentFilter === tab.id ? 'bg-sky-900 text-white shadow-sky-900/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="relative w-full md:w-80">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Icons.Search />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Buscar servicio..."
                                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition outline-none"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Moquegua Sub-tabs */}
                                {currentFilter === 'Moquegua' && (
                                    <div className="mt-5 pt-4 border-t border-slate-100 animate-fadeIn">
                                        <p className="text-sm text-slate-500 mb-3 text-center md:text-left font-medium">Filtrar por provincia:</p>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                            {[
                                                { id: 'all', label: 'Todas' },
                                                { id: 'Mariscal Nieto', label: 'Moquegua' },
                                                { id: 'Ilo', label: 'Ilo' },
                                                { id: 'General Sánchez Cerro', label: 'Gral. Sánchez Cerro' }
                                            ].map(prov => (
                                                <button
                                                    key={prov.id}
                                                    onClick={() => setCurrentProvince(prov.id)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${currentProvince === prov.id ? 'bg-sky-600 text-white border-sky-600' : 'bg-transparent text-slate-600 border-slate-200 hover:border-sky-300 hover:bg-sky-50'}`}
                                                >
                                                    {prov.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Results Grid */}
                            {loading ? (
                                <div className="text-center py-20 text-slate-400">Cargando directorio...</div>
                            ) : filteredContacts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredContacts.map(item => {
                                        const style = categoryStyles[item.category] || categoryStyles['default'];
                                        const Icon = style.icon;

                                        // Province Badge Logic
                                        let provinceBadge = null;
                                        if (currentFilter === 'Moquegua' && item.province && item.province !== 'all') {
                                            const provinceName = item.province === 'Mariscal Nieto' ? 'Moquegua' : item.province === 'General Sánchez Cerro' ? 'G.S. Cerro' : item.province;
                                            provinceBadge = <span className="absolute top-4 right-12 bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-indigo-100">{provinceName}</span>;
                                        }

                                        return (
                                            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group">
                                                <button className="absolute top-4 right-4 text-slate-300 hover:text-sky-600 transition p-1">
                                                    <Icons.Share />
                                                </button>
                                                {provinceBadge}

                                                <div className="flex items-start gap-4 mb-4">
                                                    <div className={`p-3 rounded-xl ${style.bg} ${style.color}`}>
                                                        <Icon />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 leading-tight mb-1">{item.name}</h3>
                                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{item.category}</p>
                                                    </div>
                                                </div>

                                                <p className="text-sm text-slate-600 mb-6 flex-grow leading-relaxed">{item.notes}</p>

                                                <div className="mt-auto border-t border-slate-50 pt-4">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Números de Emergencia</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.phones.map((phone, idx) => (
                                                            <a
                                                                key={idx}
                                                                href={`tel:${phone.replace(/\s/g, '')}`}
                                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-sky-600 hover:text-white text-slate-700 rounded-lg text-sm font-semibold transition-colors duration-200"
                                                            >
                                                                <Icons.Phone />
                                                                {phone}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                                    <p className="text-slate-500 text-lg">No se encontraron resultados para tu búsqueda.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DirectoryModal;
