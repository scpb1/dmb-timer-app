import { DEFAULT_CALLS_STORAGE, DEFAULT_MEETINGS_STORAGE } from '@/types/trackers';
import { parseCallsStorage, parseMeetingsStorage } from '@/utils/trackerStorage';

describe('tracker storage parsers', () => {
  it('битый JSON звонков и встреч становится пустым списком', () => {
    expect(parseCallsStorage(null)).toEqual(DEFAULT_CALLS_STORAGE);
    expect(parseCallsStorage('{')).toEqual(DEFAULT_CALLS_STORAGE);
    expect(parseCallsStorage(JSON.stringify({ entries: null }))).toEqual(DEFAULT_CALLS_STORAGE);
    expect(parseMeetingsStorage('[]')).toEqual(DEFAULT_MEETINGS_STORAGE);
  });

  it('переносит старое настроение и заметку звонка', () => {
    const parsed = parseCallsStorage(
      JSON.stringify({
        entries: [
          {
            id: 'call-1',
            date: '2026-01-01',
            durationSeconds: 30,
            mood: 'happy',
            note: 'короткий',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
    );
    expect(parsed.entries[0]?.moods).toEqual(['happy']);
    expect(parsed.entries[0]?.impressions).toBe('короткий');
  });

  it('переносит старое медиа встречи в список', () => {
    const parsed = parseMeetingsStorage(
      JSON.stringify({
        entries: [
          {
            id: 'meet-1',
            date: '2026-02-01',
            durationSeconds: 0,
            mediaUri: 'file://photo.jpg',
            mediaType: 'photo',
            mood: 'sad',
            createdAt: '2026-02-01T00:00:00.000Z',
          },
        ],
      }),
    );
    expect(parsed.entries[0]?.mediaItems).toEqual([{ uri: 'file://photo.jpg', type: 'photo' }]);
    expect(parsed.entries[0]?.moods).toEqual(['sad']);
  });
});
