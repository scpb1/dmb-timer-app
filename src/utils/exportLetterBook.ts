import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { parseISO } from 'date-fns';

import { CONFIG_KEYS } from '@/types/config';
import type { LetterBookVariantId } from '@/types/letterBook';
import { getLetterBookVariant } from '@/types/letterBook';
import type { DiaryEntry } from '@/types/diary';
import {
  getConfig,
  getDiaryEntriesByKind,
  getLetterThemes,
} from '@/services/database';
import { isDocumentBlank } from '@/utils/diaryContent';
import {
  buildLetterBookHtml,
  formatLetterDate,
  type LetterBookLetter,
  type LetterBookPayload,
} from '@/utils/letterBookHtml';
import { logger } from '@/utils/logger';
import { isPrintAvailable } from '@/utils/nativeAvailability';
import { loadServiceSummarySafe, toDateKey } from '@/utils/serviceSummary';
import {
  buildDisplayHolidays,
  parseHolidaysStorage,
  resolveHolidayThemeTitle,
} from '@/utils/holidayCalculations';

export const LETTER_BOOK_PAGE = {
  width: 420,
  height: 595,
} as const;

function mimeFromUri(uri: string): string {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase();
  if (ext === 'png') {
    return 'image/png';
  }
  if (ext === 'webp') {
    return 'image/webp';
  }
  if (ext === 'gif') {
    return 'image/gif';
  }
  if (ext === 'svg') {
    return 'image/svg+xml';
  }
  return 'image/jpeg';
}

