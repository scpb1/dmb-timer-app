export type DiaryKind = 'personal' | 'letter';

export type DiaryFontId = 'system';

export interface DiaryTextStyle {
  fontId: DiaryFontId;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

export interface DiaryTextSpan {
  id: string;
  text: string;
  style: DiaryTextStyle;
}

export interface DiaryParagraphBlock {
  id: string;
  type: 'paragraph';
  spans: DiaryTextSpan[];
}

export interface DiaryImageBlock {
  id: string;
  type: 'image';
  uri: string;
  widthRatio: number;
  aspectRatio: number;
}

export type DiaryBlock = DiaryParagraphBlock | DiaryImageBlock;

export interface DiaryDocument {
  version: 1;
  blocks: DiaryBlock[];
}

export interface DiaryEntry {
  id: string;
  kind: DiaryKind;
  entryDate: string;
  themeId?: string;
  document: DiaryDocument;
  updatedAt: string;
}

export interface LetterTheme {
  id: string;
  title: string;
  sortOrder: number;
}

export const DIARY_FONTS: { id: DiaryFontId; label: string }[] = [
  { id: 'system', label: 'Основной' },
];

export const DIARY_FONT_SIZES = [14, 16, 18, 22, 28] as const;

export const DEFAULT_DIARY_TEXT_COLOR = '#3E3630';

export const DEFAULT_DIARY_TEXT_STYLE: DiaryTextStyle = {
  fontId: 'system',
  fontSize: 18,
  color: DEFAULT_DIARY_TEXT_COLOR,
  bold: false,
  italic: false,
  underline: false,
};

export const DIARY_MIN_PHOTO_RATIO = 1 / 6;
export const DIARY_DEFAULT_PHOTO_RATIO = 0.72;
export const DIARY_THEME_REVEAL_MS = 5_000;
export const DIARY_READY_BUTTON_DELAY_MS = 1_000;

export { SEED_LETTER_THEMES } from '@/data/letterThemes';
