
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Contact } from './types';
import { db } from './services/dbService';
import { verifyContactPosition } from './services/geminiService';
import { initialContacts } from './data/initialData';
import Header from './components/Header';
import ContactList from './components/ContactList';
import ContactForm from './components/ContactForm';
import VerificationModal from './components/VerificationModal';
import TagManager from './components/TagManager';
import BulkActionBar from './components/BulkActionBar';
import BulkActionModal from './components/BulkActionModal';
import ImportReviewModal from './components/ImportReviewModal';
import SettingsModal from './components/SettingsModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import DirectoryModal from './components/DirectoryModal';
import { PlusIcon } from './components/icons/PlusIcon';
import { downloadCSV, downloadJSON, downloadXLSX } from './utils/exportUtils';
import { createMailtoUrl } from './utils/messagingUtils';
import { processFileWithGemini } from './services/smartImportService';
import Login from './components/Login';
import { useAuth } from './contexts/AuthContext';

export interface Filters {
    name: string;
    position: string;
    company: string;
    phone: string;
    email: string;
}

const App: React.FC = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [allTags, setAllTags] = useState<string[]>([]);
    const [filters, setFilters] = useState<Filters>({
        name: '',
        position: '',
        company: '',
        phone: '',
        email: '',
    });
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [verifyingContact, setVerifyingContact] = useState<Contact | null>(null);
    const [verificationResult, setVerificationResult] = useState<{ text: string; sources: string[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [currentView, setCurrentView] = useState<'contacts' | 'tags'>('contacts');

    // View Mode for Contacts (Card or Table)
    const [contactViewMode, setContactViewMode] = useState<'card' | 'table'>('card');

    const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
    const [bulkActionState, setBulkActionState] = useState<{ open: boolean; type: 'whatsapp' | 'email'; contacts: Contact[] }>({ open: false, type: 'whatsapp', contacts: [] });

    // Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [importBatchSize, setImportBatchSize] = useState<number>(() => {
        const saved = localStorage.getItem('importBatchSize');
        return saved ? parseInt(saved, 10) : 20;
    });

    // Delete Confirmation State
    const [deleteConfirmationState, setDeleteConfirmationState] = useState<{ isOpen: boolean; contact: Contact | null }>({ isOpen: false, contact: null });

    // State for Smart Import
    const [importState, setImportState] = useState<{
        isOpen: boolean;
        isLoading: boolean;
        contacts: Omit<Contact, 'id'>[];
        fileName: string;
    }>({ isOpen: false, isLoading: false, contacts: [], fileName: '' });

    // Directory Modal State
    const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);

    const loadContactsAndTags = useCallback(async () => {
        setIsLoading(true);
        try {
            let count = await db.contacts.count();
            // Only seed if empty and NOT triggered by a clear action
            if (count === 0) {
                await db.contacts.bulkAdd(initialContacts);
                localStorage.setItem('appHasRunBefore', 'true');
            }
            const dbContacts = await db.contacts.toArray();
            setContacts(dbContacts);

            const tags = new Set<string>();
            dbContacts.forEach(c => c.tags.forEach(t => tags.add(t)));
            setAllTags(Array.from(tags).sort());
        } catch (error) {
            console.error("Failed to load contacts:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadContactsAndTags();
    }, [loadContactsAndTags]);

    const handleSaveBatchSize = (size: number) => {
        setImportBatchSize(size);
        localStorage.setItem('importBatchSize', size.toString());
    };

    const handleClearDatabase = async () => {
        try {
            await db.contacts.clear();
            // Prevent auto-seeding on reload
            localStorage.setItem('appHasRunBefore', 'true');
            setContacts([]);
            setAllTags([]);
            setSelectedContactIds([]);
            // UI Feedback handled in Modal
        } catch (error) {
            console.error("Error clearing database:", error);
            throw error;
        }
    };

    const handleRestoreDefaults = async () => {
        try {
            await db.contacts.clear();
            await db.contacts.bulkAdd(initialContacts);
            localStorage.setItem('appHasRunBefore', 'true');
            await loadContactsAndTags();
            // UI Feedback handled in Modal
        } catch (error) {
            console.error("Error restoring defaults:", error);
            throw error;
        }
    };

    const filteredContacts = useMemo(() => {
        const lowercasedFilters = {
            name: filters.name.toLowerCase(),
            position: filters.position.toLowerCase(),
            company: filters.company.toLowerCase(),
            phone: filters.phone.toLowerCase(),
            email: filters.email.toLowerCase(),
        };

        return contacts.filter(contact => {
            const matchesName = lowercasedFilters.name ? contact.name.toLowerCase().includes(lowercasedFilters.name) : true;
            const matchesPosition = lowercasedFilters.position ? contact.positions.some(p => p.toLowerCase().includes(lowercasedFilters.position)) : true;
            const matchesCompany = lowercasedFilters.company ? contact.company.toLowerCase().includes(lowercasedFilters.company) : true;
            const matchesPhone = lowercasedFilters.phone ? contact.phones.some(p => p.includes(lowercasedFilters.phone)) : true;
            const matchesEmail = lowercasedFilters.email ? contact.emails.some(e => e.toLowerCase().includes(lowercasedFilters.email)) : true;
            const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => contact.tags.includes(tag));

            return matchesName && matchesPosition && matchesCompany && matchesPhone && matchesEmail && matchesTags;
        });
    }, [contacts, filters, selectedTags]);

    const tagCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        contacts.forEach(contact => {
            contact.tags.forEach(tag => {
                counts[tag] = (counts[tag] || 0) + 1;
            });
        });
        return counts;
    }, [contacts]);

    const handleSaveContact = async (contact: Contact) => {
        if (contact.id) {
            await db.contacts.update(contact.id, contact);
        } else {
            await db.contacts.add(contact);
        }
        await loadContactsAndTags();
        setIsFormOpen(false);
        setEditingContact(null);
    };

    const handleDeleteContact = (id: number) => {
        const contact = contacts.find(c => c.id === id);
        if (contact) {
            setDeleteConfirmationState({ isOpen: true, contact });
        }
    };

    const handleConfirmDelete = async () => {
        if (deleteConfirmationState.contact?.id) {
            await db.contacts.delete(deleteConfirmationState.contact.id);
            setSelectedContactIds(prev => prev.filter(selectedId => selectedId !== deleteConfirmationState.contact!.id));
            await loadContactsAndTags();
            setDeleteConfirmationState({ isOpen: false, contact: null });
        }
    };

    const handleEditContact = (contact: Contact) => {
        setEditingContact(contact);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingContact(null);
        setIsFormOpen(true);
    };

    const handleVerify = async (contact: Contact) => {
        setVerifyingContact(contact);
        setIsVerifying(true);
        try {
            const result = await verifyContactPosition(contact.name, contact.positions.join(', '));
            setVerificationResult(result);
        } catch (error) {
            console.error("Verification failed:", error);
            setVerificationResult({ text: `Ocurrió un error durante la verificación: ${error instanceof Error ? error.message : String(error)}`, sources: [] });
        } finally {
            setIsVerifying(false);
        }
    };

    const handleExport = (format: 'csv' | 'json' | 'xlsx', scope: 'filtered' | 'all') => {
        const dataToExport = scope === 'all' ? contacts : filteredContacts;
        if (format === 'csv') downloadCSV(dataToExport);
        else if (format === 'json') downloadJSON(dataToExport);
        else if (format === 'xlsx') downloadXLSX(dataToExport);
    };

    // --- Smart Import Logic ---
    const handleImportFile = async (file: File) => {
        setImportState({ isOpen: true, isLoading: true, contacts: [], fileName: file.name });
        try {
            const extractedContacts = await processFileWithGemini(file, importBatchSize);
            setImportState(prev => ({ ...prev, isLoading: false, contacts: extractedContacts }));
        } catch (error) {
            console.error("Import failed:", error);
            alert(`Error durante la importación inteligente: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            setImportState({ isOpen: false, isLoading: false, contacts: [], fileName: '' });
        }
    };

    const handleConfirmImport = async (finalContacts: Omit<Contact, 'id'>[]) => {
        try {
            if (finalContacts.length > 0) {
                await db.contacts.bulkAdd(finalContacts as Contact[]);
                await loadContactsAndTags();
                alert(`¡Éxito! Se han importado ${finalContacts.length} contactos.`);
            }
        } catch (error) {
            console.error("Failed to save imported contacts:", error);
            alert('Error al guardar los contactos en la base de datos.');
        } finally {
            setImportState({ isOpen: false, isLoading: false, contacts: [], fileName: '' });
        }
    };

    const handleAddNewTag = (tagName: string) => {
        const trimmedTag = tagName.trim();
        if (trimmedTag && !allTags.some(t => t.toLowerCase() === trimmedTag.toLowerCase())) {
            setAllTags(prevTags => [...prevTags, trimmedTag].sort());
        }
    };

    const handleEditTag = async (oldTag: string, newTag: string) => {
        if (!newTag || oldTag === newTag) return;
        const contactsToUpdate = await db.contacts.whereTagsEquals(oldTag);
        const updates = contactsToUpdate.map(c => {
            const newTags = c.tags.map(t => t === oldTag ? newTag : t);
            return { ...c, tags: newTags };
        });
        await db.contacts.bulkPut(updates);
        await loadContactsAndTags();
    };

    const handleDeleteTag = async (tagToDelete: string) => {
        const contactsToUpdate = await db.contacts.whereTagsEquals(tagToDelete);
        if (!window.confirm(`¿Estás seguro de que quieres eliminar la etiqueta "${tagToDelete}"? Se quitará de ${contactsToUpdate.length} contactos.`)) {
            return;
        }
        const updates = contactsToUpdate.map(c => {
            const newTags = c.tags.filter(t => t !== tagToDelete);
            return { ...c, tags: newTags };
        });
        await db.contacts.bulkPut(updates);
        await loadContactsAndTags();
    };

    // --- Optimize Tags Logic ---
    const handleOptimizeTags = async () => {
        const dbContacts = await db.contacts.toArray();
        let changedContactsCount = 0;

        // Map to hold normalization logs for user feedback
        const normalizationMap = new Map<string, string>(); // oldTag -> newTag

        const updates = dbContacts.map(contact => {
            let hasChange = false;
            const uniqueTags = new Set<string>();

            contact.tags.forEach(tag => {
                // 1. Trim whitespace
                // 2. Remove trailing numbers (e.g., "Tag 1" -> "Tag", "Tag 01" -> "Tag")
                // 3. Normalized string
                const normalized = tag.trim().replace(/\s+\d+$/, '');

                if (normalized !== tag && normalized.length > 0) {
                    hasChange = true;
                    normalizationMap.set(tag, normalized);
                    uniqueTags.add(normalized);
                } else {
                    uniqueTags.add(tag);
                }
            });

            if (hasChange) {
                changedContactsCount++;
                return { ...contact, tags: Array.from(uniqueTags) };
            }
            return null;
        }).filter((c): c is Contact => c !== null);

        if (updates.length > 0) {
            const message = `Se encontraron etiquetas duplicadas o numeradas (ej. 'Nombre 1').\n\n` +
                `Se actualizarán ${changedContactsCount} contactos y se fusionarán etiquetas.\n\n` +
                `¿Deseas proceder con la optimización?`;

            if (window.confirm(message)) {
                setIsLoading(true);
                try {
                    await db.contacts.bulkPut(updates);
                    await loadContactsAndTags();
                    alert("¡Etiquetas optimizadas y fusionadas correctamente!");
                } catch (e) {
                    console.error(e);
                    alert("Error al optimizar etiquetas.");
                } finally {
                    setIsLoading(false);
                }
            }
        } else {
            alert("Todas las etiquetas parecen estar correctas. No se encontraron duplicados numerados.");
        }
    };

    // --- Tag View Logic ---
    const handleViewContactsByTag = (tag: string) => {
        // Switch to contacts view
        setCurrentView('contacts');
        // Clear existing selections
        setSelectedContactIds([]);
        // Clear text filters to avoid confusion
        setFilters({
            name: '',
            position: '',
            company: '',
            phone: '',
            email: '',
        });
        // Apply tag filter
        setSelectedTags([tag]);
    };

    // --- Selection Handlers ---
    const handleToggleSelectContact = (contactId: number) => {
        setSelectedContactIds(prev =>
            prev.includes(contactId)
                ? prev.filter(id => id !== contactId)
                : [...prev, contactId]
        );
    };

    const handleSelectAllFiltered = () => {
        const allFilteredIds = filteredContacts.map(c => c.id!);
        const allSelected = allFilteredIds.every(id => selectedContactIds.includes(id));
        if (allSelected) {
            setSelectedContactIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
        } else {
            setSelectedContactIds(prev => [...new Set([...prev, ...allFilteredIds])]);
        }
    };

    const handleClearSelection = () => {
        setSelectedContactIds([]);
    };

    const selectedContacts = useMemo(() =>
        contacts.filter(c => c.id && selectedContactIds.includes(c.id)),
        [contacts, selectedContactIds]
    );

    // --- Bulk Action Handlers ---
    const handleBulkEmail = (contactsForAction: Contact[]) => {
        const emails = contactsForAction.flatMap(c => c.emails).filter(Boolean);
        if (emails.length === 0) {
            alert('Ninguno de los contactos seleccionados tiene una dirección de correo electrónico.');
            return;
        }
        window.location.href = createMailtoUrl(emails);
    };

    const handleBulkWhatsApp = (contactsForAction: Contact[]) => {
        const contactsWithPhones = contactsForAction.filter(c => c.phones.length > 0);
        if (contactsWithPhones.length === 0) {
            alert('Ninguno de los contactos seleccionados tiene un número de teléfono.');
            return;
        }
        setBulkActionState({ open: true, type: 'whatsapp', contacts: contactsWithPhones });
    };

    const { session, signOut, user } = useAuth();

    // Login Guard
    if (!session) {
        return (
            <>
                <Login onOpenDirectory={() => setIsDirectoryOpen(true)} />
                <DirectoryModal
                    isOpen={isDirectoryOpen}
                    onClose={() => setIsDirectoryOpen(false)}
                    isAdmin={false}
                />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-brand-bg text-gray-800 font-sans">
            <Header
                currentView={currentView}
                onViewChange={(view) => {
                    setCurrentView(view);
                    handleClearSelection();
                }}
                contactViewMode={contactViewMode}
                onContactViewModeChange={setContactViewMode}
                filters={filters}
                onFiltersChange={setFilters}
                allTags={allTags}
                selectedTags={selectedTags}
                onSelectedTagsChange={setSelectedTags}
                onImport={handleImportFile}
                onExport={handleExport}
                onBulkEmail={() => handleBulkEmail(filteredContacts)}
                onBulkWhatsApp={() => handleBulkWhatsApp(filteredContacts)}
                filteredContactsCount={filteredContacts.length}
                totalContactsCount={contacts.length}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenDirectory={() => setIsDirectoryOpen(true)}
            />

            <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                {isLoading ? (
                    <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto mb-4"></div>
                        <p>Cargando contactos de la nube...</p>
                    </div>
                ) : currentView === 'contacts' ? (
                    <ContactList
                        viewMode={contactViewMode}
                        contacts={filteredContacts}
                        selectedContactIds={selectedContactIds}
                        onToggleSelect={handleToggleSelectContact}
                        onSelectAll={handleSelectAllFiltered}
                        onEdit={handleEditContact}
                        onDelete={handleDeleteContact}
                        onVerify={handleVerify}
                    />
                ) : (
                    <TagManager
                        tags={allTags}
                        tagCounts={tagCounts}
                        onAddNewTag={handleAddNewTag}
                        onEditTag={handleEditTag}
                        onDeleteTag={handleDeleteTag}
                        onViewTag={handleViewContactsByTag}
                        onOptimizeTags={handleOptimizeTags}
                    />
                )}
            </main>

            {currentView === 'contacts' && selectedContactIds.length > 0 && (
                <BulkActionBar
                    count={selectedContactIds.length}
                    onEmail={() => handleBulkEmail(selectedContacts)}
                    onWhatsApp={() => handleBulkWhatsApp(selectedContacts)}
                    onClear={handleClearSelection}
                />
            )}

            {currentView === 'contacts' && (
                <button
                    onClick={handleAddNew}
                    className="fixed bottom-6 right-6 bg-brand-blue hover:bg-brand-lightblue text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue z-30"
                    aria-label="Añadir nuevo contacto"
                >
                    <PlusIcon className="h-8 w-8" />
                </button>
            )}

            {isFormOpen && (
                <ContactForm
                    contact={editingContact}
                    onSave={handleSaveContact}
                    onClose={() => {
                        setIsFormOpen(false);
                        setEditingContact(null);
                    }}
                    allTags={allTags}
                    onAddNewTag={handleAddNewTag}
                />
            )}

            {verifyingContact && (
                <VerificationModal
                    contact={verifyingContact}
                    result={verificationResult}
                    isLoading={isVerifying}
                    onClose={() => {
                        setVerifyingContact(null);
                        setVerificationResult(null);
                    }}
                />
            )}

            {bulkActionState.open && (
                <BulkActionModal
                    actionType={bulkActionState.type}
                    contacts={bulkActionState.contacts}
                    onClose={() => setBulkActionState({ ...bulkActionState, open: false })}
                />
            )}

            {importState.isOpen && (
                <ImportReviewModal
                    isLoading={importState.isLoading}
                    extractedContacts={importState.contacts}
                    onConfirm={handleConfirmImport}
                    onClose={() => setImportState({ isOpen: false, isLoading: false, contacts: [], fileName: '' })}
                    fileName={importState.fileName}
                />
            )}

            {isSettingsOpen && (
                <SettingsModal
                    currentBatchSize={importBatchSize}
                    onSaveBatchSize={handleSaveBatchSize}
                    onClearDatabase={handleClearDatabase}
                    onRestoreDefaults={handleRestoreDefaults}
                    onClose={() => setIsSettingsOpen(false)}
                />
            )}

            {deleteConfirmationState.isOpen && deleteConfirmationState.contact && (
                <DeleteConfirmationModal
                    contactName={deleteConfirmationState.contact.name}
                    onConfirm={handleConfirmDelete}
                    onClose={() => setDeleteConfirmationState({ isOpen: false, contact: null })}
                />
            )}

            <DirectoryModal
                isOpen={isDirectoryOpen}
                onClose={() => setIsDirectoryOpen(false)}
                isAdmin={!!session}
            />
        </div>
    );
};

export default App;
