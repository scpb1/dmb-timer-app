import * as FileSystem from 'expo-file-system';

import { WIDGET_BACKGROUND_DIRECTORY } from '@/constants/mediaDirectories';
import { imageExtension } from '@/utils/mediaExtension';

function getBackgroundDirectory(): string {
  if (!FileSystem.documentDirectory) {
    throw new Error('Нет доступа к файловой системе');
  }

  return `${FileSystem.documentDirectory}${WIDGET_BACKGROUND_DIRECTORY}`;
}

/** Копирует фото фона виджета в документы приложения. */
export async function persistWidgetBackground(sourceUri: string): Promise<string> {
  const directory = getBackgroundDirectory();
  const directoryInfo = await FileSystem.getInfoAsync(directory);

  if (!directoryInfo.exists) {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  }

  const destination = `${directory}background-${Date.now()}.${imageExtension(sourceUri)}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return destination;
}

export async function removeWidgetBackground(uri?: string | null): Promise<void> {
  if (!uri || !uri.startsWith(getBackgroundDirectory())) {
    return;
  }

  await FileSystem.deleteAsync(uri, { idempotent: true });
}

export async function clearWidgetBackgrounds(): Promise<void> {
  const directory = getBackgroundDirectory();
  const info = await FileSystem.getInfoAsync(directory);
  if (info.exists) {
    await FileSystem.deleteAsync(directory, { idempotent: true });
  }
}
