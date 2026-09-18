import * as FileSystem from 'expo-file-system';

const TIMER_BACKGROUND_DIRECTORY = 'timer-background/';

function getImageExtension(uri: string): string {
  const extension = uri.split('.').pop()?.split('?')[0]?.toLowerCase();
  return extension && /^[a-z0-9]{2,5}$/.test(extension) ? extension : 'jpg';
}

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

  const destination = `${directory}background-${Date.now()}.${getImageExtension(sourceUri)}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return destination;
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
