
import { supabase } from '../supabaseClient';
import type { Contact } from '../types';

export const dbService = {
  contacts: {
    async toArray(): Promise<Contact[]> {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },

    async add(contact: Contact): Promise<number> {
      // Remove ID if present (let DB handle it) and ensure arrays are adequate for Postgres
      const { id, ...contactData } = contact;

      const { data, error } = await supabase
        .from('contacts')
        .insert([contactData])
        .select()
        .single();

      if (error) throw error;
      return parseInt(data.id);
    },

    async bulkAdd(contacts: Contact[]): Promise<void> {
      // Prepare data cleaning IDs
      const cleanContacts = contacts.map(({ id, ...rest }) => rest);

      const { error } = await supabase
        .from('contacts')
        .insert(cleanContacts);

      if (error) throw error;
    },

    async update(id: number, contact: Contact): Promise<number> {
      const { id: _, ...contactData } = contact;
      const { error } = await supabase
        .from('contacts')
        .update(contactData)
        .eq('id', id);

      if (error) throw error;
      return id;
    },

    async bulkPut(contacts: Contact[]): Promise<void> {
      // Upsert based on ID
      const { error } = await supabase
        .from('contacts')
        .upsert(contacts);
      if (error) throw error;
    },

    async delete(id: number): Promise<void> {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },

    async count(): Promise<number> {
      const { count, error } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    },

    async clear(): Promise<void> {
      // DANGER: Deletes all rows where ID > 0. 
      // RLS will restrict this to what the user can see/delete.
      const { error } = await supabase.from('contacts').delete().gt('id', 0);
      if (error) throw error;
    },

    // Helpers for compatibility with previous filtered queries
    async whereTagsEquals(tag: string): Promise<Contact[]> {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .contains('tags', [tag]);

      if (error) throw error;
      return data || [];
    },

    async getTagsStats(): Promise<Record<string, number>> {
      // Fetch only tags column to minimize data transfer
      const { data, error } = await supabase
        .from('contacts')
        .select('tags');

      if (error) throw error;

      const stats: Record<string, number> = {};

      data?.forEach(row => {
        if (Array.isArray(row.tags)) {
          row.tags.forEach((tag: string) => {
            stats[tag] = (stats[tag] || 0) + 1;
          });
        }
      });

      return stats;
    }

  }
};

// Backwards compatibility alias if possible, or just use dbService directly
export const db = dbService;