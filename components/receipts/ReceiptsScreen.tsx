import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Modal, Alert, Image, ScrollView,
  Linking,
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
import {
  pickFromFiles,
  persistDocument,
  openDocumentExternally,
  isImageMime,
  type PickedDocument,
} from '@/utils/documents';
import type { Receipt } from '@/types';

type Filter = 'all' | 'expense' | 'legal';

const QUICK_ACCESS_ICONS: Record<string, string> = {
  Registration: '📋',
  Insurance: '🛡️',
};

function receiptIsImage(item: Receipt): boolean {
  if (item.mimeType) return isImageMime(item.mimeType);
  return /\.(jpe?g|png|gif|webp|heic)$/i.test(item.imageUri);
}

export default function ReceiptsScreen() {
  const { theme } = useTheme();
  const { receipts, addReceipt, deleteReceipt, getLatestByCategory } = useReceipts();

  const [filter, setFilter] = useState<Filter>('all');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<PickedDocument | null>(null);
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

  const openImageZoom = (uri: string, title: string) => {
    setZoomUri(uri);
    setZoomTitle(title);
    setZoomVisible(true);
  };

  const viewDocument = async (item: Receipt) => {
    if (receiptIsImage(item)) {
      openImageZoom(item.imageUri, item.category);
      return;
    }
    try {
      await openDocumentExternally(item.imageUri, item.mimeType);
    } catch {
      Alert.alert('Cannot open file', 'Try re-adding the document.');
    }
  };

  const openAddModal = (presetCategory?: string) => {
    setSelectedDoc(null);
    setAmount('');
    setCategory(presetCategory ?? CATEGORY_GROUPS[0].categories[0]);
    setAddModalVisible(true);
  };

  const handleQuickAccess = async (cat: string) => {
    const doc = getLatestByCategory(cat);
    if (doc?.imageUri) {
      await viewDocument(doc);
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

  const openSettings = () => {
    Linking.openSettings().catch(() => {
      Alert.alert('Cannot open settings', 'Please open Settings and allow permissions for Track Moto.');
    });
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Camera permission needed',
        'Allow camera access in Settings to take a photo.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: openSettings },
        ],
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    try {
      const asset = result.assets[0];
      const doc = await persistDocument(
        asset.uri,
        asset.mimeType ?? 'image/jpeg',
        `camera_${Date.now()}.jpg`,
      );
      setSelectedDoc(doc);
    } catch {
      Alert.alert('Save failed', 'Could not save the photo.');
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Allow photo access in Settings to pick images from your gallery.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: openSettings },
        ],
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      const asset = result.assets[0];
      const doc = await persistDocument(
        asset.uri,
        asset.mimeType ?? 'image/jpeg',
        asset.fileName ?? `gallery_${Date.now()}.jpg`,
      );
      setSelectedDoc(doc);
    } catch {
      Alert.alert('Save failed', 'Could not import the image.');
    }
  };

  const pickFile = async () => {
    try {
      const doc = await pickFromFiles();
      if (doc) setSelectedDoc(doc);
    } catch {
      Alert.alert('File picker failed', 'Could not access files on your device.');
    }
  };

  const changeDocument = () => {
    Alert.alert('Change document', 'Choose a source', [
      { text: 'Files', onPress: pickFile },
      { text: 'Camera', onPress: takePhoto },
      { text: 'Gallery', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = () => {
    const trimmed = amount.trim();
    if (trimmed !== '' && isNaN(Number(trimmed))) return;
    if (!selectedDoc) {
      Alert.alert('Document required', 'Add a photo or file before saving.');
      return;
    }
    addReceipt({
      imageUri: selectedDoc.uri,
      mimeType: selectedDoc.mimeType,
      fileName: selectedDoc.fileName,
      amount: trimmed,
      category,
    });
    setAddModalVisible(false);
    setSelectedDoc(null);
    setAmount('');
    setCategory(CATEGORY_GROUPS[0].categories[0]);
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteReceipt(id) },
    ]);
  };

  const DocThumb = ({ item, size = 'list' }: { item: Receipt; size?: 'list' | 'quick' }) => {
    const isImage = receiptIsImage(item);
    const thumbStyle = size === 'quick' ? styles.quickThumb : styles.receiptThumb;
    const boxStyle = size === 'quick' ? styles.quickIconBox : styles.noImage;
    const wrapStyle = size === 'list' ? styles.thumbWrap : undefined;

    if (isImage && item.imageUri) {
      return (
        <View style={wrapStyle}>
          <Image source={{ uri: item.imageUri }} style={thumbStyle} />
        </View>
      );
    }
    return (
      <View style={wrapStyle}>
        <View style={[boxStyle, { backgroundColor: theme.bg }]}>
          <Text style={{ fontSize: size === 'quick' ? 28 : 22 }}>📄</Text>
          {size === 'list' && item.fileName ? (
            <Text style={[styles.pdfLabel, { color: theme.muted }]} numberOfLines={1}>PDF</Text>
          ) : null}
        </View>
      </View>
    );
  };

  const renderReceipt = ({ item }: { item: Receipt }) => (
    <View style={[styles.receiptCard, { backgroundColor: theme.surface }]}>
      <TouchableOpacity onPress={() => viewDocument(item)}>
        <DocThumb item={item} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.receiptInfo} onPress={() => viewDocument(item)}>
        <Text style={[styles.receiptCategory, { color: theme.accent }]}>{item.category}</Text>
        {item.kind === 'expense' && item.amount ? (
          <Text style={[styles.receiptAmount, { color: theme.text }]}>${item.amount}</Text>
        ) : (
          <Text style={[styles.receiptDocLabel, { color: theme.text }]}>
            {item.fileName ?? 'Document on file'}
          </Text>
        )}
        <Text style={[styles.receiptDate, { color: theme.muted }]}>{item.date}</Text>
      </TouchableOpacity>
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
          Tap registration or insurance to view instantly
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
                {hasDoc && doc ? (
                  <DocThumb item={doc} size="quick" />
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
          <Text style={[styles.subtitle, { color: theme.muted }]}>Photos, PDFs, and legal documents</Text>
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

              <TouchableOpacity
                style={[styles.filesBtn, { backgroundColor: theme.accent }]}
                onPress={pickFile}>
                <Text style={styles.filesBtnTitle}>📁  Choose from phone files</Text>
                <Text style={styles.filesBtnHint}>Downloads, PDFs, Google Drive, etc.</Text>
              </TouchableOpacity>

              <View style={styles.photoRow}>
                <TouchableOpacity style={[styles.photoBtn, { backgroundColor: theme.bg }]} onPress={takePhoto}>
                  <Text style={[styles.photoBtnText, { color: theme.text }]}>📷 Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.photoBtn, { backgroundColor: theme.bg }]} onPress={pickImage}>
                  <Text style={[styles.photoBtnText, { color: theme.text }]}>🖼 Gallery</Text>
                </TouchableOpacity>
              </View>

              {selectedDoc ? (
                <TouchableOpacity onPress={changeDocument} activeOpacity={0.85}>
                  {selectedDoc.isImage ? (
                    <Image source={{ uri: selectedDoc.uri }} style={styles.previewImage} />
                  ) : (
                    <View style={[styles.previewPdf, { backgroundColor: theme.bg }]}>
                      <Text style={{ fontSize: 40 }}>📄</Text>
                      <Text style={[styles.previewPdfName, { color: theme.text }]} numberOfLines={2}>
                        {selectedDoc.fileName}
                      </Text>
                      <Text style={[styles.previewPdfHint, { color: theme.muted }]}>PDF document</Text>
                    </View>
                  )}
                  <Text style={[styles.retapHint, { color: theme.muted }]}>Tap to change</Text>
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
  quickIconBox:         { width: 48, height: 48, borderRadius: 8, marginBottom: 8, justifyContent: 'center', alignItems: 'center' },
  quickIcon:            { fontSize: 32, marginBottom: 8 },
  quickLabel:           { fontSize: 14, fontWeight: '700' },
  quickStatus:          { fontSize: 11, marginTop: 4, fontWeight: '600' },
  filterRow:            { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 12 },
  filterBtn:            { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  filterText:           { fontSize: 13, fontWeight: '600' },
  receiptCard:          { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 12 },
  thumbWrap:            { marginRight: 12 },
  receiptThumb:         { width: 56, height: 56, borderRadius: 8 },
  noImage:              { width: 56, height: 56, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  pdfLabel:             { fontSize: 9, marginTop: 2 },
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
  filesBtn:             { padding: 16, borderRadius: 12, marginBottom: 12 },
  filesBtnTitle:        { color: '#fff', fontSize: 16, fontWeight: '700' },
  filesBtnHint:         { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 },
  photoRow:             { flexDirection: 'row', gap: 12, marginBottom: 16 },
  photoBtn:             { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  photoBtnText:         { fontWeight: '600' },
  previewImage:         { width: '100%', height: 180, borderRadius: 12, marginBottom: 8 },
  previewPdf:           { width: '100%', height: 140, borderRadius: 12, marginBottom: 8, justifyContent: 'center', alignItems: 'center', padding: 16 },
  previewPdfName:       { fontSize: 14, fontWeight: '600', marginTop: 8, textAlign: 'center' },
  previewPdfHint:       { fontSize: 12, marginTop: 4 },
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