async function imageToDataUri(uri: string): Promise<string | null> {
  try {
    if (uri.toLowerCase().includes('.svg')) {
      const svg = await FileSystem.readAsStringAsync(uri);
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:${mimeFromUri(uri)};base64,${base64}`;
  } catch (error) {
    logger.error('Не удалось вложить фото в книгу писем', error);
    return null;
  }
}

async function collectImages(entries: DiaryEntry[]): Promise<Record<string, string>> {
  const uris = new Set<string>();
  for (const entry of entries) {
    for (const block of entry.document.blocks) {
      if (block.type === 'image' && block.uri) {
        uris.add(block.uri);
      }
    }
  }

  const entriesList = await Promise.all(
    [...uris].map(async (uri) => {
      const dataUri = await imageToDataUri(uri);
      return dataUri ? ([uri, dataUri] as const) : null;
    }),
  );

  const images: Record<string, string> = {};
  for (const item of entriesList) {
    if (item) {
      images[item[0]] = item[1];
    }
  }
  return images;
}

async function resolveThemeTitles(entries: DiaryEntry[]): Promise<Map<string, string>> {
  const [themes, holidaysRaw, enlistmentRaw, demobilizationRaw] = await Promise.all([
    getLetterThemes(),
    getConfig(CONFIG_KEYS.HOLIDAYS_DATA),
    getConfig(CONFIG_KEYS.ENLISTMENT_DATE),
    getConfig(CONFIG_KEYS.DEMOBILIZATION_DATE),
  ]);

  const titles = new Map(themes.map((theme) => [theme.id, theme.title]));
  const enlistmentDate = enlistmentRaw ? parseISO(enlistmentRaw) : null;
  const demobilizationDate = demobilizationRaw ? parseISO(demobilizationRaw) : null;
  const holidays = buildDisplayHolidays(
    parseHolidaysStorage(holidaysRaw),
    enlistmentDate ?? new Date(),
    enlistmentDate && demobilizationDate
      ? { start: enlistmentDate, end: demobilizationDate }
      : null,
  );

  for (const entry of entries) {
    const themeId = entry.themeId;
    if (!themeId || titles.has(themeId)) {
      continue;
    }
    const holidayTitle = resolveHolidayThemeTitle(themeId, holidays);
    if (holidayTitle) {
      titles.set(themeId, holidayTitle);
    }
  }

  return titles;
}

export interface LetterBookExportOptions {
  includePhotos: boolean;
}

export async function loadLetterBookPayload(
  options: LetterBookExportOptions = { includePhotos: true },
): Promise<LetterBookPayload> {
  const [entries, userName, partnerName, enlistmentRaw, demobilizationRaw] = await Promise.all([
    getDiaryEntriesByKind('letter'),
    getConfig(CONFIG_KEYS.USER_NAME),
    getConfig(CONFIG_KEYS.PARTNER_NAME),
    getConfig(CONFIG_KEYS.ENLISTMENT_DATE),
    getConfig(CONFIG_KEYS.DEMOBILIZATION_DATE),
  ]);

  const filled = entries.filter((entry) => !isDocumentBlank(entry.document));
  const titles = await resolveThemeTitles(filled);
  const letters: LetterBookLetter[] = filled.map((entry) => {
    const labels = formatLetterDate(entry.entryDate);
    return {
      date: entry.entryDate,
      themeTitle: (entry.themeId && titles.get(entry.themeId)) || 'Без темы',
      document: entry.document,
      ...labels,
    };
  });

  const summary = await loadServiceSummarySafe({
    userName: userName ?? '',
    partnerName: partnerName ?? '',
    enlistmentDate: enlistmentRaw ? parseISO(enlistmentRaw) : null,
    demobilizationDate: demobilizationRaw ? parseISO(demobilizationRaw) : null,
  });

  return {
    userName: (userName ?? '').trim(),
    partnerName: (partnerName ?? '').trim(),
    summary,
    letters,
    includePhotos: options.includePhotos,
    images: options.includePhotos ? await collectImages(filled) : {},
  };
}

async function writePdfFile(html: string, variantId: LetterBookVariantId): Promise<string> {
  const Print = require('expo-print') as typeof import('expo-print');
  const { uri } = await Print.printToFileAsync({
    html,
    width: LETTER_BOOK_PAGE.width,
    height: LETTER_BOOK_PAGE.height,
  });

  const destDir = FileSystem.cacheDirectory;
  if (!destDir) {
    return uri;
  }

  const dest = `${destDir}schetchik-ddd-letters-${variantId}-${toDateKey(new Date())}.pdf`;
  try {
    const info = await FileSystem.getInfoAsync(dest);
    if (info.exists) {
      await FileSystem.deleteAsync(dest, { idempotent: true });
    }
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch (error) {
    logger.error('Не удалось переименовать PDF книги', error);
    return uri;
  }
}

async function sharePdf(fileUri: string, title: string): Promise<void> {
  const Sharing = require('expo-sharing') as typeof import('expo-sharing');
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    Alert.alert('Шаринг недоступен', 'На этом устройстве нельзя отправить файл');
    return;
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/pdf',
    dialogTitle: title,
    UTI: 'com.adobe.pdf',
  });
}

async function printPdf(fileUri: string): Promise<void> {
  const Print = require('expo-print') as typeof import('expo-print');
  await Print.printAsync({ uri: fileUri });
}

export async function exportLetterBook(
  variantId: LetterBookVariantId,
  options: LetterBookExportOptions = { includePhotos: true },
): Promise<boolean> {
  if (!isPrintAvailable()) {
    Alert.alert('Недоступно', 'Экспорт в PDF недоступен. Пересоберите приложение');
    return false;
  }

  const payload = await loadLetterBookPayload(options);
  if (payload.letters.length === 0) {
    Alert.alert('Пока пусто', 'Сначала напишите хотя бы одно письмо');
    return false;
  }

  const variant = getLetterBookVariant(variantId);
  const html = buildLetterBookHtml(variantId, payload);
  const fileUri = await writePdfFile(html, variantId);

  Alert.alert(variant.title, 'Книга писем собрана', [
    {
      text: 'Поделиться',
      onPress: () => {
        void sharePdf(fileUri, variant.title).catch((error) => {
          logger.error('Ошибка шаринга книги писем', error);
          Alert.alert('Ошибка', 'Не удалось поделиться PDF');
        });
      },
    },
    {
      text: 'Печать',
      onPress: () => {
        void printPdf(fileUri).catch((error) => {
          logger.error('Ошибка печати книги писем', error);
          Alert.alert('Ошибка', 'Не удалось открыть печать');
        });
      },
    },
    { text: 'Закрыть', style: 'cancel' },
  ]);

  return true;
}
