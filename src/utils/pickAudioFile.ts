import { Alert } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

interface DocumentPickerAsset {
  uri: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

type DocumentPickerResult =
  | { canceled: true; assets?: null }
  | { canceled: false; assets: DocumentPickerAsset[] };

interface ExpoDocumentPickerNative {
  getDocumentAsync: (options: {
    type?: string[];
    copyToCacheDirectory?: boolean;
    multiple?: boolean;
  }) => Promise<DocumentPickerResult>;
}

function getDocumentPickerNative(): ExpoDocumentPickerNative | null {
  try {
    return requireNativeModule('ExpoDocumentPicker');
  } catch {
    return null;
  }
}

export function isAudioPickerAvailable(): boolean {
  return getDocumentPickerNative() !== null;
}

export async function pickAudioFile(): Promise<{ uri: string; name: string } | null> {
  const picker = getDocumentPickerNative();

  if (!picker) {
    Alert.alert(
      'Нужна пересборка приложения',
      'Чтобы прикреплять аудиофайлы, пересоберите dev client:\n\nnpm run android\nили\nnpm run ios',
    );
    return null;
  }

  try {
    const result = await picker.getDocumentAsync({
      type: ['audio/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      name: asset.name ?? 'audio',
    };
  } catch (error) {
    Alert.alert('Ошибка', 'Не удалось выбрать аудиофайл');
    return null;
  }
}
