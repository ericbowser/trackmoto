import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MileEntry } from '@/types';
import { STORAGE_KEYS } from '@/constants/app';
import { LEGACY_MILE_ANCHOR_DATE, parseLegacyTimeOntoDay } from '@/utils/dates';

type RawMileEntry = Partial<MileEntry> & {
  id?: string;
  miles?: number;
  vehicleId?: string;
  date?: string;
  loggedAt?: string;
};

function normalizeEntry(raw: RawMileEntry): MileEntry | null {
  if (!raw.id || typeof raw.miles !== 'number' || Number.isNaN(raw.miles)) return null;

  const legacyTimeLabel = raw.date?.trim();
  const hasLegacyTimeLabel = Boolean(
    legacyTimeLabel && !/\d{4}-\d{2}-\d{2}|T/.test(legacyTimeLabel),
  );

  let loggedAt = raw.loggedAt;
  if (hasLegacyTimeLabel) {
    const fromLegacy = parseLegacyTimeOntoDay(legacyTimeLabel!, LEGACY_MILE_ANCHOR_DATE);
    loggedAt = (fromLegacy ?? LEGACY_MILE_ANCHOR_DATE).toISOString();
  } else if (!loggedAt || Number.isNaN(new Date(loggedAt).getTime())) {
    loggedAt = new Date().toISOString();
  }

  return {
    id: String(raw.id),
    vehicleId: raw.vehicleId ?? 'default',
    miles: raw.miles,
    loggedAt,
    date: raw.date,
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
          const parsed = JSON.parse(saved) as RawMileEntry[];
          setEntries(parsed.map(normalizeEntry).filter((e): e is MileEntry => e !== null));
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
    const now = new Date();
    setEntries(prev => [{
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      vehicleId: vehicleId || 'default',
      miles,
      loggedAt: now.toISOString(),
    }, ...prev]);
  };

  const updateEntry = (id: string, miles: number) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, miles } : e));
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const deleteEntriesForVehicle = (vehicleId: string) => {
    setEntries(prev => prev.filter(e => e.vehicleId !== vehicleId));
  };

  return { entries, addEntry, updateEntry, deleteEntry, deleteEntriesForVehicle };
}
