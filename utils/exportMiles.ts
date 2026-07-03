import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';
import type { MileEntry } from '@/types';

function escapeCsv(value: string): string {
  const needsQuotes = /[",\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function milesToCsv(
  entries: MileEntry[],
  vehicleNames: Record<string, string> = {},
): string {
  const lines: string[] = ['vehicle,date,miles'];
  for (const e of entries) {
    const vehicle = vehicleNames[e.vehicleId] ?? e.vehicleId;
    lines.push([escapeCsv(vehicle), escapeCsv(e.date), String(e.miles)].join(','));
  }
  return lines.join('\n') + '\n';
}

export async function shareMilesCsv(
  entries: MileEntry[],
  vehicleNames: Record<string, string> = {},
): Promise<void> {
  const csv = milesToCsv(entries, vehicleNames);

  // Prefer sharing a real file so it can be saved to Drive/Downloads.
  if (await Sharing.isAvailableAsync()) {
    const fileName = `trackmoto-miles-${new Date().toISOString().slice(0, 10)}.csv`;
    const uri = (FileSystem.documentDirectory ?? '') + fileName;
    await FileSystem.writeAsStringAsync(uri, csv);
    await Sharing.shareAsync(uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export miles CSV',
    });
    return;
  }

  // Fallback: share as text message.
  await Share.share({ message: csv, title: 'TrackMoto miles export' });
}

