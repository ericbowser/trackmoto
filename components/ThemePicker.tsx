import { Modal, View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { APP_ICONS, type AppIconId, useAppIcon } from '@/context/AppIconContext';
import { THEMES } from '@/constants/themes';
import type { Theme } from '@/types';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const PRIVACY_URL = 'https://execute-engrave.com/trackmoto/privacy-policy';

export default function ThemePicker({ visible, onClose }: Props) {
  const { theme, setTheme } = useTheme();
  const { appIcon, setAppIcon } = useAppIcon();

  const handleSelect = (t: Theme) => {
    setTheme(t);
    onClose();
  };

  const openPrivacyPolicy = () => {
    Linking.openURL(PRIVACY_URL).catch(() => {
      Alert.alert('Cannot open link', 'Please try again.');
    });
  };

  const handleIconSelect = (id: AppIconId) => {
    setAppIcon(id);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.wrap}>
        <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1} />
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <View style={[styles.handle, { backgroundColor: theme.muted }]} />
          <Text style={[styles.title, { color: theme.text }]}>Choose your vibe 🎨</Text>
          <Text style={[styles.sub, { color: theme.muted }]}>
            Saved automatically — change it any time
          </Text>
          <View style={styles.grid}>
            {Object.values(THEMES).map(t => {
              const isActive = theme.id === t.id;
              return (
                <TouchableOpacity key={t.id} style={styles.cell} onPress={() => handleSelect(t)}>
                  <View style={[
                    styles.circle,
                    { backgroundColor: t.accent },
                    isActive && styles.circleActive,
                  ]}>
                    <Text style={styles.emoji}>{t.emoji}</Text>
                  </View>
                  <Text style={[
                    styles.label,
                    { color: isActive ? theme.text : theme.muted },
                    isActive && styles.labelActive,
                  ]}>
                    {t.label}
                  </Text>
                  {isActive && (
                    <Text style={[styles.activeTag, { color: theme.accent }]}>active</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.muted }]}>App icon</Text>
          <View style={styles.iconRow}>
            {Object.values(APP_ICONS).map(icon => {
              const isActive = icon.id === appIcon.id;
              return (
                <TouchableOpacity
                  key={icon.id}
                  style={[
                    styles.iconCell,
                    { backgroundColor: theme.bg, borderColor: isActive ? theme.accent : theme.muted + '44' },
                  ]}
                  onPress={() => handleIconSelect(icon.id)}
                  accessibilityLabel={`Set icon to ${icon.label}`}>
                  <Text style={styles.iconEmoji}>{icon.emoji}</Text>
                  <Text style={[styles.iconLabel, { color: isActive ? theme.text : theme.muted }]}>
                    {icon.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.privacyBtn, { backgroundColor: theme.bg }]}
            onPress={openPrivacyPolicy}
            accessibilityLabel="Open privacy policy">
            <Text style={[styles.privacyText, { color: theme.text }]}>Privacy policy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap:         { flex: 1, justifyContent: 'flex-end' },
  overlay:      { flex: 1 },
  sheet:        { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48 },
  handle:       { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20, opacity: 0.4 },
  title:        { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  sub:          { fontSize: 13, marginBottom: 24 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cell:         { width: '30%', alignItems: 'center', marginBottom: 20 },
  circle:       { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  circleActive: { borderWidth: 3, borderColor: '#ffffff' },
  emoji:        { fontSize: 26 },
  label:        { fontSize: 12, marginTop: 8, textAlign: 'center' },
  labelActive:  { fontWeight: '700' },
  activeTag:    { fontSize: 10, fontWeight: '700', marginTop: 2 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4, marginBottom: 10 },
  iconRow:      { flexDirection: 'row', gap: 10, marginBottom: 16 },
  iconCell:     { flex: 1, borderWidth: 2, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  iconEmoji:    { fontSize: 26 },
  iconLabel:    { marginTop: 6, fontSize: 12, fontWeight: '700' },
  privacyBtn:   { marginTop: 6, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  privacyText:  { fontSize: 14, fontWeight: '700' },
});
