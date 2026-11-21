import type { DiaryBlock, DiaryTextSpan } from '@/types/diary';
import { flattenSpans, isDocumentBlank, parseDiaryDocument } from '@/utils/diaryContent';

jest.mock('expo-crypto', () => {
  let next = 0;
  return {
    randomUUID: () => {
      next += 1;
      return `id-${next}`;
    },
  };
});

describe('parseDiaryDocument', () => {
  it('кривой JSON и пустая строка становятся пустым документом', () => {
    expect(parseDiaryDocument('{').blocks).toHaveLength(1);
    expect(parseDiaryDocument('null').blocks[0]?.type).toBe('paragraph');
    expect(parseDiaryDocument('').blocks).toHaveLength(1);
    expect(parseDiaryDocument(undefined).version).toBe(1);
    expect(isDocumentBlank(parseDiaryDocument('{'))).toBe(true);
  });

  it('заменяет абзац без spans пустым абзацем и не падает', () => {
    const raw = JSON.stringify({
      version: 1,
      blocks: [{ id: 'p1', type: 'paragraph' }],
    });

    const document = parseDiaryDocument(raw);
    expect(document.blocks).toHaveLength(1);
    expect(document.blocks[0]?.type).toBe('paragraph');
    if (document.blocks[0]?.type === 'paragraph') {
      expect(Array.isArray(document.blocks[0].spans)).toBe(true);
      expect(document.blocks[0].spans.length).toBeGreaterThan(0);
    }
    expect(isDocumentBlank(document)).toBe(true);
  });

  it('оставляет валидные спаны и отбрасывает картинку без uri или aspectRatio', () => {
    const raw = JSON.stringify({
      version: 1,
      blocks: [
        {
          id: 'p1',
          type: 'paragraph',
          spans: [{ id: 's1', text: 'привет', style: { fontId: 'system', fontSize: 18, color: '#111', bold: false, italic: false, underline: false } }],
        },
        { id: 'img-bad', type: 'image', uri: 'file://photo.jpg' },
        { id: 'img-ok', type: 'image', uri: 'file://ok.jpg', aspectRatio: 1.5, widthRatio: 0.5 },
      ],
    });

    const document = parseDiaryDocument(raw);
    expect(document.blocks.map((block) => block.id)).toEqual(['p1', 'img-ok']);
    expect(isDocumentBlank(document)).toBe(false);
  });

  it('flattenSpans и isDocumentBlank переживают отсутствие массива', () => {
    expect(flattenSpans(undefined)).toBe('');
    expect(
      isDocumentBlank({
        version: 1,
        blocks: [{ id: 'p', type: 'paragraph' } as DiaryBlock],
      }),
    ).toBe(true);
    expect(flattenSpans([{ text: 'a' } as DiaryTextSpan, null as unknown as DiaryTextSpan])).toBe('a');
  });
});
