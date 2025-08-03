import { useState, useEffect } from 'react';
import { supabase, TimeEntry } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useTimeEntries = (startDate?: string, endDate?: string) => {
  const { user } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeEntries = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        setError(error.message);
        return;
      }

      setTimeEntries(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createTimeEntry = async (entry: Omit<TimeEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert([{ ...entry, user_id: user.id }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setTimeEntries(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create time entry');
      return null;
    }
  };

  const updateTimeEntry = async (id: string, updates: Partial<TimeEntry>) => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setTimeEntries(prev => prev.map(entry => entry.id === id ? data : entry));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update time entry');
      return null;
    }
  };

  const deleteTimeEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      setTimeEntries(prev => prev.filter(entry => entry.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete time entry');
      return false;
    }
  };

  useEffect(() => {
    fetchTimeEntries();
  }, [user, startDate, endDate]);

  return {
    timeEntries,
    loading,
    error,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    refetch: fetchTimeEntries
  };
};