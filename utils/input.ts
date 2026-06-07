export function sanitizeMilesInput(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const dotIndex = cleaned.indexOf('.');
  if (dotIndex === -1) return cleaned;
  return cleaned.slice(0, dotIndex + 1) + cleaned.slice(dotIndex + 1).replace(/\./g, '');
}

export function parseMilesInput(text: string): number {
  if (!text || text === '.') return 0;
  const value = Number(text);
  return isNaN(value) ? 0 : value;
}
