import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Modal, Alert, Image, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/context/ThemeContext';
import { useReceipts } from '@/hooks/useReceipts';
import { CATEGORIES } from '@/constants/app';
import ThemePicker from '@/components/ThemePicker';

export default function ReceiptsScreen() {
  const { theme } = useTheme();
  const { receipts, addReceipt, deleteReceipt } = useReceipts();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [imageUri, setImageUri] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [zoomUri, setZoomUri] = useState('');
  const [zoomVisible, setZoomVisible] = useState(false);
  const [themePickerVisible, setThemePickerVisible] = useState(false);

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

  const rePickImage = () => {
    Alert.alert('Change Photo', 'Choose a source', [
      { text: 'Camera',  onPress: takePhoto },
      { text: 'Gallery', onPress: pickImage },
      { text: 'Cancel',  style: 'cancel' },
    ]);
  };

  const handleSave = () => {
    const trimmed = amount.trim();
    if (trimmed !== '' && isNaN(Number(trimmed))) return;
    addReceipt({ imageUri, amount: trimmed, category });
    setAddModalVisible(false);
    setImageUri(''); setAmount(''); setCategory(CATEGORIES[0]);
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete Receipt', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteReceipt(id) },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>

      <View style={styles.header}>
        <Text style={[styles.appName, { color: theme.text }]}>Receipts 🧾</Text>
        <TouchableOpacity
          style={[styles.themeBtn, { backgroundColor: theme.surface }]}
          onPress={() => setThemePickerVisible(true)}>
          <Text style={styles.themeBtnIcon}>🎨</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={receipts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.receiptCard, { backgroundColor: theme.surface }]}>
            {item.imageUri ? (
              <TouchableOpacity onPress={() => { setZoomUri(item.imageUri); setZoomVisible(true); }}>
                <Image source={{ uri: item.imageUri }} style={styles.receiptThumb} />
              </TouchableOpacity>
            ) : (
              <View style={[styles.noImage, { backgroundColor: theme.bg }]}>
                <Text style={{ fontSize: 24 }}>📄</Text>
              </View>
            )}
            <View style={styles.receiptInfo}>
              <Text style={[styles.receiptAmount,    { color: theme.text }]}>
                {item.amount ? ('$' + item.amount) : 'No amount'}
              </Text>
              <Text style={[styles.receiptCategory,  { color: theme.accent }]}>{item.category}</Text>
              <Text style={[styles.receiptDate,      { color: theme.muted }]}>{item.date}</Text>
            </View>
            <TouchableOpacity
              style={[styles.deleteBtn, { backgroundColor: theme.accent }]}
              onPress={() => confirmDelete(item.id)}>
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.muted }]}>No receipts yet.</Text>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.accent }]}
        onPress={() => setAddModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Receipt Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add Receipt</Text>

              <View style={styles.photoRow}>
                <TouchableOpacity style={[styles.photoBtn, { backgroundColor: theme.bg }]} onPress={takePhoto}>
                  <Text style={[styles.photoBtnText, { color: theme.text }]}>📷 Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.photoBtn, { backgroundColor: theme.bg }]} onPress={pickImage}>
                  <Text style={[styles.photoBtnText, { color: theme.text }]}>🖼 Gallery</Text>
                </TouchableOpacity>
              </View>

              {imageUri ? (
                <TouchableOpacity onPress={rePickImage} activeOpacity={0.85}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <Text style={[styles.retapHint, { color: theme.muted }]}>Tap image to change</Text>
                </TouchableOpacity>
              ) : null}

              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.bg, color: theme.text }]}
                placeholder="Amount (optional)"
                placeholderTextColor={theme.muted}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={[styles.categoryLabel, { color: theme.muted }]}>Category</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catBtn, { backgroundColor: category === cat ? theme.accent : theme.bg }]}
                    onPress={() => setCategory(cat)}>
                    <Text style={[
                      styles.catText,
                      { color: category === cat ? '#fff' : theme.muted },
                      category === cat && styles.catTextActive,
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { backgroundColor: theme.bg }]}
                  onPress={() => setAddModalVisible(false)}>
                  <Text style={[styles.cancelText, { color: theme.muted }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: theme.accent }]}
                  onPress={handleSave}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Image Zoom Modal */}
      <Modal visible={zoomVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.zoomOverlay} onPress={() => setZoomVisible(false)} activeOpacity={1}>
          <Image source={{ uri: zoomUri }} style={styles.zoomedImage} resizeMode="contain" />
          <Text style={styles.zoomDismiss}>Tap anywhere to close</Text>
        </TouchableOpacity>
      </Modal>

      <ThemePicker visible={themePickerVisible} onClose={() => setThemePickerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:          { flex: 1 },
  header:          { padding: 24, paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appName:         { fontSize: 28, fontWeight: 'bold' },
  themeBtn:        { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  themeBtnIcon:    { fontSize: 22 },
  listContent:     { paddingBottom: 100 },
  receiptCard:     { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 12 },
  receiptThumb:    { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
  noImage:         { width: 56, height: 56, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  receiptInfo:     { flex: 1 },
  receiptAmount:   { fontSize: 18, fontWeight: 'bold' },
  receiptCategory: { fontSize: 13 },
  receiptDate:     { fontSize: 12 },
  deleteBtn:       { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  deleteBtnText:   { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  empty:           { textAlign: 'center', marginTop: 32 },
  fab:             { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  fabText:         { color: '#fff', fontSize: 30, fontWeight: 'bold', lineHeight: 34 },
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard:       { borderRadius: 16, padding: 24, margin: 16 },
  modalTitle:      { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  photoRow:        { flexDirection: 'row', gap: 12, marginBottom: 16 },
  photoBtn:        { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  photoBtnText:    { fontWeight: '600' },
  previewImage:    { width: '100%', height: 180, borderRadius: 12, marginBottom: 8 },
  retapHint:       { textAlign: 'center', fontSize: 12, marginBottom: 16 },
  modalInput:      { padding: 14, borderRadius: 12, fontSize: 16, marginBottom: 16 },
  categoryLabel:   { fontSize: 13, marginBottom: 8 },
  categoryRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catBtn:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  catText:         { fontSize: 13 },
  catTextActive:   { fontWeight: '700' },
  modalButtons:    { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn:       { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  cancelText:      { fontWeight: 'bold' },
  saveBtn:         { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  saveText:        { color: '#fff', fontWeight: 'bold' },
  zoomOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.93)', justifyContent: 'center', alignItems: 'center' },
  zoomedImage:     { width: '100%', height: '80%' },
  zoomDismiss:     { color: '#aaa', marginTop: 16, fontSize: 14 },
});
