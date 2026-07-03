import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MileEntry } from '@/types';
import { STORAGE_KEYS } from '@/constants/app';

function normalizeEntry(raw: MileEntry): MileEntry {
  return {
    ...raw,
    vehicleId: raw.vehicleId ?? 'default',
  };
}

export function useMiles() {
  const [entries, setEntries] = useState<MileEntry[]>([]);
  const isLoaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.MILES);
        if (saved) {
          setEntries((JSON.parse(saved) as MileEntry[]).map(normalizeEntry));
        }
      } catch (e) {
        console.error('useMiles load:', e);
      } finally {
        isLoaded.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    if (!isLoaded.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.MILES, JSON.stringify(entries)).catch(e =>
      console.error('useMiles save:', e),
    );
  }, [entries]);

  const addEntry = (miles: number, vehicleId: string) => {
    setEntries(prev => [{
      id: Date.now().toString(),
      vehicleId: vehicleId || 'default',
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

  return { entries, addEntry, updateEntry, deleteEntry };
}
