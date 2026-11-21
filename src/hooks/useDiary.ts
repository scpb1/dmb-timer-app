import { useCallback, useEffect, useRef, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import { Image } from 'react-native';
import { parseISO } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';

import type { DiaryDocument, DiaryEntry, DiaryKind, LetterTheme } from '@/types/diary';
import { CONFIG_KEYS } from '@/types/config';
import {
  getConfig,
  getDiaryCalendarMarks,
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
import { imageExtension } from '@/utils/mediaExtension';
import { DIARY_MEDIA_DIRECTORY } from '@/constants/mediaDirectories';
import { rescheduleAppNotifications } from '@/services/holidayNotifications';

async function ensureDiaryDirectory(): Promise<string> {
  const base = FileSystem.documentDirectory;
  if (!base) {
    throw new Error('Нет доступа к файловой системе');
  }

  const dir = `${base}${DIARY_MEDIA_DIRECTORY}`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

export async function persistDiaryPhoto(sourceUri: string): Promise<string> {
  const dir = await ensureDiaryDirectory();
  if (sourceUri.startsWith(dir)) {
    return sourceUri;
  }

  const dest = `${dir}${createDiaryId()}.${imageExtension(sourceUri)}`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

/** Удаляет копию фото из папки приложения, галерею телефона не трогает */
export async function removeDiaryPhotoIfOwned(uri: string): Promise<void> {
  try {
    const dir = await ensureDiaryDirectory();
    if (!uri.startsWith(dir)) {
      return;
    }

    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch (error) {
    logger.error('Не удалось удалить фото дневника из файлов приложения', error);
  }
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
  const requestIdRef = useRef(0);
  const pageRef = useRef({ kind, entryDate });
  pageRef.current = { kind, entryDate };

  const reload = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const requestKind = kind;
    const requestDate = entryDate;

    try {
      setIsLoading(true);
      const next = await getDiaryEntry(requestKind, requestDate);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setEntry(next);
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      logger.error('Ошибка загрузки дневника', error);
      setEntry(null);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [kind, entryDate]);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = useCallback(
    async (document: DiaryDocument, themeId?: string): Promise<boolean> => {
      const savedKind = kind;
      const savedDate = entryDate;
      try {
        const saved = await upsertDiaryEntry({
          kind: savedKind,
          entryDate: savedDate,
          themeId,
          document,
        });
        if (pageRef.current.kind === savedKind && pageRef.current.entryDate === savedDate) {
          setEntry(saved);
        }
        if (savedKind === 'letter') {
          void rescheduleAppNotifications();
        }
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

export type DiaryCalendarMarks = Record<string, { personal?: boolean; letter?: boolean }>;

export type LetterDestination =
  | { screen: 'LetterEditor'; themeId: string }
  | { screen: 'LetterTheme' };

/** Куда открывать письмо на дату: редактор, если тема уже выбрана. */
export async function resolveLetterDestination(date: string): Promise<LetterDestination> {
  const existing = await getDiaryEntry('letter', date);
  if (existing?.themeId) {
    return { screen: 'LetterEditor', themeId: existing.themeId };
  }
  return { screen: 'LetterTheme' };
}

/** Точки календаря дневника. Обновляется, когда экран снова в фокусе. */
export function useDiaryCalendar() {
  const [marks, setMarks] = useState<DiaryCalendarMarks>({});

  const reload = useCallback(async () => {
    try {
      const loaded = await getDiaryCalendarMarks();
      const next: DiaryCalendarMarks = {};
      for (const date of loaded.personal) {
        next[date] = { ...next[date], personal: true };
      }
      for (const date of loaded.letter) {
        next[date] = { ...next[date], letter: true };
      }
      setMarks(next);
    } catch (error) {
      logger.error('Ошибка загрузки календаря дневника', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { marks, reload };
}
