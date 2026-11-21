import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';

import { CALL_AUDIO_DIRECTORY, MEETING_MEDIA_DIRECTORY } from '@/constants/mediaDirectories';
import type { MeetingMediaItem } from '@/types/trackers';
import { audioExtension, imageExtension, videoExtension } from '@/utils/mediaExtension';
import { logger } from '@/utils/logger';

async function ensureDirectory(directoryName: string): Promise<string> {
  const dir = `${FileSystem.documentDirectory}${directoryName}`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

export async function deleteTrackerFile(uri: string | undefined): Promise<void> {
  if (!uri) {
    return;
  }

  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch (error) {
    logger.error('Ошибка удаления файла трекера', error);
  }
}

export async function saveCallAudio(sourceUri: string, entryId: string): Promise<string | null> {
  try {
    const dir = await ensureDirectory(CALL_AUDIO_DIRECTORY);
    const dest = `${dir}${entryId}.${audioExtension(sourceUri)}`;
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    return dest;
  } catch (error) {
    logger.error('Ошибка сохранения аудио', error);
    return null;
  }
}

function meetingExtension(uri: string, mediaType: MeetingMediaItem['type']): string {
  return mediaType === 'video' ? videoExtension(uri) : imageExtension(uri);
}

export async function saveMeetingMedia(
  entryId: string,
  items: MeetingMediaItem[],
): Promise<MeetingMediaItem[]> {
  const dir = await ensureDirectory(MEETING_MEDIA_DIRECTORY);
  const saved: MeetingMediaItem[] = [];

  for (const item of items) {
    if (item.uri.startsWith(dir)) {
      saved.push(item);
      continue;
    }

    const dest = `${dir}${entryId}-${Crypto.randomUUID()}.${meetingExtension(item.uri, item.type)}`;
    try {
      await FileSystem.copyAsync({ from: item.uri, to: dest });
      saved.push({ uri: dest, type: item.type });
    } catch (error) {
      logger.error('Ошибка сохранения медиа', error);
    }
  }

  return saved;
}

export async function deleteMeetingMedia(items?: MeetingMediaItem[]): Promise<void> {
  if (!items?.length) {
    return;
  }

  for (const item of items) {
    await deleteTrackerFile(item.uri);
  }
}
