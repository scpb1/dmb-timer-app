import * as FileSystem from 'expo-file-system';

import { logger } from '@/utils/logger';

export type DatabaseProfileId = 'main' | 'sandbox';

export const DATABASE_FILES: Record<DatabaseProfileId, string> = {
  main: 'zhdi.db',
  sandbox: 'zhdi-sandbox.db',
};

const PROFILE_FILE = 'database-profile.json';

function profilePath(): string | null {
  const dir = FileSystem.documentDirectory;
  return dir ? `${dir}${PROFILE_FILE}` : null;
}

export async function getActiveDatabaseProfile(): Promise<DatabaseProfileId> {
  const path = profilePath();
  if (!path) {
    return 'main';
  }

  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      return 'main';
    }
    const raw = await FileSystem.readAsStringAsync(path);
    const parsed = JSON.parse(raw) as { id?: string };
    return parsed.id === 'sandbox' ? 'sandbox' : 'main';
  } catch (error) {
    logger.error('Не удалось прочитать профиль базы', error);
    return 'main';
  }
}

export async function setActiveDatabaseProfile(id: DatabaseProfileId): Promise<void> {
  const path = profilePath();
  if (!path) {
    return;
  }

  await FileSystem.writeAsStringAsync(path, JSON.stringify({ id }));
}

export function isSandboxProfile(id: DatabaseProfileId): boolean {
  return id === 'sandbox';
}
