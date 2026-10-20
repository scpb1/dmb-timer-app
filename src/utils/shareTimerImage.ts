import type { RefObject } from 'react';
import { Alert, Dimensions, PixelRatio, View } from 'react-native';
import * as Sharing from 'expo-sharing';

import { isMediaLibraryAvailable, isViewShotAvailable } from '@/utils/nativeAvailability';
import { logger } from '@/utils/logger';

function toFileUri(uri: string): string {
  return uri.startsWith('file://') ? uri : `file://${uri}`;
}

async function captureTimerImage(target: RefObject<View | null>): Promise<string | null> {
  if (!isViewShotAvailable()) {
    Alert.alert('Ошибка', 'Не удалось подготовить картинку');
    return null;
  }

  if (!target?.current) {
    Alert.alert('Ошибка', 'Не удалось подготовить картинку таймера');
    return null;
  }

  const { width, height } = Dimensions.get('window');
  const pixelRatio = PixelRatio.get();
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

async function shareCapturedImage(fileUri: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    Alert.alert('Шаринг недоступен', 'На этом устройстве нельзя отправить файл');
    return;
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'image/png',
    dialogTitle: 'Таймер',
    UTI: 'public.png',
  });
}

async function saveCapturedImage(fileUri: string): Promise<void> {
  if (!isMediaLibraryAvailable()) {
    Alert.alert('Ошибка', 'Сохранение в галерею недоступно. Пересоберите приложение.');
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

export async function shareTimerImage(target: RefObject<View | null>): Promise<void> {
  try {
    const fileUri = await captureTimerImage(target);
    if (!fileUri) {
      return;
    }

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
          void shareCapturedImage(fileUri).catch((error) => {
            logger.error('Ошибка шаринга таймера', error);
            Alert.alert('Ошибка', 'Не удалось поделиться картинкой');
          });
        },
      },
      { text: 'Отмена', style: 'cancel' },
    ];

    Alert.alert('Картинка таймера', 'Сохранить в галерею или отправить', buttons);
  } catch (error) {
    logger.error('Ошибка шаринга таймера', error);
    Alert.alert('Ошибка', 'Не удалось подготовить картинку');
  }
}
