import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useGpsSpeed } from '@/hooks/useGpsSpeed';
import ThemePicker from '@/components/ThemePicker';
import { useState, useEffect } from 'react';

const STATUS_LABEL: Record<string, string> = {
  idle:      'Ready',
  acquiring: 'Acquiring GPS signal...',
  active:    'GPS Active',
  denied:    'Location permission denied — check settings',
};

const STATUS_COLOR: Record<string, string> = {
  idle:      '#888',
  acquiring: '#f5a623',
  active:    '#4cd964',
  denied:    '#e94560',
};

export default function SpeedScreen() {
  const { theme } = useTheme();
  const {
    status, unit, setUnit,
    current, top, avg,
    gauge, delta,
    accuracy,
    isTracking,
    startTracking, stopTracking, resetSession,
  } = useGpsSpeed();

  const [themePickerVisible, setThemePickerVisible] = useState(false);

  useEffect(() => {
    startTracking();
  }, [startTracking]);

  const fmt   = (n: number) => Math.round(n).toString();
  const fmtD  = (n: number) => (n >= 0 ? '+' : '') + Math.round(n);
  const fmtPct = (n: number) => (n >= 0 ? '+' : '') + Math.round((n / Math.max(current, 0.1)) * 100) + '%';

  const dotColor = STATUS_COLOR[status] ?? '#888';

  const openSettings = () => {
    Linking.openSettings().catch(() => {
      Alert.alert('Cannot open settings', 'Please open Settings and allow location permission for Track Moto.');
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.appName, { color: theme.text }]}>Speedometer ⚡</Text>
        <TouchableOpacity
          style={[styles.themeBtn, { backgroundColor: theme.surface }]}
          onPress={() => setThemePickerVisible(true)}>
          <Text style={styles.themeBtnIcon}>🎨</Text>
        </TouchableOpacity>
      </View>

      {/* GPS Status Bar */}
      <View style={[styles.statusBar, { backgroundColor: theme.surface }]}>
        <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
        <Text style={[styles.statusText, { color: theme.muted }]}>
          {STATUS_LABEL[status]}
        </Text>
        {status === 'active' && accuracy !== null && (
          <Text style={[styles.accuracyText, { color: theme.muted }]}>
            ±{Math.round(accuracy)}m
          </Text>
        )}
      </View>

      {status === 'denied' ? (
        <View style={[styles.deniedCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.deniedTitle, { color: theme.text }]}>Enable location to use Speed</Text>
          <Text style={[styles.deniedBody, { color: theme.muted }]}>
            Track Moto only uses location while tracking speed.
          </Text>
          <TouchableOpacity
            style={[styles.deniedBtn, { backgroundColor: theme.accent }]}
            onPress={openSettings}>
            <Text style={styles.deniedBtnText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Main Speed Display */}
      <View style={[styles.speedCard, { backgroundColor: theme.surface }]}>
        <Text style={[styles.speedLabel, { color: theme.muted }]}>GPS ACTUAL</Text>
        <View style={styles.speedRow}>
          <Text style={[styles.speedNumber, { color: theme.accent }]}>{fmt(current)}</Text>
          <Text style={[styles.speedUnit, { color: theme.muted }]}>{unit}</Text>
        </View>

        {/* Gauge Comparison */}
        <View style={[styles.divider, { backgroundColor: theme.bg }]} />
        <View style={styles.gaugeRow}>
          <View style={styles.gaugeItem}>
            <Text style={[styles.gaugeLabel, { color: theme.muted }]}>🚗 Dashboard Gauge Est.</Text>
            <Text style={[styles.gaugeValue, { color: theme.text }]}>
              ~{fmt(gauge)} <Text style={[styles.gaugeUnit, { color: theme.muted }]}>{unit}</Text>
            </Text>
          </View>
          <View style={[styles.deltaBox, { backgroundColor: theme.bg }]}>
            <Text style={[styles.deltaLabel, { color: theme.muted }]}>Reads</Text>
            <Text style={[styles.deltaValue, { color: theme.accent }]}>{fmtPct(delta)}</Text>
            <Text style={[styles.deltaAbs,   { color: theme.muted }]}>{fmtD(delta)} {unit}</Text>
          </View>
        </View>
      </View>

      {/* Session Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Top Speed</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{fmt(top)}</Text>
          <Text style={[styles.statUnit,  { color: theme.muted }]}>{unit}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Avg Speed</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{fmt(avg)}</Text>
          <Text style={[styles.statUnit,  { color: theme.muted }]}>{unit}</Text>
        </View>
      </View>

      </ScrollView>

      {/* Controls — pinned above tab bar */}
      <View style={styles.controls}>

        {/* Secondary row: unit toggle + reset */}
        <View style={styles.secondaryRow}>
          <View style={[styles.unitToggle, { backgroundColor: theme.surface }]}>
            {(['mph', 'kph'] as const).map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.unitBtn, unit === u && { backgroundColor: theme.accent }]}
                onPress={() => setUnit(u)}>
                <Text style={[styles.unitBtnText, { color: unit === u ? '#fff' : theme.muted }]}>
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.resetBtn, { backgroundColor: theme.surface }]}
            onPress={resetSession}>
            <Text style={[styles.resetBtnText, { color: theme.muted }]}>Reset Session</Text>
          </TouchableOpacity>
        </View>

        {/* Primary action — full width, unmissable */}
        <TouchableOpacity
          style={[styles.mainBtn, { backgroundColor: isTracking ? theme.muted + '33' : theme.accent }]}
          onPress={isTracking ? stopTracking : startTracking}>
          <Text style={[styles.mainBtnText, { color: isTracking ? theme.text : '#fff' }]}>
            {isTracking ? '⏹  Stop Tracking' : '▶  Start Tracking'}
          </Text>
        </TouchableOpacity>

      </View>

      <ThemePicker visible={themePickerVisible} onClose={() => setThemePickerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1 },
  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 8 },
  header:        { padding: 24, paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appName:       { fontSize: 28, fontWeight: 'bold' },
  themeBtn:      { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  themeBtnIcon:  { fontSize: 22 },

  statusBar:     { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 10, gap: 8 },
  statusDot:     { width: 8, height: 8, borderRadius: 4 },
  statusText:    { flex: 1, fontSize: 13 },
  accuracyText:  { fontSize: 12 },
  deniedCard:    { marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 16 },
  deniedTitle:   { fontSize: 16, fontWeight: '800' },
  deniedBody:    { marginTop: 6, fontSize: 13, lineHeight: 18 },
  deniedBtn:     { marginTop: 12, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  deniedBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  speedCard:     { marginHorizontal: 16, marginBottom: 12, borderRadius: 20, padding: 24 },
  speedLabel:    { fontSize: 12, fontWeight: '600', letterSpacing: 1.5, marginBottom: 4 },
  speedRow:      { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  speedNumber:   { fontSize: 96, fontWeight: '800', lineHeight: 100 },
  speedUnit:     { fontSize: 22, fontWeight: '600', paddingBottom: 14 },

  divider:       { height: 1, marginVertical: 16 },
  gaugeRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gaugeItem:     { flex: 1 },
  gaugeLabel:    { fontSize: 12, marginBottom: 4 },
  gaugeValue:    { fontSize: 28, fontWeight: '700' },
  gaugeUnit:     { fontSize: 16, fontWeight: '400' },

  deltaBox:      { alignItems: 'center', padding: 12, borderRadius: 12, minWidth: 80 },
  deltaLabel:    { fontSize: 11, marginBottom: 2 },
  deltaValue:    { fontSize: 20, fontWeight: '800' },
  deltaAbs:      { fontSize: 11, marginTop: 2 },

  statsRow:      { flexDirection: 'row', marginHorizontal: 16, gap: 12, marginBottom: 12 },
  statCard:      { flex: 1, padding: 16, borderRadius: 14, alignItems: 'center' },
  statLabel:     { fontSize: 12, marginBottom: 4 },
  statValue:     { fontSize: 32, fontWeight: '800' },
  statUnit:      { fontSize: 12, marginTop: 2 },

  controls:      { marginHorizontal: 16, gap: 10, paddingTop: 8, paddingBottom: 12 },
  secondaryRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  unitToggle:    { flexDirection: 'row', borderRadius: 10, overflow: 'hidden' },
  unitBtn:       { paddingHorizontal: 16, paddingVertical: 10 },
  unitBtnText:   { fontSize: 13, fontWeight: '600' },
  mainBtn:       { padding: 18, borderRadius: 14, alignItems: 'center' },
  mainBtnText:   { fontSize: 18, fontWeight: 'bold' },
  resetBtn:      { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  resetBtnText:  { fontSize: 13, fontWeight: '600' },
});
