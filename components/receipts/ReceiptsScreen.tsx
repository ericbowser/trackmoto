import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Modal, Alert, Image, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/context/ThemeContext';
import { useReceipts } from '@/hooks/useReceipts';
import {
  CATEGORY_GROUPS,
  QUICK_ACCESS_CATEGORIES,
  isLegalCategory,
} from '@/constants/app';
import ThemePicker from '@/components/ThemePicker';
import type { Receipt } from '@/types';

type Filter = 'all' | 'expense' | 'legal';

const QUICK_ACCESS_ICONS: Record<string, string> = {
  Registration: '📋',
  Insurance: '🛡️',
};

export default function ReceiptsScreen() {
  const { theme } = useTheme();
  const { receipts, addReceipt, deleteReceipt, getLatestByCategory } = useReceipts();

  const [filter, setFilter] = useState<Filter>('all');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [imageUri, setImageUri] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(CATEGORY_GROUPS[0].categories[0]);
  const [zoomUri, setZoomUri] = useState('');
  const [zoomTitle, setZoomTitle] = useState('');
  const [zoomVisible, setZoomVisible] = useState(false);
  const [themePickerVisible, setThemePickerVisible] = useState(false);

  const filteredReceipts = useMemo(() => {
    if (filter === 'expense') return receipts.filter(r => r.kind === 'expense');
    if (filter === 'legal') return receipts.filter(r => r.kind === 'document');
    return receipts;
  }, [receipts, filter]);

  const openZoom = (uri: string, title: string) => {
    setZoomUri(uri);
    setZoomTitle(title);
    setZoomVisible(true);
  };

  const openAddModal = (presetCategory?: string) => {
    setImageUri('');
    setAmount('');
    setCategory(presetCategory ?? CATEGORY_GROUPS[0].categories[0]);
    setAddModalVisible(true);
  };

  const handleQuickAccess = (cat: string) => {
    const doc = getLatestByCategory(cat);
    if (doc?.imageUri) {
      openZoom(doc.imageUri, cat);
      return;
    }
    Alert.alert(
      `Add ${cat}`,
      `No ${cat.toLowerCase()} document saved yet. Add one now for quick roadside access.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add', onPress: () => openAddModal(cat) },
      ],
    );
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { Alert.alert('Camera permission needed'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const rePickImage = () => {
    Alert.alert('Change Photo', 'Choose a source', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Gallery', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = () => {
    const trimmed = amount.trim();
    if (trimmed !== '' && isNaN(Number(trimmed))) return;
    if (!imageUri) {
      Alert.alert('Photo required', 'Add a photo of the receipt or document before saving.');
      return;
    }
    addReceipt({ imageUri, amount: trimmed, category });
    setAddModalVisible(false);
    setImageUri('');
    setAmount('');
    setCategory(CATEGORY_GROUPS[0].categories[0]);
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteReceipt(id) },
    ]);
  };

  const renderReceipt = ({ item }: { item: Receipt }) => (
    <View style={[styles.receiptCard, { backgroundColor: theme.surface }]}>
      {item.imageUri ? (
        <TouchableOpacity onPress={() => openZoom(item.imageUri, item.category)}>
          <Image source={{ uri: item.imageUri }} style={styles.receiptThumb} />
        </TouchableOpacity>
      ) : (
        <View style={[styles.noImage, { backgroundColor: theme.bg }]}>
          <Text style={{ fontSize: 24 }}>📄</Text>
        </View>
      )}
      <View style={styles.receiptInfo}>
        <Text style={[styles.receiptCategory, { color: theme.accent }]}>{item.category}</Text>
        {item.kind === 'expense' && item.amount ? (
          <Text style={[styles.receiptAmount, { color: theme.text }]}>${item.amount}</Text>
        ) : (
          <Text style={[styles.receiptDocLabel, { color: theme.text }]}>Document on file</Text>
        )}
        <Text style={[styles.receiptDate, { color: theme.muted }]}>{item.date}</Text>
      </View>
      <TouchableOpacity
        style={[styles.deleteBtn, { backgroundColor: theme.accent }]}
        onPress={() => confirmDelete(item.id)}>
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  const ListHeader = () => (
    <>
      <View style={[styles.quickAccessSection, { backgroundColor: theme.surface }]}>
        <Text style={[styles.quickAccessTitle, { color: theme.text }]}>Roadside quick access</Text>
        <Text style={[styles.quickAccessHint, { color: theme.muted }]}>
          Tap to show registration or insurance full screen
        </Text>
        <View style={styles.quickAccessRow}>
          {QUICK_ACCESS_CATEGORIES.map(cat => {
            const doc = getLatestByCategory(cat);
            const hasDoc = Boolean(doc?.imageUri);
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.quickCard,
                  { backgroundColor: theme.bg, borderColor: hasDoc ? theme.accent : theme.muted + '44' },
                ]}
                onPress={() => handleQuickAccess(cat)}>
                {hasDoc && doc?.imageUri ? (
                  <Image source={{ uri: doc.imageUri }} style={styles.quickThumb} />
                ) : (
                  <Text style={styles.quickIcon}>{QUICK_ACCESS_ICONS[cat] ?? '📄'}</Text>
                )}
                <Text style={[styles.quickLabel, { color: theme.text }]}>{cat}</Text>
                <Text style={[styles.quickStatus, { color: hasDoc ? theme.accent : theme.muted }]}>
                  {hasDoc ? 'Ready' : 'Tap to add'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.filterRow}>
        {([
          ['all', 'All'],
          ['expense', 'Expenses'],
          ['legal', 'Legal'],
        ] as const).map(([id, label]) => (
          <TouchableOpacity
            key={id}
            style={[
              styles.filterBtn,
              { backgroundColor: filter === id ? theme.accent : theme.surface },
            ]}
            onPress={() => setFilter(id)}>
            <Text style={[styles.filterText, { color: filter === id ? '#fff' : theme.muted }]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>

      <View style={styles.header}>
        <View>
          <Text style={[styles.appName, { color: theme.text }]}>Docs & Receipts</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>Expenses and legal documents</Text>
        </View>
        <TouchableOpacity
          style={[styles.themeBtn, { backgroundColor: theme.surface }]}
          onPress={() => setThemePickerVisible(true)}>
          <Text style={styles.themeBtnIcon}>🎨</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredReceipts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ListHeader}
        renderItem={renderReceipt}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.muted }]}>
            {filter === 'legal'
              ? 'No legal documents yet. Add registration or insurance above.'
              : filter === 'expense'
                ? 'No expense receipts yet.'
                : 'No documents yet. Tap + to add.'}
          </Text>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.accent }]}
        onPress={() => openAddModal()}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add document</Text>

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

              {CATEGORY_GROUPS.map(group => (
                <View key={group.id} style={styles.categoryGroup}>
                  <Text style={[styles.categoryGroupLabel, { color: theme.muted }]}>{group.label}</Text>
                  <View style={styles.categoryRow}>
                    {group.categories.map(cat => (
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
                </View>
              ))}

              {!isLegalCategory(category) && (
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.bg, color: theme.text }]}
                  placeholder="Amount (optional)"
                  placeholderTextColor={theme.muted}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              )}

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

      <Modal visible={zoomVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.zoomOverlay}
          onPress={() => setZoomVisible(false)}
          activeOpacity={1}>
          {zoomTitle ? (
            <Text style={styles.zoomTitle}>{zoomTitle}</Text>
          ) : null}
          <Image source={{ uri: zoomUri }} style={styles.zoomedImage} resizeMode="contain" />
          <Text style={styles.zoomDismiss}>Tap anywhere to close</Text>
        </TouchableOpacity>
      </Modal>

      <ThemePicker visible={themePickerVisible} onClose={() => setThemePickerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:               { flex: 1 },
  header:               { padding: 24, paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appName:              { fontSize: 26, fontWeight: 'bold' },
  subtitle:             { fontSize: 13, marginTop: 2 },
  themeBtn:             { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  themeBtnIcon:         { fontSize: 22 },
  listContent:          { paddingBottom: 100 },
  quickAccessSection:   { marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 14 },
  quickAccessTitle:     { fontSize: 16, fontWeight: '700' },
  quickAccessHint:      { fontSize: 12, marginTop: 4, marginBottom: 12 },
  quickAccessRow:       { flexDirection: 'row', gap: 12 },
  quickCard:            { flex: 1, borderWidth: 2, borderRadius: 12, padding: 12, alignItems: 'center' },
  quickThumb:           { width: 48, height: 48, borderRadius: 8, marginBottom: 8 },
  quickIcon:            { fontSize: 32, marginBottom: 8 },
  quickLabel:           { fontSize: 14, fontWeight: '700' },
  quickStatus:          { fontSize: 11, marginTop: 4, fontWeight: '600' },
  filterRow:            { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 12 },
  filterBtn:            { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  filterText:           { fontSize: 13, fontWeight: '600' },
  receiptCard:          { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 12 },
  receiptThumb:         { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
  noImage:              { width: 56, height: 56, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  receiptInfo:          { flex: 1 },
  receiptAmount:        { fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  receiptDocLabel:      { fontSize: 14, marginTop: 2 },
  receiptCategory:      { fontSize: 13, fontWeight: '600' },
  receiptDate:          { fontSize: 12, marginTop: 2 },
  deleteBtn:            { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  deleteBtnText:        { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  empty:                { textAlign: 'center', marginTop: 24, paddingHorizontal: 24 },
  fab:                  { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  fabText:              { color: '#fff', fontSize: 30, fontWeight: 'bold', lineHeight: 34 },
  modalOverlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard:            { borderRadius: 16, padding: 24, margin: 16 },
  modalTitle:           { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  photoRow:             { flexDirection: 'row', gap: 12, marginBottom: 16 },
  photoBtn:             { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  photoBtnText:         { fontWeight: '600' },
  previewImage:         { width: '100%', height: 180, borderRadius: 12, marginBottom: 8 },
  retapHint:            { textAlign: 'center', fontSize: 12, marginBottom: 16 },
  categoryGroup:        { marginBottom: 12 },
  categoryGroupLabel:   { fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  categoryRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn:               { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  catText:              { fontSize: 13 },
  catTextActive:        { fontWeight: '700' },
  modalInput:           { padding: 14, borderRadius: 12, fontSize: 16, marginBottom: 16 },
  modalButtons:         { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn:            { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  cancelText:           { fontWeight: 'bold' },
  saveBtn:              { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  saveText:             { color: '#fff', fontWeight: 'bold' },
  zoomOverlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.93)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  zoomTitle:            { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  zoomedImage:          { width: '100%', height: '78%' },
  zoomDismiss:          { color: '#aaa', marginTop: 16, fontSize: 14 },
});
