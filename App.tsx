import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList, Modal, Alert, Image, ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

type MileEntry = { id: string; miles: number; date: string; };
type Receipt = { id: string; imageUri: string; amount: string; category: string; date: string; };

const MILES_KEY = 'trackmoto_entries';
const RECEIPTS_KEY = 'trackmoto_receipts';
const CATEGORIES = ['Gas', 'Food', 'Supplies', 'Maintenance', 'Other'];

// ── Miles Screen ──────────────────────────────────────────────────────────────
function MilesScreen() {
  const [miles, setMiles] = useState('');
  const [entries, setEntries] = useState<MileEntry[]>([]);
  const [editEntry, setEditEntry] = useState<MileEntry | null>(null);
  const [editMiles, setEditMiles] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const totalToday = entries.reduce((sum, e) => sum + e.miles, 0);

  useEffect(() => { loadEntries(); }, []);
  useEffect(() => { saveEntries(); }, [entries]);

  const loadEntries = async () => {
    try {
      const saved = await AsyncStorage.getItem(MILES_KEY);
      if (saved) setEntries(JSON.parse(saved));
    } catch (e) { console.error(e); }
  };

  const saveEntries = async () => {
    try {
      await AsyncStorage.setItem(MILES_KEY, JSON.stringify(entries));
    } catch (e) { console.error(e); }
  };

  const logMiles = () => {
    if (!miles || isNaN(Number(miles))) return;
    setEntries(prev => [{
      id: Date.now().toString(),
      miles: Number(miles),
      date: new Date().toLocaleTimeString(),
    }, ...prev]);
    setMiles('');
  };

  const openEdit = (entry: MileEntry) => {
    setEditEntry(entry);
    setEditMiles(entry.miles.toString());
    setModalVisible(true);
  };

  const saveEdit = () => {
    if (!editMiles || isNaN(Number(editMiles)) || !editEntry) return;
    setEntries(prev =>
      prev.map(e => e.id === editEntry.id ? { ...e, miles: Number(editMiles) } : e)
    );
    setModalVisible(false);
    setEditEntry(null);
  };

  const deleteEntry = (id: string) => {
    Alert.alert('Delete Entry', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive',
        onPress: () => setEntries(prev => prev.filter(e => e.id !== id)) },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.appName}>TrackMoto 🏍️</Text>
        <Text style={styles.date}>{today}</Text>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Today's Miles</Text>
        <Text style={styles.totalMiles}>{totalToday.toFixed(1)}</Text>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter miles"
          placeholderTextColor="#666"
          keyboardType="decimal-pad"
          value={miles}
          onChangeText={setMiles}
        />
        <TouchableOpacity style={styles.button} onPress={logMiles}>
          <Text style={styles.buttonText}>Log</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={entries}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.entry}>
            <TouchableOpacity onPress={() => openEdit(item)} style={styles.entryInfo}>
              <Text style={styles.entryMiles}>{item.miles} mi</Text>
              <Text style={styles.entryTime}>{item.date}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteEntry(item.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No miles logged yet.</Text>}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Miles</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="decimal-pad"
              value={editMiles}
              onChangeText={setEditMiles}
              placeholderTextColor="#666"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Receipts Screen ───────────────────────────────────────────────────────────
