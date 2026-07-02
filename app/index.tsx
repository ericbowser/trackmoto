import { useState, type ReactElement } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/context/ThemeContext';
import { useAppIcon } from '@/context/AppIconContext';
import MilesScreen    from '@/components/miles/MilesScreen';
import ReceiptsScreen from '@/components/receipts/ReceiptsScreen';
import SpeedScreen    from '@/components/speed/SpeedScreen';

type Tab = 'miles' | 'receipts' | 'speed';

const TABS: { id: Tab; label: string }[] = [
  { id: 'speed',    label: '⚡ Speed'    },
  { id: 'miles',    label: 'Miles'   },
  { id: 'receipts', label: '📋 Docs' },
];

const SCREENS: Record<Tab, ReactElement> = {
  miles:    <MilesScreen />,
  receipts: <ReceiptsScreen />,
  speed:    <SpeedScreen />,
};

export default function Index() {
  const { theme } = useTheme();
  const { appIcon } = useAppIcon();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('speed');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      <View style={styles.content}>
        {SCREENS[activeTab]}
      </View>

      <View style={[
        styles.tabBar,
        { backgroundColor: theme.surface, paddingBottom: Math.max(insets.bottom, 8) },
      ]}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && { borderTopWidth: 2, borderTopColor: theme.accent }]}
            onPress={() => setActiveTab(tab.id)}>
            <Text style={[styles.tabText, { color: activeTab === tab.id ? theme.text : theme.muted }]}>
              {tab.id === 'miles' ? `${appIcon.emoji} ${tab.label}` : tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content:   { flex: 1 },
  tabBar:    { flexDirection: 'row', paddingTop: 10 },
  tab:       { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabText:   { fontSize: 13, fontWeight: '600' },
});
