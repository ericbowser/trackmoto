import { Stack } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppIconProvider } from '@/context/AppIconContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppIconProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
      </AppIconProvider>
    </ThemeProvider>
  );
}