function ReceiptsScreen() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageUri, setImageUri] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Gas');

  useEffect(() => { loadReceipts(); }, []);
  useEffect(() => { saveReceipts(); }, [receipts]);

  const loadReceipts = async () => {
    try {
      const saved = await AsyncStorage.getItem(RECEIPTS_KEY);
      if (saved) setReceipts(JSON.parse(saved));
    } catch (e) { console.error(e); }
  };

  const saveReceipts = async () => {
    try {
      await AsyncStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
    } catch (e) { console.error(e); }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { Alert.alert('Camera permission needed'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const saveReceipt = () => {
    if (!amount || isNaN(Number(amount))) return;
    setReceipts(prev => [{
      id: Date.now().toString(),
      imageUri,
      amount,
      category,
      date: new Date().toLocaleDateString(),
    }, ...prev]);
    setModalVisible(false);
    setImageUri('');
    setAmount('');
    setCategory('Gas');
  };

  const deleteReceipt = (id: string) => {
    Alert.alert('Delete Receipt', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive',
        onPress: () => setReceipts(prev => prev.filter(r => r.id !== id)) },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.appName}>Receipts 🧾</Text>
      </View>

      <FlatList
        data={receipts}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.receiptCard}>
            {item.imageUri
              ? <Image source={{ uri: item.imageUri }} style={styles.receiptThumb} />
              : <View style={styles.noImage}><Text style={styles.noImageText}>📄</Text></View>
            }
            <View style={styles.receiptInfo}>
              <Text style={styles.receiptAmount}>${item.amount}</Text>
              <Text style={styles.receiptCategory}>{item.category}</Text>
              <Text style={styles.receiptDate}>{item.date}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteReceipt(item.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No receipts yet.</Text>}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Add Receipt</Text>
              <View style={styles.photoRow}>
                <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
                  <Text style={styles.photoBtnText}>📷 Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
                  <Text style={styles.photoBtnText}>🖼 Gallery</Text>
                </TouchableOpacity>
              </View>
              {imageUri ? <Image source={{ uri: imageUri }} style={styles.previewImage} /> : null}
              <TextInput
                style={styles.modalInput}
                placeholder="Amount ($)"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
              <Text style={styles.categoryLabel}>Category</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catBtn, category === cat && styles.catBtnActive]}
                    onPress={() => setCategory(cat)}>
                    <Text style={[styles.catText, category === cat && styles.catTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveReceipt}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ── App with Tab Bar ──────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState<'miles' | 'receipts'>('miles');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {activeTab === 'miles' ? <MilesScreen /> : <ReceiptsScreen />}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'miles' && styles.tabActive]}
          onPress={() => setActiveTab('miles')}>
          <Text style={styles.tabText}>🏍️ Miles</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'receipts' && styles.tabActive]}
          onPress={() => setActiveTab('receipts')}>
          <Text style={styles.tabText}>🧾 Receipts</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  screen: { flex: 1 },
  header: {
    padding: 24,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  date: { fontSize: 14, color: '#aaa', marginTop: 4 },
  totalCard: {
    margin: 16, padding: 24, backgroundColor: '#16213e',
    borderRadius: 16, alignItems: 'center',
  },
  totalLabel: { fontSize: 14, color: '#aaa' },
  totalMiles: { fontSize: 64, fontWeight: 'bold', color: '#e94560' },
  inputRow: { flexDirection: 'row', margin: 16, gap: 12 },
  input: {
    flex: 1, backgroundColor: '#16213e', color: '#fff',
    padding: 14, borderRadius: 12, fontSize: 16,
  },
  button: {
    backgroundColor: '#e94560', padding: 14,
    borderRadius: 12, justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  entry: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: '#16213e', padding: 16, borderRadius: 12,
  },
  entryInfo: { flex: 1 },
  entryMiles: { color: '#fff', fontSize: 16, fontWeight: '600' },
  entryTime: { color: '#aaa', fontSize: 14 },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#e94560', justifyContent: 'center', alignItems: 'center',
  },
  deleteText: { color: '#fff', fontWeight: 'bold' },
  empty: { color: '#aaa', textAlign: 'center', marginTop: 32 },
  receiptCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: '#16213e', padding: 12, borderRadius: 12,
  },
  receiptThumb: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
  noImage: {
    width: 56, height: 56, borderRadius: 8, backgroundColor: '#2a2a4e',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  noImageText: { fontSize: 24 },
  receiptInfo: { flex: 1 },
  receiptAmount: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  receiptCategory: { color: '#e94560', fontSize: 13 },
  receiptDate: { color: '#aaa', fontSize: 12 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 30, fontWeight: 'bold', lineHeight: 34 },
  tabBar: { flexDirection: 'row', backgroundColor: '#16213e', paddingVertical: 12 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabActive: { borderTopWidth: 2, borderTopColor: '#e94560' },
  tabText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end',
  },
  modalCard: { backgroundColor: '#16213e', borderRadius: 16, padding: 24, margin: 16 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  modalInput: {
    backgroundColor: '#1a1a2e', color: '#fff',
    padding: 14, borderRadius: 12, fontSize: 16, marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 12,
    backgroundColor: '#2a2a4e', alignItems: 'center',
  },
  cancelText: { color: '#aaa', fontWeight: 'bold' },
  saveBtn: {
    flex: 1, padding: 14, borderRadius: 12,
    backgroundColor: '#e94560', alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: 'bold' },
  photoRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  photoBtn: {
    flex: 1, backgroundColor: '#2a2a4e',
    padding: 14, borderRadius: 12, alignItems: 'center',
  },
  photoBtnText: { color: '#fff', fontWeight: '600' },
  previewImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 16 },
  categoryLabel: { color: '#aaa', fontSize: 13, marginBottom: 8 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#2a2a4e',
  },
  catBtnActive: { backgroundColor: '#e94560' },
  catText: { color: '#aaa', fontSize: 13 },
  catTextActive: { color: '#fff', fontWeight: 'bold' },
});
