export type MileEntry = {
  id: string;
  miles: number;
  date: string;
};

export type ReceiptKind = 'expense' | 'document';

export type Receipt = {
  id: string;
  imageUri: string;
  mimeType?: string;
  fileName?: string;
  amount: string;
  category: string;
  kind: ReceiptKind;
  date: string;
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
