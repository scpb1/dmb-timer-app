import * as FileSystem from 'expo-file-system';

import { USER_MEDIA_DIRECTORIES } from '@/constants/mediaDirectories';
import { logger } from '@/utils/logger';
import { setTimerPhotoBackgroundActive } from '@/utils/timerBackground';

export async function deleteUserMediaDirectories(): Promise<void> {
  const base = FileSystem.documentDirectory;
  if (!base) {
    return;
  }

  for (const relative of USER_MEDIA_DIRECTORIES) {
    const dir = `${base}${relative}`;
    try {
      const info = await FileSystem.getInfoAsync(dir);
      if (info.exists) {
        await FileSystem.deleteAsync(dir, { idempotent: true });
      }
    } catch (error) {
      logger.error('Не удалось удалить файлы приложения', error);
      throw error;
    }
  }

  setTimerPhotoBackgroundActive(false);
}
