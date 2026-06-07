export const STORAGE_KEYS = {
  MILES:    'trackmoto_entries',
  RECEIPTS: 'trackmoto_receipts',
  THEME:    'trackmoto_theme',
} as const;

export const CATEGORIES = ['Gas', 'Food', 'Supplies', 'Maintenance', 'Other'] as const;

export type Category = typeof CATEGORIES[number];
