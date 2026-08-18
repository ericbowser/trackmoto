import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useVehicles } from '@/hooks/useVehicles';

type Props = {
  allowRemove?: boolean;
  onRemoveVehicle?: (vehicleId: string) => void;
};

export default function VehicleSelector({ allowRemove = false, onRemoveVehicle }: Props) {
  const { theme } = useTheme();
  const {
    vehicles,
    activeVehicleId,
    activeVehicle,
    setActiveVehicleId,
    addVehicle,
  } = useVehicles();
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');

  const saveVehicle = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    addVehicle(trimmed);
    setNewName('');
    setModalVisible(false);
  };

  const canRemove = allowRemove && vehicles.length > 1 && Boolean(onRemoveVehicle);

  return (
    <>
      <View style={[styles.bar, { backgroundColor: theme.surface }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]}>Vehicle</Text>
          {canRemove ? (
            <TouchableOpacity
              onPress={() => onRemoveVehicle!(activeVehicleId)}
              accessibilityLabel={`Remove ${activeVehicle?.nickname ?? 'vehicle'}`}>
              <Text style={[styles.removeText, { color: theme.accent }]}>Remove</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
          {vehicles.map(v => {
            const isActive = v.id === activeVehicleId;
            return (
              <TouchableOpacity
                key={v.id}
                style={[styles.pill, { backgroundColor: isActive ? theme.accent : theme.bg }]}
                onPress={() => setActiveVehicleId(v.id)}>
                <Text style={[styles.pillText, { color: isActive ? '#fff' : theme.muted }]}>
                  {v.nickname}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.add, { backgroundColor: theme.bg, borderColor: theme.muted + '44' }]}
            onPress={() => setModalVisible(true)}>
            <Text style={[styles.addText, { color: theme.text }]}>+ Add</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add vehicle</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.bg, color: theme.text }]}
              placeholder="Nickname (e.g., Civic, F-150)"
              placeholderTextColor={theme.muted}
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="words"
            />
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: theme.bg }]}
                onPress={() => setModalVisible(false)}>
                <Text style={[styles.cancelText, { color: theme.muted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: theme.accent }]}
                onPress={saveVehicle}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar:       { marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 14 },
  titleRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title:     { fontSize: 16, fontWeight: '700' },
  removeText:{ fontSize: 13, fontWeight: '700' },
  pills:     { gap: 8, paddingRight: 16 },
  pill:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  pillText:  { fontSize: 13, fontWeight: '700' },
  add:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 2 },
  addText:   { fontSize: 13, fontWeight: '800' },
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  card:      { borderRadius: 16, padding: 24, margin: 16 },
  modalTitle:{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input:     { padding: 14, borderRadius: 12, fontSize: 16, marginBottom: 16 },
  buttons:   { flexDirection: 'row', gap: 12 },
  btn:       { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  cancelText:{ fontWeight: 'bold' },
  saveText:  { color: '#fff', fontWeight: 'bold' },
});
