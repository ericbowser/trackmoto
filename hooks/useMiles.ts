import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MileEntry } from '@/types';
import { STORAGE_KEYS } from '@/constants/app';

export function useMiles() {
  const [entries, setEntries] = useState<MileEntry[]>([]);

  useEffect(() => { load(); }, []);
  useEffect(() => { save(); }, [entries]);

  const load = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.MILES);
      if (saved) setEntries(JSON.parse(saved));
    } catch (e) { console.error('useMiles load:', e); }
  };

  const save = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MILES, JSON.stringify(entries));
    } catch (e) { console.error('useMiles save:', e); }
  };

  const addEntry = (miles: number) => {
    setEntries(prev => [{
      id: Date.now().toString(),
      miles,
      date: new Date().toLocaleTimeString(),
    }, ...prev]);
  };

  const updateEntry = (id: string, miles: number) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, miles } : e));
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const totalMiles = entries.reduce((sum, e) => sum + e.miles, 0);

  return { entries, addEntry, updateEntry, deleteEntry, totalMiles };
}
