import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/app';

export type AppIconId = 'moto' | 'sedan' | 'suv';

export type AppIcon = {
  id: AppIconId;
  emoji: string;
  label: string;
};

export const APP_ICONS: Record<AppIconId, AppIcon> = {
  moto:  { id: 'moto',  emoji: '🏍️', label: 'Motorcycle' },
  sedan: { id: 'sedan', emoji: '🚗', label: 'Sedan' },
  suv:   { id: 'suv',   emoji: '🚙', label: 'SUV' },
};

type AppIconContextValue = {
  appIcon: AppIcon;
  setAppIcon: (id: AppIconId) => void;
};

const AppIconContext = createContext<AppIconContextValue>({
  appIcon: APP_ICONS.moto,
  setAppIcon: () => {},
});

export function useAppIcon() {
  return useContext(AppIconContext);
}

export function AppIconProvider({ children }: { children: React.ReactNode }) {
  const [appIcon, setAppIconState] = useState<AppIcon>(APP_ICONS.moto);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.APP_ICON)
      .then((saved) => {
        if (!saved) return;
        const id = saved as AppIconId;
        if (APP_ICONS[id]) setAppIconState(APP_ICONS[id]);
      })
      .catch(() => {});
  }, []);

  const setAppIcon = (id: AppIconId) => {
    const icon = APP_ICONS[id] ?? APP_ICONS.moto;
    setAppIconState(icon);
    AsyncStorage.setItem(STORAGE_KEYS.APP_ICON, icon.id).catch(() => {});
  };

  return (
    <AppIconContext.Provider value={{ appIcon, setAppIcon }}>
      {children}
    </AppIconContext.Provider>
  );
}

