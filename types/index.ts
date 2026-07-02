export type MileEntry = {
  id: string;
  miles: number;
  date: string;
};

export type ReceiptKind = 'expense' | 'document';

export type Vehicle = {
  id: string;
  nickname: string;
  createdAt: string;
};

export type Receipt = {
  id: string;
  vehicleId: string;
  imageUri: string;
  mimeType?: string;
  fileName?: string;
  amount: string;
  category: string;
  kind: ReceiptKind;
  date: string;
  issuer?: string;
  docNumber?: string;
  effectiveDate?: string;   // YYYY-MM-DD
  expirationDate?: string;  // YYYY-MM-DD
  notes?: string;
};

export type Theme = {
  id: string;
  label: string;
  emoji: string;
  bg: string;
  surface: string;
  accent: string;
  text: string;
  muted: string;
};
