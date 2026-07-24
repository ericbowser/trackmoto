import { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Modal, Alert,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAppIcon } from '@/context/AppIconContext';
import { useMiles } from '@/hooks/useMiles';
import { useVehicles } from '@/hooks/useVehicles';
import { sanitizeMilesInput, parseMilesInput } from '@/utils/input';
import { shareMilesCsv } from '@/utils/exportMiles';
import { formatMileEntryWhen, isSameLocalDay } from '@/utils/dates';
import ThemePicker from '@/components/ThemePicker';
import VehicleSelector from '@/components/vehicles/VehicleSelector';
import type { MileEntry } from '@/types';

export default function MilesScreen() {
  const { theme } = useTheme();
  const { appIcon } = useAppIcon();
  const { entries, addEntry, updateEntry, deleteEntry } = useMiles();
  const { vehicles, activeVehicleId, activeVehicle } = useVehicles();

  const [miles, setMiles] = useState('');
  const [editEntry, setEditEntry] = useState<MileEntry | null>(null);
  const [editMiles, setEditMiles] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [themePickerVisible, setThemePickerVisible] = useState(false);

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const vehicleEntries = useMemo(
    () => entries.filter(e => e.vehicleId === activeVehicleId),
    [entries, activeVehicleId],
  );
  const todayEntries = useMemo(
    () => vehicleEntries.filter(e => isSameLocalDay(e.loggedAt)),
    [vehicleEntries],
  );
  const todayMiles = todayEntries.reduce((sum, e) => sum + e.miles, 0);
  const lifetimeMiles = vehicleEntries.reduce((sum, e) => sum + e.miles, 0);
  const vehicleNameMap = useMemo(
    () => Object.fromEntries(vehicles.map(v => [v.id, v.nickname])),
    [vehicles],
  );

  const pendingMiles = parseMilesInput(miles);
  const isTyping     = miles.length > 0;
  const displayToday = todayMiles + pendingMiles;

  const handleMilesChange     = (text: string) => setMiles(sanitizeMilesInput(text));
  const handleEditMilesChange = (text: string) => setEditMiles(sanitizeMilesInput(text));

  const logMiles = () => {
    const value = parseMilesInput(miles);
    if (!miles || value <= 0) return;
    addEntry(value, activeVehicleId);
    setMiles('');
  };

  const openEdit = (entry: MileEntry) => {
    setEditEntry(entry);
    setEditMiles(entry.miles.toString());
    setEditModalVisible(true);
  };

  const saveEdit = () => {
    const value = parseMilesInput(editMiles);
    if (!editEntry || !editMiles || value <= 0) return;
    updateEntry(editEntry.id, value);
    setEditModalVisible(false);
    setEditEntry(null);
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete Entry', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(id) },
    ]);
  };

  const handleExportMiles = async () => {
    if (vehicleEntries.length === 0) {
      Alert.alert('Nothing to export', 'Log at least one entry for this vehicle first.');
      return;
    }
    try {
      await shareMilesCsv(vehicleEntries, vehicleNameMap);
    } catch {
      Alert.alert('Export failed', 'Could not export miles. Try again.');
    }
  };

  const todayHint = isTyping
    ? `${todayMiles.toFixed(1)} logged today + ${miles} mi`
    : todayMiles > 0
      ? `${lifetimeMiles.toFixed(1)} mi all time`
      : 'No miles logged today';

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.appName, { color: theme.text }]} numberOfLines={1}>
            Track Moto {appIcon.emoji}
          </Text>
          <Text style={[styles.date, { color: theme.muted }]} numberOfLines={1}>{todayLabel}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.surface }]}
            onPress={handleExportMiles}
            accessibilityLabel="Export miles CSV">
            <Text style={styles.iconBtnIcon}>⬇️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.surface }]}
            onPress={() => setThemePickerVisible(true)}
            accessibilityLabel="Change theme">
            <Text style={styles.iconBtnIcon}>🎨</Text>
          </TouchableOpacity>
        </View>
      </View>

      <VehicleSelector />

      <View style={[styles.totalCard, { backgroundColor: theme.surface }]}>
        <Text style={[styles.totalLabel, { color: theme.muted }]}>
          Today's Miles{activeVehicle ? ` · ${activeVehicle.nickname}` : ''}
        </Text>
        <Text style={[styles.totalMiles, { color: theme.accent }]}>
          {displayToday.toFixed(1)}
        </Text>
        <Text style={[styles.totalHint, { color: theme.muted }]}>{todayHint}</Text>
      </View>

      <FlatList
        style={styles.list}
        data={todayEntries}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={[styles.entry, { backgroundColor: theme.surface }]}>
            <TouchableOpacity onPress={() => openEdit(item)} style={styles.entryInfo}>
              <Text style={[styles.entryMiles, { color: theme.text }]}>{item.miles} mi</Text>
              <Text style={[styles.entryTime,  { color: theme.muted }]}>
                {formatMileEntryWhen(item.loggedAt)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteBtn, { backgroundColor: theme.accent }]}
              onPress={() => confirmDelete(item.id)}>
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No trips logged today</Text>
            <Text style={[styles.emptyBody, { color: theme.muted }]}>
              Enter miles below and tap Log. Older entries stay in your export.
            </Text>
          </View>
        }
      />

      <View style={styles.logBar}>
        <View style={[
          styles.inputWrap,
          { backgroundColor: theme.surface, borderColor: isTyping ? theme.accent : 'transparent' },
        ]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Miles"
            placeholderTextColor={theme.muted}
            keyboardType="decimal-pad"
            value={miles}
            onChangeText={handleMilesChange}
            maxLength={8}
          />
        </View>
        <TouchableOpacity style={[styles.logBtn, { backgroundColor: theme.accent }]} onPress={logMiles}>
          <Text style={styles.logBtnText}>Log</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Miles</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.bg, color: theme.text }]}
              keyboardType="decimal-pad"
              value={editMiles}
              onChangeText={handleEditMilesChange}
              placeholderTextColor={theme.muted}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: theme.bg }]}
                onPress={() => setEditModalVisible(false)}>
                <Text style={[styles.cancelText, { color: theme.muted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.accent }]}
                onPress={saveEdit}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ThemePicker visible={themePickerVisible} onClose={() => setThemePickerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1 },
  header:        {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerText:    { flex: 1 },
  headerActions: { flexDirection: 'row', gap: 8 },
  appName:       { fontSize: 22, fontWeight: 'bold' },
  date:          { fontSize: 13, marginTop: 2 },
  iconBtn:       { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  iconBtnIcon:   { fontSize: 18 },
  totalCard:     { marginHorizontal: 16, marginBottom: 8, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, alignItems: 'center' },
  totalLabel:    { fontSize: 13 },
  totalMiles:    { fontSize: 48, fontWeight: 'bold', lineHeight: 52 },
  totalHint:     { fontSize: 12, marginTop: 4 },
  list:          { flex: 1 },
  listContent:   { paddingBottom: 8, flexGrow: 1 },
  entry:         { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 12 },
  entryInfo:     { flex: 1 },
  entryMiles:    { fontSize: 16, fontWeight: '600' },
  entryTime:     { fontSize: 13, marginTop: 2 },
  deleteBtn:     { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  deleteBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  emptyCard:     { marginHorizontal: 16, marginTop: 8, padding: 14, borderRadius: 12 },
  emptyTitle:    { fontSize: 15, fontWeight: '800' },
  emptyBody:     { marginTop: 4, fontSize: 13, lineHeight: 18 },
  logBar:        {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 10,
    gap: 10,
  },
  inputWrap:     { flex: 1, borderRadius: 12, borderWidth: 2, overflow: 'hidden' },
  input:         { paddingHorizontal: 14, paddingVertical: 14, fontSize: 18, fontWeight: '600' },
  logBtn:        { paddingHorizontal: 22, borderRadius: 12, justifyContent: 'center' },
  logBtnText:    { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard:     { borderRadius: 16, padding: 24, margin: 16 },
  modalTitle:    { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  modalInput:    { padding: 14, borderRadius: 12, fontSize: 16, marginBottom: 16 },
  modalButtons:  { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn:     { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  cancelText:    { fontWeight: 'bold' },
  saveBtn:       { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  saveText:      { color: '#fff', fontWeight: 'bold' },
});
