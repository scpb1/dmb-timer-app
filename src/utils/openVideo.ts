import { Alert, Linking, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { logger } from '@/utils/logger';

/** Открывает видео во внешнем плеере телефона, не в приложении */
export async function openVideoExternally(uri: string): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      const contentUri = await FileSystem.getContentUriAsync(uri);
      await Linking.openURL(contentUri);
      return;
    }

    const canOpen = await Linking.canOpenURL(uri);
    if (canOpen) {
      await Linking.openURL(uri);
      return;
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { UTI: 'public.movie', mimeType: 'video/mp4' });
      return;
    }

    throw new Error('Нет приложения для видео');
  } catch (error) {
    logger.error('Не удалось открыть видео во внешнем плеере', error);
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: 'public.movie', mimeType: 'video/mp4' });
        return;
      }
    } catch (shareError) {
      logger.error('Не удалось поделиться видео', shareError);
    }
    Alert.alert('Не удалось открыть видео', 'Попробуйте ещё раз или откройте файл из галереи');
  }
}
