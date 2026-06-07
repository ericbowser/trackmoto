export type MileEntry = {
  id: string;
  miles: number;
  date: string;
};

export type Receipt = {
  id: string;
  imageUri: string;
  amount: string;
  category: string;
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
