export const STORAGE_KEYS = {
  MILES:    'trackmoto_entries',
  RECEIPTS: 'trackmoto_receipts',
  THEME:    'trackmoto_theme',
  APP_ICON: 'trackmoto_app_icon',
  VEHICLES: 'trackmoto_vehicles',
} as const;

export const EXPENSE_CATEGORIES = [
  'Gas', 'Food', 'Supplies', 'Maintenance', 'Parking', 'Other',
] as const;

export const LEGAL_CATEGORIES = [
  'Registration', 'Insurance', 'License', 'Inspection', 'Title', 'Other Legal',
] as const;

/** One-tap access for roadside checks */
export const QUICK_ACCESS_CATEGORIES = ['Registration', 'Insurance'] as const;

export const CATEGORY_GROUPS = [
  { id: 'expense', label: 'Trip expenses', categories: EXPENSE_CATEGORIES },
  { id: 'legal',   label: 'Legal & registration', categories: LEGAL_CATEGORIES },
] as const;

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...LEGAL_CATEGORIES] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type LegalCategory   = typeof LEGAL_CATEGORIES[number];
export type Category        = typeof ALL_CATEGORIES[number];

export function isLegalCategory(category: string): boolean {
  return (LEGAL_CATEGORIES as readonly string[]).includes(category);
}

export function isExpenseCategory(category: string): boolean {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(category);
}

/** @deprecated Use ALL_CATEGORIES or CATEGORY_GROUPS */
export const CATEGORIES = ALL_CATEGORIES;
