import * as Crypto from 'expo-crypto';
import { TextStyle } from 'react-native';

import { typography } from '@/theme/typography';
import {
  DEFAULT_DIARY_TEXT_STYLE,
  type DiaryBlock,
  type DiaryDocument,
  type DiaryImageBlock,
  type DiaryParagraphBlock,
  type DiaryTextSpan,
  type DiaryTextStyle,
  DIARY_DEFAULT_PHOTO_RATIO,
  DIARY_MIN_PHOTO_RATIO,
} from '@/types/diary';

export function createDiaryId(): string {
  return Crypto.randomUUID();
}

export function cloneStyle(style: DiaryTextStyle = DEFAULT_DIARY_TEXT_STYLE): DiaryTextStyle {
  return { ...style };
}

export function stylesEqual(a: DiaryTextStyle, b: DiaryTextStyle): boolean {
  return (
    a.fontId === b.fontId &&
    a.fontSize === b.fontSize &&
    a.color.toUpperCase() === b.color.toUpperCase() &&
    a.bold === b.bold &&
    a.italic === b.italic &&
    a.underline === b.underline
  );
}

export function resolveDiaryFontFamily(
  fontId: DiaryTextStyle['fontId'],
  bold = false,
): string {
  if (fontId === 'system') {
    return bold ? typography.fontFamily.sansBold : typography.fontFamily.sans;
  }

  return typography.fontFamily.sans;
}

export function toRnTextStyle(style: DiaryTextStyle): TextStyle {
  return {
    fontFamily: resolveDiaryFontFamily(style.fontId, style.bold),
    fontSize: style.fontSize,
    color: style.color,
    fontStyle: style.italic ? 'italic' : 'normal',
    textDecorationLine: style.underline ? 'underline' : 'none',
  };
}

export function createTextSpan(
  text = '',
  style: DiaryTextStyle = DEFAULT_DIARY_TEXT_STYLE,
): DiaryTextSpan {
  return {
    id: createDiaryId(),
    text,
    style: cloneStyle(style),
  };
}

export function createEmptyParagraph(
  style: DiaryTextStyle = DEFAULT_DIARY_TEXT_STYLE,
): DiaryParagraphBlock {
  return {
    id: createDiaryId(),
    type: 'paragraph',
    spans: [createTextSpan('', style)],
  };
}

export function createImageBlock(
  uri: string,
  aspectRatio: number,
  widthRatio = DIARY_DEFAULT_PHOTO_RATIO,
): DiaryImageBlock {
  return {
    id: createDiaryId(),
    type: 'image',
    uri,
    widthRatio: clampPhotoRatio(widthRatio),
    aspectRatio: aspectRatio > 0 ? aspectRatio : 4 / 3,
  };
}

export function createEmptyDocument(
  style: DiaryTextStyle = DEFAULT_DIARY_TEXT_STYLE,
): DiaryDocument {
  return {
    version: 1,
    blocks: [createEmptyParagraph(style)],
  };
}

export function flattenSpans(spans: DiaryTextSpan[]): string {
  return spans.map((span) => span.text).join('');
}

export function isParagraphEmpty(block: DiaryBlock): boolean {
  return block.type === 'paragraph' && flattenSpans(block.spans).trim().length === 0;
}

export function normalizeSpans(
  spans: DiaryTextSpan[],
  fallbackStyle: DiaryTextStyle = DEFAULT_DIARY_TEXT_STYLE,
): DiaryTextSpan[] {
  const merged: DiaryTextSpan[] = [];

  for (const span of spans) {
    if (!span.text) {
      continue;
    }

    const previous = merged[merged.length - 1];
    if (previous && stylesEqual(previous.style, span.style)) {
      previous.text += span.text;
    } else {
      merged.push({
        id: span.id || createDiaryId(),
        text: span.text,
        style: cloneStyle(span.style),
      });
    }
  }

  if (merged.length === 0) {
    return [createTextSpan('', fallbackStyle)];
  }

  return merged;
}

