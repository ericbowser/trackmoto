import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Modal, Alert,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useMiles } from '@/hooks/useMiles';
import { sanitizeMilesInput, parseMilesInput } from '@/utils/input';
import ThemePicker from '@/components/ThemePicker';
import type { MileEntry } from '@/types';

export default function MilesScreen() {
  const { theme } = useTheme();
  const { entries, addEntry, updateEntry, deleteEntry, totalMiles } = useMiles();

  const [miles, setMiles] = useState('');
  const [editEntry, setEditEntry] = useState<MileEntry | null>(null);
  const [editMiles, setEditMiles] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [themePickerVisible, setThemePickerVisible] = useState(false);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const pendingMiles = parseMilesInput(miles);
  const isTyping     = miles.length > 0;
  const displayTotal = totalMiles + pendingMiles;

  const handleMilesChange     = (text: string) => setMiles(sanitizeMilesInput(text));
  const handleEditMilesChange = (text: string) => setEditMiles(sanitizeMilesInput(text));

  const logMiles = () => {
    const value = parseMilesInput(miles);
    if (!miles || value <= 0) return;
    addEntry(value);
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

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>

      <View style={styles.header}>
        <View>
          <Text style={[styles.appName, { color: theme.text }]}>TrackMoto 🏍️</Text>
          <Text style={[styles.date, { color: theme.muted }]}>{today}</Text>
        </View>
        <TouchableOpacity
          style={[styles.themeBtn, { backgroundColor: theme.surface }]}
          onPress={() => setThemePickerVisible(true)}>
          <Text style={styles.themeBtnIcon}>🎨</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.totalCard, { backgroundColor: theme.surface }]}>
        <Text style={[styles.totalLabel, { color: theme.muted }]}>Today's Miles</Text>
        <Text style={[styles.totalMiles, { color: theme.accent }]}>
          {displayTotal.toFixed(1)}
        </Text>
        {isTyping && (
          <Text style={[styles.totalHint, { color: theme.muted }]}>
            {totalMiles.toFixed(1) + ' logged + ' + miles + ' mi'}
          </Text>
        )}
      </View>

      <View style={styles.inputRow}>
        <View style={[
          styles.inputWrap,
          { backgroundColor: theme.surface, borderColor: isTyping ? theme.accent : 'transparent' },
        ]}>
          <Text style={[styles.inputLive, { color: miles ? theme.text : theme.muted }]}>
            {miles ? (miles + ' mi') : '0 mi'}
          </Text>
          <TextInput
            style={[styles.input, { color: theme.muted }]}
            placeholder="Type miles..."
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

      <FlatList
        data={entries}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.entry, { backgroundColor: theme.surface }]}>
            <TouchableOpacity onPress={() => openEdit(item)} style={styles.entryInfo}>
              <Text style={[styles.entryMiles, { color: theme.text }]}>{item.miles} mi</Text>
              <Text style={[styles.entryTime,  { color: theme.muted }]}>{item.date}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteBtn, { backgroundColor: theme.accent }]}
              onPress={() => confirmDelete(item.id)}>
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.muted }]}>No miles logged yet.</Text>
        }
      />

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
  header:        { padding: 24, paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appName:       { fontSize: 28, fontWeight: 'bold' },
  date:          { fontSize: 14, marginTop: 4 },
  themeBtn:      { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  themeBtnIcon:  { fontSize: 22 },
  totalCard:     { margin: 16, padding: 24, borderRadius: 16, alignItems: 'center' },
  totalLabel:    { fontSize: 14 },
  totalMiles:    { fontSize: 64, fontWeight: 'bold' },
  totalHint:     { fontSize: 13, marginTop: 8 },
  inputRow:      { flexDirection: 'row', margin: 16, gap: 12 },
  inputWrap:     { flex: 1, borderRadius: 12, borderWidth: 2, overflow: 'hidden' },
  inputLive:     { fontSize: 28, fontWeight: 'bold', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  input:         { paddingHorizontal: 14, paddingBottom: 12, fontSize: 14 },
  logBtn:        { padding: 14, borderRadius: 12, justifyContent: 'center' },
  logBtnText:    { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  listContent:   { paddingBottom: 20 },
  entry:         { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12 },
  entryInfo:     { flex: 1 },
  entryMiles:    { fontSize: 16, fontWeight: '600' },
  entryTime:     { fontSize: 14 },
  deleteBtn:     { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  deleteBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  empty:         { textAlign: 'center', marginTop: 32 },
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
