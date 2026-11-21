import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { requireNativeModule } from 'expo-modules-core';

const MAX_AUDIO_FILE_BYTES = 50 * 1024 * 1024;

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

async function isAudioTooLarge(uri: string, reportedSize?: number): Promise<boolean> {
  if (typeof reportedSize === 'number' && reportedSize > MAX_AUDIO_FILE_BYTES) {
    return true;
  }

  try {
    const info = await FileSystem.getInfoAsync(uri);
    const size = info.exists && 'size' in info ? info.size : undefined;
    return typeof size === 'number' && size > MAX_AUDIO_FILE_BYTES;
  } catch {
    return false;
  }
}

async function deleteCachedCopy(uri: string): Promise<void> {
  const cache = FileSystem.cacheDirectory;
  if (!cache || !uri.startsWith(cache)) {
    return;
  }

  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Копия в кэше не обязана удалиться: выбор уже отклонён.
  }
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
    if (await isAudioTooLarge(asset.uri, asset.size)) {
      await deleteCachedCopy(asset.uri);
      Alert.alert('Слишком большой файл', 'Выберите аудио не больше 50 МБ');
      return null;
    }
    return {
      uri: asset.uri,
      name: asset.name ?? 'audio',
    };
  } catch {
    Alert.alert('Ошибка', 'Не удалось выбрать аудиофайл');
    return null;
  }
}