function spanOffsetAt(spans: DiaryTextSpan[], offset: number): { index: number; inner: number } {
  let remaining = Math.max(0, offset);

  for (let index = 0; index < spans.length; index += 1) {
    const length = spans[index].text.length;
    if (remaining < length || index === spans.length - 1) {
      return { index, inner: Math.min(remaining, length) };
    }
    remaining -= length;
  }

  const last = Math.max(0, spans.length - 1);
  return { index: last, inner: spans[last]?.text.length ?? 0 };
}

export function insertText(
  spans: DiaryTextSpan[],
  offset: number,
  text: string,
  style: DiaryTextStyle,
): DiaryTextSpan[] {
  if (!text) {
    return normalizeSpans(spans, style);
  }

  const next = spans.map((span) => ({ ...span, style: cloneStyle(span.style) }));
  const total = flattenSpans(next).length;
  const safeOffset = Math.min(Math.max(0, offset), total);
  const { index, inner } = spanOffsetAt(next, safeOffset);
  const target = next[index];

  if (!target) {
    return normalizeSpans([createTextSpan(text, style)], style);
  }

  if (stylesEqual(target.style, style) || target.text.length === 0) {
    target.text = target.text.slice(0, inner) + text + target.text.slice(inner);
    if (target.text.length > 0 && !stylesEqual(target.style, style)) {
      target.style = cloneStyle(style);
    }
    return normalizeSpans(next, style);
  }

  const before = target.text.slice(0, inner);
  const after = target.text.slice(inner);
  const inserted = createTextSpan(text, style);
  const replacement: DiaryTextSpan[] = [];

  if (before) {
    replacement.push({ ...target, id: createDiaryId(), text: before });
  }
  replacement.push(inserted);
  if (after) {
    replacement.push({ ...target, id: createDiaryId(), text: after });
  }

  next.splice(index, 1, ...replacement);
  return normalizeSpans(next, style);
}

export function deleteRange(spans: DiaryTextSpan[], start: number, end: number): DiaryTextSpan[] {
  if (end <= start) {
    return spans;
  }

  const fallback = spans[0]?.style ?? DEFAULT_DIARY_TEXT_STYLE;
  let cursor = 0;
  const next: DiaryTextSpan[] = [];

  for (const span of spans) {
    const spanStart = cursor;
    const spanEnd = cursor + span.text.length;
    cursor = spanEnd;

    if (spanEnd <= start || spanStart >= end) {
      next.push({ ...span, style: cloneStyle(span.style) });
      continue;
    }

    const keepBefore = span.text.slice(0, Math.max(0, start - spanStart));
    const keepAfter = span.text.slice(Math.max(0, end - spanStart));
    const kept = keepBefore + keepAfter;
    if (kept) {
      next.push({ ...span, id: createDiaryId(), text: kept, style: cloneStyle(span.style) });
    }
  }

  return normalizeSpans(next, fallback);
}

