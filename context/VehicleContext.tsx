import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/app';
import type { Vehicle } from '@/types';

export const DEFAULT_VEHICLE: Vehicle = {
  id: 'default',
  nickname: 'My Vehicle',
  createdAt: '2026-01-01',
};

export const DEFAULT_VEHICLE_ID = DEFAULT_VEHICLE.id;

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

  return parsed.length > 0 ? parsed : [DEFAULT_VEHICLE];
}

type VehicleContextValue = {
  vehicles: Vehicle[];
  activeVehicleId: string;
  activeVehicle: Vehicle | undefined;
  setActiveVehicleId: (id: string) => void;
  addVehicle: (nickname: string) => void;
  deleteVehicle: (id: string) => void;
  DEFAULT_VEHICLE_ID: string;
  isReady: boolean;
};

const VehicleContext = createContext<VehicleContextValue | null>(null);

export function VehicleProvider({ children }: { children: React.ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([DEFAULT_VEHICLE]);
  const [activeVehicleId, setActiveVehicleIdState] = useState(DEFAULT_VEHICLE_ID);
  const [isReady, setIsReady] = useState(false);
  const vehiclesLoaded = useRef(false);
  const selectionLoaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const [savedVehicles, savedActive] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.VEHICLES),
          AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_VEHICLE),
        ]);

        const nextVehicles = savedVehicles
          ? normalizeVehicles(JSON.parse(savedVehicles))
          : [DEFAULT_VEHICLE];
        setVehicles(nextVehicles);

        const preferred = savedActive && nextVehicles.some(v => v.id === savedActive)
          ? savedActive
          : nextVehicles[0].id;
        setActiveVehicleIdState(preferred);
      } catch (e) {
        console.error('VehicleProvider load:', e);
      } finally {
        vehiclesLoaded.current = true;
        selectionLoaded.current = true;
        setIsReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!vehiclesLoaded.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles)).catch(e =>
      console.error('VehicleProvider save vehicles:', e),
    );
  }, [vehicles]);

  useEffect(() => {
    if (!selectionLoaded.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_VEHICLE, activeVehicleId).catch(e =>
      console.error('VehicleProvider save active vehicle:', e),
    );
  }, [activeVehicleId]);

  useEffect(() => {
    if (!vehiclesLoaded.current || vehicles.length === 0) return;
    if (vehicles.some(v => v.id === activeVehicleId)) return;
    setActiveVehicleIdState(vehicles[0].id);
  }, [vehicles, activeVehicleId]);

  const setActiveVehicleId = useCallback((id: string) => {
    setActiveVehicleIdState(prev => (prev === id ? prev : id));
  }, []);

  const addVehicle = useCallback((nickname: string) => {
    const trimmed = nickname.trim();
    if (!trimmed) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setVehicles(prev => [{
      id,
      nickname: trimmed,
      createdAt: new Date().toISOString(),
    }, ...prev]);
    setActiveVehicleIdState(id);
  }, []);

  const deleteVehicle = useCallback((id: string) => {
    setVehicles(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter(v => v.id !== id);
      return next.length > 0 ? next : prev;
    });
  }, []);

  const activeVehicle = useMemo(
    () => vehicles.find(v => v.id === activeVehicleId),
    [vehicles, activeVehicleId],
  );

  const value = useMemo<VehicleContextValue>(() => ({
    vehicles,
    activeVehicleId,
    activeVehicle,
    setActiveVehicleId,
    addVehicle,
    deleteVehicle,
    DEFAULT_VEHICLE_ID,
    isReady,
  }), [
    vehicles,
    activeVehicleId,
    activeVehicle,
    setActiveVehicleId,
    addVehicle,
    deleteVehicle,
    isReady,
  ]);

  return (
    <VehicleContext.Provider value={value}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicles() {
  const ctx = useContext(VehicleContext);
  if (!ctx) {
    throw new Error('useVehicles must be used within a VehicleProvider');
  }
  return ctx;
}
