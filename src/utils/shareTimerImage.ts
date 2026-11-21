import type { RefObject } from 'react';
import { Alert, Dimensions, PixelRatio, View } from 'react-native';
import { format } from 'date-fns';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { isMediaLibraryAvailable, isViewShotAvailable } from '@/utils/nativeAvailability';
import { logger } from '@/utils/logger';

function galleryPhotoName(date: Date = new Date()): string {
  return `girly-ddd-${format(date, 'dd.MM.yyyy-HH-mm-ss')}.png`;
}

async function withGalleryFileName(fileUri: string): Promise<string> {
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    return fileUri;
  }

  const dest = `${cacheDir}${galleryPhotoName()}`;
  try {
    const info = await FileSystem.getInfoAsync(dest);
    if (info.exists) {
      await FileSystem.deleteAsync(dest, { idempotent: true });
    }
    await FileSystem.copyAsync({ from: fileUri, to: dest });
    return dest;
  } catch (error) {
    logger.error('Не удалось задать имя фото', error);
    return fileUri;
  }
}

function toFileUri(uri: string): string {
  return uri.startsWith('file://') ? uri : `file://${uri}`;
}

async function captureTimerImage(
  target: RefObject<View | null>,
  captureSize?: { width: number; height: number },
): Promise<string | null> {
  if (!isViewShotAvailable()) {
    Alert.alert('Ошибка', 'Не удалось подготовить картинку');
    return null;
  }

  if (!target?.current) {
    Alert.alert('Ошибка', 'Не удалось подготовить картинку таймера');
    return null;
  }

  const windowSize = Dimensions.get('window');
  const pixelRatio = PixelRatio.get();
  const width = captureSize?.width ?? windowSize.width;
  const height = captureSize?.height ?? windowSize.height;
  if (width < 1 || height < 1) {
    Alert.alert('Ошибка', 'Не удалось подготовить картинку');
    return null;
  }
  const { captureRef } = require('react-native-view-shot') as typeof import('react-native-view-shot');
  const uri = await captureRef(target, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    width: Math.round(width * pixelRatio),
    height: Math.round(height * pixelRatio),
    handleGLSurfaceViewOnAndroid: true,
    useRenderInContext: true,
  });

  return toFileUri(uri);
}

async function shareCapturedImage(fileUri: string, dialogTitle: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    Alert.alert('Шаринг недоступен', 'На этом устройстве нельзя отправить файл');
    return;
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'image/png',
    dialogTitle,
    UTI: 'public.png',
  });
}

async function saveCapturedImage(fileUri: string): Promise<void> {
  if (!isMediaLibraryAvailable()) {
    Alert.alert('Ошибка', 'Сохранение в галерею недоступно. Пересоберите приложение');
    return;
  }

  const MediaLibrary = require('expo-media-library') as typeof import('expo-media-library');
  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (permission.status !== 'granted') {
    Alert.alert('Нет доступа', 'Разрешите сохранение фото, чтобы положить картинку в галерею');
    return;
  }

  await MediaLibrary.saveToLibraryAsync(fileUri);
  Alert.alert('Готово', 'Картинка сохранена в галерею');
}

export interface ShareTimerImageOptions {
  alertTitle?: string;
  alertMessage?: string;
  shareDialogTitle?: string;
  /** Размер снятого блока в поинтах. Без него снимается весь экран. */
  captureSize?: { width: number; height: number };
}

export async function shareTimerImage(
  target: RefObject<View | null>,
  options: ShareTimerImageOptions = {},
): Promise<void> {
  const alertTitle = options.alertTitle ?? 'Картинка таймера';
  const alertMessage = options.alertMessage ?? 'Сохранить в галерею или отправить';
  const shareDialogTitle = options.shareDialogTitle ?? 'Таймер';
  try {
    const capturedUri = await captureTimerImage(target, options.captureSize);
    if (!capturedUri) {
      return;
    }

    const fileUri = await withGalleryFileName(capturedUri);

    const buttons: {
      text: string;
      style?: 'cancel' | 'destructive' | 'default';
      onPress?: () => void;
    }[] = [
      {
        text: 'Сохранить в галерею',
        onPress: () => {
          void saveCapturedImage(fileUri).catch((error) => {
            logger.error('Ошибка сохранения таймера в галерею', error);
            Alert.alert('Ошибка', 'Не удалось сохранить картинку');
          });
        },
      },
      {
        text: 'Поделиться',
        onPress: () => {
          void shareCapturedImage(fileUri, shareDialogTitle).catch((error) => {
            logger.error('Ошибка шаринга таймера', error);
            Alert.alert('Ошибка', 'Не удалось поделиться картинкой');
          });
        },
      },
      { text: 'Отмена', style: 'cancel' },
    ];

    Alert.alert(alertTitle, alertMessage, buttons);
  } catch (error) {
    logger.error('Ошибка шаринга таймера', error);
    Alert.alert('Ошибка', 'Не удалось подготовить картинку');
  }
}