export function applyTextChange(
  spans: DiaryTextSpan[],
  previousText: string,
  nextText: string,
  typingStyle: DiaryTextStyle,
): DiaryTextSpan[] {
  let prefix = 0;
  const minLength = Math.min(previousText.length, nextText.length);
  while (prefix < minLength && previousText[prefix] === nextText[prefix]) {
    prefix += 1;
  }

  let suffix = 0;
  while (
    suffix < previousText.length - prefix &&
    suffix < nextText.length - prefix &&
    previousText[previousText.length - 1 - suffix] === nextText[nextText.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  const deleteEnd = previousText.length - suffix;
  const inserted = nextText.slice(prefix, nextText.length - suffix);
  let result = spans;

  if (deleteEnd > prefix) {
    result = deleteRange(result, prefix, deleteEnd);
  }

  if (inserted) {
    result = insertText(result, prefix, inserted, typingStyle);
  }

  return normalizeSpans(result, typingStyle);
}

function splitSpansAt(spans: DiaryTextSpan[], offset: number): DiaryTextSpan[] {
  const total = flattenSpans(spans).length;
  const safeOffset = Math.min(Math.max(0, offset), total);
  if (safeOffset === 0 || safeOffset === total) {
    return spans.map((span) => ({ ...span, style: cloneStyle(span.style) }));
  }

  const { index, inner } = spanOffsetAt(spans, safeOffset);
  if (inner === 0) {
    return spans.map((span) => ({ ...span, style: cloneStyle(span.style) }));
  }

  const target = spans[index];
  const before = target.text.slice(0, inner);
  const after = target.text.slice(inner);
  const next = spans.map((span) => ({ ...span, style: cloneStyle(span.style) }));
  const replacement: DiaryTextSpan[] = [];

  if (before) {
    replacement.push({ ...target, id: createDiaryId(), text: before });
  }
  if (after) {
    replacement.push({ ...target, id: createDiaryId(), text: after, style: cloneStyle(target.style) });
  }

  next.splice(index, 1, ...replacement);
  return next;
}

export function applyStyleToRange(
  spans: DiaryTextSpan[],
  start: number,
  end: number,
  patch: Partial<DiaryTextStyle>,
): DiaryTextSpan[] {
  if (end <= start) {
    return spans;
  }

  const fallback = spans[0]?.style ?? DEFAULT_DIARY_TEXT_STYLE;
  let split = splitSpansAt(spans, start);
  split = splitSpansAt(split, end);

  let cursor = 0;
  const next = split.map((span) => {
    const spanStart = cursor;
    const spanEnd = cursor + span.text.length;
    cursor = spanEnd;
    const overlaps = spanStart >= start && spanEnd <= end && span.text.length > 0;
    return {
      ...span,
      style: overlaps ? { ...cloneStyle(span.style), ...patch } : cloneStyle(span.style),
    };
  });

  return normalizeSpans(next, fallback);
}

export function styleAtOffset(spans: DiaryTextSpan[], offset: number): DiaryTextStyle {
  if (spans.length === 0) {
    return cloneStyle(DEFAULT_DIARY_TEXT_STYLE);
  }

  const total = flattenSpans(spans).length;
  const safeOffset = Math.min(Math.max(0, offset), Math.max(total, 0));
  const { index, inner } = spanOffsetAt(spans, safeOffset);
  const span = spans[index];

  if (!span) {
    return cloneStyle(DEFAULT_DIARY_TEXT_STYLE);
  }

  if (inner === 0 && index > 0 && safeOffset > 0) {
    return cloneStyle(spans[index - 1].style);
  }

  return cloneStyle(span.style);
}

export function parseDateStamp(stamp: string): Date {
  const [year, month, day] = stamp.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function clampPhotoRatio(ratio: number): number {
  'worklet';
  return Math.min(1, Math.max(DIARY_MIN_PHOTO_RATIO, ratio));
}

export function clampPhotoSize(
  width: number,
  height: number,
  workWidth: number,
  workHeight: number,
): { width: number; height: number } {
  const safeWorkWidth = Math.max(1, workWidth);
  const safeWorkHeight = Math.max(1, workHeight);
  const aspect = width > 0 && height > 0 ? width / height : 4 / 3;
  const minWidth = safeWorkWidth * DIARY_MIN_PHOTO_RATIO;
  const minHeight = safeWorkHeight * DIARY_MIN_PHOTO_RATIO;

  let nextWidth = width;
  let nextHeight = nextWidth / aspect;

  if (nextWidth > safeWorkWidth) {
    nextWidth = safeWorkWidth;
    nextHeight = nextWidth / aspect;
  }
  if (nextHeight > safeWorkHeight) {
    nextHeight = safeWorkHeight;
    nextWidth = nextHeight * aspect;
  }
  if (nextWidth < minWidth) {
    nextWidth = minWidth;
    nextHeight = nextWidth / aspect;
  }
  if (nextHeight < minHeight) {
    nextHeight = minHeight;
    nextWidth = nextHeight * aspect;
  }
  if (nextWidth > safeWorkWidth) {
    nextWidth = safeWorkWidth;
    nextHeight = nextWidth / aspect;
  }
  if (nextHeight > safeWorkHeight) {
    nextHeight = safeWorkHeight;
    nextWidth = nextHeight * aspect;
  }

  return {
    width: Math.max(1, nextWidth),
    height: Math.max(1, nextHeight),
  };
}

export function insertImageAtCursor(
  blocks: DiaryBlock[],
  focusedIndex: number | null,
  image: DiaryImageBlock,
  typingStyle: DiaryTextStyle,
): DiaryBlock[] {
  const next = [...blocks];
  const emptyParagraph = createEmptyParagraph(typingStyle);

  if (next.length === 0) {
    return [image, emptyParagraph];
  }

  const index = focusedIndex == null ? next.length - 1 : Math.min(Math.max(0, focusedIndex), next.length - 1);
  const focused = next[index];

  if (focused?.type === 'paragraph' && isParagraphEmpty(focused)) {
    next.splice(index, 1, image);
    const after = next[index + 1];
    if (!after || after.type !== 'paragraph') {
      next.splice(index + 1, 0, emptyParagraph);
    }
    return next;
  }

  next.splice(index + 1, 0, image);
  const after = next[index + 2];
  if (!after || after.type !== 'paragraph') {
    next.splice(index + 2, 0, emptyParagraph);
  }
  return next;
}

export function removeBlock(blocks: DiaryBlock[], blockId: string): DiaryBlock[] {
  const next = blocks.filter((block) => block.id !== blockId);
  if (next.length === 0) {
    return [createEmptyParagraph()];
  }
  if (next.every((block) => block.type === 'image')) {
    return [...next, createEmptyParagraph()];
  }
  return next;
}

export function moveBlock(blocks: DiaryBlock[], blockId: string, toIndex: number): DiaryBlock[] {
  const fromIndex = blocks.findIndex((block) => block.id === blockId);
  if (fromIndex < 0) {
    return blocks;
  }

  const next = [...blocks];
  const [item] = next.splice(fromIndex, 1);
  const clamped = Math.min(Math.max(0, toIndex), next.length);
  next.splice(clamped, 0, item);
  return next;
}

export function dropIndexForY(
  layouts: { id: string; y: number; height: number }[],
  dropY: number,
): number {
  if (layouts.length === 0) {
    return 0;
  }

  for (let index = 0; index < layouts.length; index += 1) {
    const layout = layouts[index];
    const midpoint = layout.y + layout.height / 2;
    if (dropY < midpoint) {
      return index;
    }
  }

  return layouts.length - 1;
}

export function parseDiaryDocument(raw: string | null | undefined): DiaryDocument {
  if (!raw) {
    return createEmptyDocument();
  }

  try {
    const parsed = JSON.parse(raw) as DiaryDocument;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.blocks)) {
      return createEmptyDocument();
    }

    const blocks = parsed.blocks.filter(
      (block): block is DiaryBlock =>
        Boolean(block) &&
        typeof block.id === 'string' &&
        (block.type === 'paragraph' || block.type === 'image'),
    );

    return {
      version: 1,
      blocks: blocks.length > 0 ? blocks : createEmptyDocument().blocks,
    };
  } catch {
    return createEmptyDocument();
  }
}

export function serializeDiaryDocument(document: DiaryDocument): string {
  return JSON.stringify(document);
}

export function documentsEqual(a: DiaryDocument, b: DiaryDocument): boolean {
  return serializeDiaryDocument(a) === serializeDiaryDocument(b);
}
