export const HOLIDAY_NAME_MAX_LENGTH = 50;

export interface HolidayOverride {
  name?: string;
  month?: number;
  day?: number;
}

export interface CustomHolidayRecord {
  id: string;
  name: string;
  month: number;
  day: number;
}

export interface HolidaysStorage {
  deletedIds: string[];
  overrides: Record<string, HolidayOverride>;
  customHolidays: CustomHolidayRecord[];
}

export interface DisplayHoliday {
  id: string;
  name: string;
  month: number;
  day: number;
  date: Date;
  isCustom: boolean;
  isPast: boolean;
}

export const DEFAULT_HOLIDAYS_STORAGE: HolidaysStorage = {
  deletedIds: [],
  overrides: {},
  customHolidays: [],
};

export const PREDEFINED_HOLIDAY_IDS = {
  NEW_YEAR: 'predefined-holiday-new-year',
  CHRISTMAS: 'predefined-holiday-christmas',
  OLD_NEW_YEAR: 'predefined-holiday-old-new-year',
  EPIPHANY: 'predefined-holiday-epiphany',
  VALENTINE: 'predefined-holiday-valentine',
  DEFENDER_DAY: 'predefined-holiday-defender-day',
  WOMENS_DAY: 'predefined-holiday-womens-day',
  VICTORY_DAY: 'predefined-holiday-victory-day',
  FAMILY_DAY: 'predefined-holiday-family-day',
  KNOWLEDGE_DAY: 'predefined-holiday-knowledge-day',
} as const;

export interface PredefinedHolidayTemplate {
  id: string;
  defaultName: string;
  month: number;
  day: number;
}

export const PREDEFINED_HOLIDAYS: PredefinedHolidayTemplate[] = [
  { id: PREDEFINED_HOLIDAY_IDS.NEW_YEAR, defaultName: 'Новый год', month: 1, day: 1 },
  { id: PREDEFINED_HOLIDAY_IDS.CHRISTMAS, defaultName: 'Рождество', month: 1, day: 7 },
  { id: PREDEFINED_HOLIDAY_IDS.OLD_NEW_YEAR, defaultName: 'Старый Новый год', month: 1, day: 14 },
  { id: PREDEFINED_HOLIDAY_IDS.EPIPHANY, defaultName: 'Крещение', month: 1, day: 19 },
  { id: PREDEFINED_HOLIDAY_IDS.VALENTINE, defaultName: 'День святого Валентина', month: 2, day: 14 },
  { id: PREDEFINED_HOLIDAY_IDS.DEFENDER_DAY, defaultName: '23 февраля', month: 2, day: 23 },
  { id: PREDEFINED_HOLIDAY_IDS.WOMENS_DAY, defaultName: '8 марта', month: 3, day: 8 },
  { id: PREDEFINED_HOLIDAY_IDS.VICTORY_DAY, defaultName: 'День Победы', month: 5, day: 9 },
  { id: PREDEFINED_HOLIDAY_IDS.FAMILY_DAY, defaultName: 'День семьи, любви и верности', month: 7, day: 8 },
  { id: PREDEFINED_HOLIDAY_IDS.KNOWLEDGE_DAY, defaultName: '1 сентября', month: 9, day: 1 },
];

export const HOLIDAY_THEME_ID_PREFIX = 'holiday:';
