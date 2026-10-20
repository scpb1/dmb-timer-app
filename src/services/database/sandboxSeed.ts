import type { SQLiteDatabase } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { addDays, format, formatISO, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

import { CONFIG_KEYS } from '@/types/config';
import {
  DEFAULT_DIARY_TEXT_STYLE,
  type DiaryBlock,
  type DiaryDocument,
  type DiaryTextStyle,
} from '@/types/diary';
import type { CallEntry, MeetingEntry, TrackerMood } from '@/types/trackers';
import { SEED_LETTER_THEMES } from '@/data/letterThemes';
import { createDiaryId, serializeDiaryDocument } from '@/utils/diaryContent';
import { logger } from '@/utils/logger';

export const SANDBOX_SEED_VERSION = '2';

const LETTER_COUNT = 365;
const MOODS: TrackerMood[] = [
  'blissful',
  'happy',
  'excitement',
  'neutral',
  'sad',
  'empty',
];
const COLORS = ['#3E3630', '#8B3A3A', '#4E6A57', '#6B4F9C', '#C45C26', '#2B5F8A'];
const SIZES = [14, 16, 18, 22, 28] as const;

/** 1×1 PNG, в книге растягивается до 4:3 */
const SWATCH_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const LETTER_LINES = [
  'Сегодня день тянулся тихо, и я всё равно ловила себя на том, что улыбаюсь в пустую комнату.',
  'Пишу тебе коротко, чтобы ты знал: я на месте, я жду, я люблю.',
  'Вечером пила чай из твоей кружки. Глупо и очень нужно.',
  'Снился наш двор. Ты сидел на ступеньках, и мне не хотелось просыпаться.',
  'Если бы можно было отправить в посылке обычный вторник, я бы отправила этот.',
];

function style(partial: Partial<DiaryTextStyle> = {}): DiaryTextStyle {
  return { ...DEFAULT_DIARY_TEXT_STYLE, ...partial };
}

function paragraph(spans: Array<{ text: string; style?: Partial<DiaryTextStyle> }>): DiaryBlock {
  return {
    id: createDiaryId(),
    type: 'paragraph',
    spans: spans.map((item) => ({
      id: createDiaryId(),
      text: item.text,
      style: style(item.style),
    })),
  };
}

async function readConfig(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM config WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

async function writeConfig(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', [key, value]);
}

async function ensureSwatchFile(): Promise<string> {
  const dir = `${FileSystem.documentDirectory}sandbox-media/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  const path = `${dir}swatch.png`;
  const file = await FileSystem.getInfoAsync(path);
  if (!file.exists) {
    await FileSystem.writeAsStringAsync(path, SWATCH_PNG_BASE64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
  return path;
}

function buildLetterDocument(
  index: number,
  dateLabel: string,
  themeTitle: string,
  photoUri: string | null,
): DiaryDocument {
  const color = COLORS[index % COLORS.length];
  const size = SIZES[index % SIZES.length];
  const blocks: DiaryBlock[] = [
    paragraph([
      { text: 'День ', style: { fontSize: 16 } },
      { text: String(index + 1), style: { bold: true, fontSize: 16, color } },
      { text: ' · ', style: { fontSize: 16 } },
      { text: dateLabel, style: { italic: true, fontSize: 16 } },
    ]),
    paragraph([
      { text: 'Тема: ', style: { fontSize: 14, color: '#A79A8A' } },
      { text: themeTitle, style: { italic: true, fontSize: 18, color } },
    ]),
    paragraph([{ text: LETTER_LINES[index % LETTER_LINES.length], style: { fontSize: size, color } }]),
  ];

  if (index % 3 === 0) {
    blocks.push(
      paragraph([
        {
          text: 'Я тебя жду.',
          style: { bold: true, underline: true, fontSize: 22, color: '#8B3A3A' },
        },
      ]),
    );
  }

  if (photoUri && index % 5 === 0) {
    blocks.push({
      id: createDiaryId(),
      type: 'image',
      uri: photoUri,
      widthRatio: 0.72,
      aspectRatio: 4 / 3,
    });
  }

  return { version: 1, blocks };
}

function buildPersonalDocument(index: number): DiaryDocument {
  return {
    version: 1,
    blocks: [
      paragraph([
        {
          text: `Личная страница ${index + 1}. Здесь только для себя: устала, скучаю, всё равно держусь.`,
          style: { fontSize: 16 },
        },
      ]),
    ],
  };
}

export async function ensureSandboxSeeded(db: SQLiteDatabase): Promise<void> {
  const version = await readConfig(db, CONFIG_KEYS.SANDBOX_SEED_VERSION);
  if (version === SANDBOX_SEED_VERSION) {
    return;
  }

  logger.info('Заполняем тестовую базу на 365 дней');
  await seedSandbox(db);
}

export async function reseedSandbox(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM diary_entries');
  await db.runAsync('DELETE FROM config WHERE key != ?', ['letter_themes_seed_version']);
  await seedSandbox(db);
}

async function seedSandbox(db: SQLiteDatabase): Promise<void> {
  const photoUri = await ensureSwatchFile();
  const demobilization = startOfDay(new Date());
  const enlistment = addDays(demobilization, -LETTER_COUNT);
  const nowIso = formatISO(new Date());

  const calls: CallEntry[] = [];
  const meetings: MeetingEntry[] = [];

  await db.withTransactionAsync(async () => {
    for (let index = 0; index < LETTER_COUNT; index += 1) {
      const date = addDays(enlistment, index);
      const dateKey = format(date, 'yyyy-MM-dd');
      const theme = SEED_LETTER_THEMES[index % SEED_LETTER_THEMES.length];
      const dateLabel = format(date, 'd MMMM yyyy', { locale: ru });
      const letterDoc = buildLetterDocument(index, dateLabel, theme.title, photoUri);

      await db.runAsync(
        `INSERT OR REPLACE INTO diary_entries
          (id, kind, entry_date, theme_id, content_json, updated_at)
         VALUES (?, 'letter', ?, ?, ?, ?)`,
        [Crypto.randomUUID(), dateKey, theme.id, serializeDiaryDocument(letterDoc), nowIso],
      );

      if (index % 2 === 0) {
        await db.runAsync(
          `INSERT OR REPLACE INTO diary_entries
            (id, kind, entry_date, theme_id, content_json, updated_at)
           VALUES (?, 'personal', ?, NULL, ?, ?)`,
          [Crypto.randomUUID(), dateKey, serializeDiaryDocument(buildPersonalDocument(index)), nowIso],
        );
      }

      if (index % 3 === 0) {
        calls.push({
          id: Crypto.randomUUID(),
          date: dateKey,
          title: `Звонок ${calls.length + 1}`,
          durationSeconds: 180 + (index % 40) * 30,
          moods: [MOODS[index % MOODS.length]],
          createdAt: nowIso,
        });
      }

      if (index % 14 === 0) {
        meetings.push({
          id: Crypto.randomUUID(),
          date: dateKey,
          title: `Встреча ${meetings.length + 1}`,
          startTime: '12:00',
          endTime: '14:00',
          durationSeconds: 7200,
          moods: [MOODS[(index + 1) % MOODS.length]],
          createdAt: nowIso,
        });
      }
    }

    const config: Array<[string, string]> = [
      [CONFIG_KEYS.ONBOARDING_COMPLETED, 'true'],
      [CONFIG_KEYS.USER_NAME, 'Маша'],
      [CONFIG_KEYS.PARTNER_NAME, 'Дима'],
      [CONFIG_KEYS.ENLISTMENT_DATE, enlistment.toISOString()],
      [CONFIG_KEYS.DEMOBILIZATION_DATE, demobilization.toISOString()],
      [CONFIG_KEYS.TRACKERS_CALLS_DATA, JSON.stringify({ entries: calls })],
      [CONFIG_KEYS.TRACKERS_MEETINGS_DATA, JSON.stringify({ entries: meetings })],
      [CONFIG_KEYS.SANDBOX_SEED_VERSION, SANDBOX_SEED_VERSION],
    ];

    for (const [key, value] of config) {
      await writeConfig(db, key, value);
    }
  });

  logger.info('Тестовая база заполнена');
}
