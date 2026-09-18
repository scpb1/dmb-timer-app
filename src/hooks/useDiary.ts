import { useCallback, useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import { Image } from 'react-native';
import { parseISO } from 'date-fns';

import type { DiaryDocument, DiaryEntry, DiaryKind, LetterTheme } from '@/types/diary';
import { CONFIG_KEYS } from '@/types/config';
import {
  getConfig,
  getDiaryEntry,
  getLetterThemes,
  getUsedLetterThemeIds,
  upsertDiaryEntry,
} from '@/services/database';
import { createDiaryId } from '@/utils/diaryContent';
import {
  buildDisplayHolidays,
  buildHolidayLetterThemesForDate,
  isHolidayThemeId,
  parseHolidaysStorage,
  resolveHolidayThemeTitle,
} from '@/utils/holidayCalculations';
import { logger } from '@/utils/logger';

async function ensureDiaryDirectory(): Promise<string> {
  const base = FileSystem.documentDirectory;
  if (!base) {
    throw new Error('Нет доступа к файловой системе');
  }

  const dir = `${base}diary/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

function getImageExtension(uri: string): string {
  const fromUri = uri.split('.').pop()?.split('?')[0];
  if (fromUri && fromUri.length <= 5) {
    return fromUri;
  }
  return 'jpg';
}

export async function persistDiaryPhoto(sourceUri: string): Promise<string> {
  const dir = await ensureDiaryDirectory();
  if (sourceUri.startsWith(dir)) {
    return sourceUri;
  }

  const dest = `${dir}${createDiaryId()}.${getImageExtension(sourceUri)}`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

export function readImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error),
    );
  });
}

interface UseDiaryEntryResult {
  isLoading: boolean;
  entry: DiaryEntry | null;
  reload: () => Promise<void>;
  save: (document: DiaryDocument, themeId?: string) => Promise<boolean>;
}

/** Загружает одну страницу дневника по типу и дате */
export function useDiaryEntry(kind: DiaryKind, entryDate: string): UseDiaryEntryResult {
  const [isLoading, setIsLoading] = useState(true);
  const [entry, setEntry] = useState<DiaryEntry | null>(null);

  const reload = useCallback(async () => {
    try {
      setIsLoading(true);
      const next = await getDiaryEntry(kind, entryDate);
      setEntry(next);
    } catch (error) {
      logger.error('Ошибка загрузки дневника', error);
      setEntry(null);
    } finally {
      setIsLoading(false);
    }
  }, [kind, entryDate]);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = useCallback(
    async (document: DiaryDocument, themeId?: string): Promise<boolean> => {
      try {
        const saved = await upsertDiaryEntry({
          kind,
          entryDate,
          themeId,
          document,
        });
        setEntry(saved);
        return true;
      } catch (error) {
        logger.error('Ошибка сохранения дневника', error);
        return false;
      }
    },
    [kind, entryDate],
  );

  return { isLoading, entry, reload, save };
}

interface UseLetterThemesResult {
  isLoading: boolean;
  themes: LetterTheme[];
  usedThemeIds: string[];
  unusedThemes: LetterTheme[];
  resolveTitle: (themeId: string) => string | undefined;
  reload: () => Promise<void>;
}

/** Темы писем и список уже использованных */
export function useLetterThemes(entryDate?: string): UseLetterThemesResult {
  const [isLoading, setIsLoading] = useState(true);
  const [themes, setThemes] = useState<LetterTheme[]>([]);
  const [usedThemeIds, setUsedThemeIds] = useState<string[]>([]);
  const [holidayTitles, setHolidayTitles] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    try {
      setIsLoading(true);
      const [catalogThemes, used, holidaysRaw] = await Promise.all([
        getLetterThemes(),
        getUsedLetterThemeIds(entryDate),
        getConfig(CONFIG_KEYS.HOLIDAYS_DATA),
      ]);

      const letterDate = entryDate ? parseISO(entryDate) : new Date();
      const holidays = buildDisplayHolidays(parseHolidaysStorage(holidaysRaw), letterDate);
      const holidayThemes = entryDate
        ? buildHolidayLetterThemesForDate(holidays, letterDate)
        : [];

      const titles: Record<string, string> = {};
      for (const theme of holidayThemes) {
        titles[theme.id] = theme.title;
      }
      for (const usedId of used) {
        if (isHolidayThemeId(usedId) && !titles[usedId]) {
          const resolved = resolveHolidayThemeTitle(usedId, holidays);
          if (resolved) {
            titles[usedId] = resolved;
          }
        }
      }

      setHolidayTitles(titles);
      setThemes([...holidayThemes, ...catalogThemes]);
      setUsedThemeIds(used);
    } catch (error) {
      logger.error('Ошибка загрузки тем писем', error);
      setThemes([]);
      setUsedThemeIds([]);
      setHolidayTitles({});
    } finally {
      setIsLoading(false);
    }
  }, [entryDate]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const unusedThemes = themes.filter((theme) => !usedThemeIds.includes(theme.id));

  const resolveTitle = useCallback(
    (themeId: string) =>
      themes.find((theme) => theme.id === themeId)?.title ?? holidayTitles[themeId],
    [holidayTitles, themes],
  );

  return { isLoading, themes, usedThemeIds, unusedThemes, resolveTitle, reload };
}

export function pickRandomTheme(
  themes: LetterTheme[],
  currentId?: string,
): LetterTheme | null {
  if (themes.length === 0) {
    return null;
  }

  const pool = currentId ? themes.filter((theme) => theme.id !== currentId) : themes;
  const source = pool.length > 0 ? pool : themes;
  return source[Math.floor(Math.random() * source.length)] ?? null;
}

/** В день праздника сначала выдаём праздничную тему, иначе случайную из пула */
export function pickPreferredTheme(
  themes: LetterTheme[],
  currentId?: string,
): LetterTheme | null {
  if (currentId) {
    return pickRandomTheme(themes, currentId);
  }

  return themes.find((theme) => isHolidayThemeId(theme.id)) ?? pickRandomTheme(themes);
}
