import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/app';
import type { Vehicle } from '@/types';

const DEFAULT_VEHICLE: Vehicle = {
  id: 'default',
  nickname: 'My Vehicle',
  createdAt: '2026-01-01',
};

function normalizeVehicles(raw: unknown): Vehicle[] {
  if (!Array.isArray(raw)) return [DEFAULT_VEHICLE];
  const parsed = raw
    .filter(Boolean)
    .map((v: any) => ({
      id: typeof v.id === 'string' ? v.id : String(v.id ?? ''),
      nickname: typeof v.nickname === 'string' ? v.nickname : String(v.nickname ?? ''),
      createdAt: typeof v.createdAt === 'string' ? v.createdAt : new Date().toISOString(),
    }))
    .filter(v => v.id && v.nickname);

  const hasDefault = parsed.some(v => v.id === DEFAULT_VEHICLE.id);
  return hasDefault ? parsed : [DEFAULT_VEHICLE, ...parsed];
}

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([DEFAULT_VEHICLE]);
  const isLoaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.VEHICLES);
        if (saved) setVehicles(normalizeVehicles(JSON.parse(saved)));
      } catch (e) {
        console.error('useVehicles load:', e);
      } finally {
        isLoaded.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    if (!isLoaded.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles)).catch(e =>
      console.error('useVehicles save:', e),
    );
  }, [vehicles]);

  const addVehicle = (nickname: string) => {
    const trimmed = nickname.trim();
    if (!trimmed) return;
    setVehicles(prev => [{
      id: Date.now().toString(),
      nickname: trimmed,
      createdAt: new Date().toISOString(),
    }, ...prev]);
  };

  const deleteVehicle = (id: string) => {
    if (id === DEFAULT_VEHICLE.id) return;
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  return { vehicles, addVehicle, deleteVehicle, DEFAULT_VEHICLE_ID: DEFAULT_VEHICLE.id };
}

