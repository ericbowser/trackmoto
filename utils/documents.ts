import { Platform, Linking } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

export type PickedDocument = {
  uri: string;
  mimeType: string;
  fileName: string;
  isImage: boolean;
};

export function isImageMime(mime?: string): boolean {
  return Boolean(mime?.startsWith('image/'));
}

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'document';
}

/** Copy a picked file into app storage so it survives restarts. */
export async function persistDocument(
  sourceUri: string,
  mimeType: string,
  fileName: string,
): Promise<PickedDocument> {
  const dir = FileSystem.documentDirectory;
  if (!dir) throw new Error('App storage is unavailable.');

  const dest = `${dir}doc_${Date.now()}_${safeFileName(fileName)}`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });

  return {
    uri: dest,
    mimeType,
    fileName: safeFileName(fileName),
    isImage: isImageMime(mimeType),
  };
}

/** Open system file picker for images and PDFs (Downloads, Drive, Files, etc.). */
export async function pickFromFiles(): Promise<PickedDocument | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['image/*', 'application/pdf'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  return persistDocument(
    asset.uri,
    asset.mimeType ?? 'application/octet-stream',
    asset.name,
  );
}

/** Open a saved document — images return false (use in-app viewer); PDFs open externally. */
export async function openDocumentExternally(uri: string, mimeType?: string): Promise<boolean> {
  if (isImageMime(mimeType)) return false;

  let openUri = uri;
  if (Platform.OS === 'android') {
    openUri = await FileSystem.getContentUriAsync(uri);
  }
  await Linking.openURL(openUri);
  return true;
}
