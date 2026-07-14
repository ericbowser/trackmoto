import { Stack } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppIconProvider } from '@/context/AppIconContext';
import { VehicleProvider } from '@/context/VehicleContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppIconProvider>
        <VehicleProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
          </Stack>
        </VehicleProvider>
      </AppIconProvider>
    </ThemeProvider>
  );
}
