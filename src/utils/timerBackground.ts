import * as FileSystem from 'expo-file-system';
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';
import { Dimensions, PixelRatio } from 'react-native';

import { TIMER_BACKGROUND_DIRECTORY } from '@/constants/mediaDirectories';
import { imageExtension } from '@/utils/mediaExtension';

function getBackgroundDirectory(): string {
  if (!FileSystem.documentDirectory) {
    throw new Error('Нет доступа к файловой системе');
  }

  return `${FileSystem.documentDirectory}${TIMER_BACKGROUND_DIRECTORY}`;
}

/** Копирует выбранное фото из временного хранилища в документы приложения. */
export async function persistTimerBackground(
  sourceUri: string,
): Promise<string> {
  const directory = getBackgroundDirectory();
  const directoryInfo = await FileSystem.getInfoAsync(directory);

  if (!directoryInfo.exists) {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  }

  const destination = `${directory}background-${Date.now()}.jpg`;
  const width = Math.max(1, Math.round(Dimensions.get('window').width * PixelRatio.get()));

  try {
    const resized = await manipulateAsync(sourceUri, [{ resize: { width } }], {
      compress: 0.85,
      format: SaveFormat.JPEG,
    });
    await FileSystem.copyAsync({ from: resized.uri, to: destination });
    return destination;
  } catch {
    const fallback = `${directory}background-${Date.now()}.${imageExtension(sourceUri)}`;
    await FileSystem.copyAsync({ from: sourceUri, to: fallback });
    return fallback;
  }
}

export const DEFAULT_BACKGROUND_DIM = 32;

export function clampBackgroundDim(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_BACKGROUND_DIM;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function getBackgroundScrimColor(dim: number): string {
  return `rgba(8, 8, 10, ${clampBackgroundDim(dim) / 100})`;
}

/** Удаляет фото, если оно было сохранено самим приложением. */
export async function removeTimerBackground(uri?: string | null): Promise<void> {
  if (!uri || !uri.startsWith(getBackgroundDirectory())) {
    return;
  }

  await FileSystem.deleteAsync(uri, { idempotent: true });
}

type PhotoBackgroundListener = (hasPhoto: boolean) => void;

let hasTimerPhotoBackground = false;
const photoBackgroundListeners = new Set<PhotoBackgroundListener>();

/** Сообщает нижней панели и другим слушателям, что у таймера есть фото. */
export function setTimerPhotoBackgroundActive(hasPhoto: boolean): void {
  if (hasTimerPhotoBackground === hasPhoto) {
    return;
  }

  hasTimerPhotoBackground = hasPhoto;
  photoBackgroundListeners.forEach((listener) => listener(hasTimerPhotoBackground));
}

export function getTimerPhotoBackgroundActive(): boolean {
  return hasTimerPhotoBackground;
}

export function subscribeTimerPhotoBackground(
  listener: PhotoBackgroundListener,
): () => void {
  photoBackgroundListeners.add(listener);
  return () => {
    photoBackgroundListeners.delete(listener);
  };
}
