import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Receipt } from '@/types';
import { STORAGE_KEYS, isLegalCategory } from '@/constants/app';

function normalizeReceipt(raw: Receipt): Receipt {
  return {
    ...raw,
    kind: raw.kind ?? (isLegalCategory(raw.category) ? 'document' : 'expense'),
  };
}

export function useReceipts() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const isLoaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.RECEIPTS);
        if (saved) {
          setReceipts((JSON.parse(saved) as Receipt[]).map(normalizeReceipt));
        }
      } catch (e) {
        console.error('useReceipts load:', e);
      } finally {
        isLoaded.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    if (!isLoaded.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts)).catch(e =>
      console.error('useReceipts save:', e),
    );
  }, [receipts]);

  const addReceipt = (receipt: Omit<Receipt, 'id' | 'date' | 'kind'> & { kind?: Receipt['kind'] }) => {
    const kind = receipt.kind ?? (isLegalCategory(receipt.category) ? 'document' : 'expense');
    setReceipts(prev => [{
      ...receipt,
      kind,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
    }, ...prev]);
  };

  const deleteReceipt = (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
  };

  const getLatestByCategory = (category: string) =>
    receipts.find(r => r.category === category);

  return { receipts, addReceipt, deleteReceipt, getLatestByCategory };
};
