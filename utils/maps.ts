import { Linking } from 'react-native';

const MAPS_URL = 'https://www.google.com/maps';

/** Opens Google Maps (app if installed, otherwise browser). */
export async function openGoogleMaps(): Promise<void> {
  await Linking.openURL(MAPS_URL);
}
