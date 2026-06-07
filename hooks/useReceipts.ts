import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Receipt } from '@/types';
import { STORAGE_KEYS } from '@/constants/app';

export function useReceipts() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  useEffect(() => { load(); }, []);
  useEffect(() => { save(); }, [receipts]);

  const load = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.RECEIPTS);
      if (saved) setReceipts(JSON.parse(saved));
    } catch (e) { console.error('useReceipts load:', e); }
  };

  const save = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
    } catch (e) { console.error('useReceipts save:', e); }
  };

  const addReceipt = (receipt: Omit<Receipt, 'id' | 'date'>) => {
    setReceipts(prev => [{
      ...receipt,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
    }, ...prev]);
  };

  const deleteReceipt = (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
  };

  return { receipts, addReceipt, deleteReceipt };
}
