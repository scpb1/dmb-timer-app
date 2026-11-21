import * as database from '@/services/database';
import { createUndoWindow } from '@/hooks/undoWindow';
import { createConfigJsonStore } from '@/services/configJsonStore';

jest.mock('@/services/database', () => {
  const config = new Map<string, string>();
  return {
    config,
    getConfig: async (key: string) => config.get(key) ?? null,
    setConfig: async (key: string, value: string) => {
      config.set(key, value);
    },
  };
});

const config = (database as unknown as { config: Map<string, string> }).config;

describe('окно отмены удаления', () => {
  beforeEach(() => {
    config.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('undo записывает прежний снимок обратно в config', async () => {
    const store = createConfigJsonStore<{ items: string[] }>({
      key: 'events',
      parse: (raw) => (raw ? (JSON.parse(raw) as { items: string[] }) : { items: [] }),
    });
    const snapshot = { items: ['a'] };
    await store.save(snapshot);
    await store.save({ items: [] });

    const window = createUndoWindow<{ items: string[] }>({
      onRestore: async (pending) => {
        await store.save(pending);
      },
    });
    window.arm(snapshot);
    await window.undo();

    expect(JSON.parse(config.get('events') ?? '')).toEqual(snapshot);
  });

  it('по таймеру вызывает commit и не восстанавливает снимок', async () => {
    const committed: string[] = [];
    const window = createUndoWindow<string>({
      timeoutMs: 5000,
      onCommit: (pending) => {
        committed.push(pending);
      },
      onRestore: () => {
        throw new Error('restore');
      },
    });
    window.arm('gone');
    jest.advanceTimersByTime(5000);
    await Promise.resolve();
    expect(committed).toEqual(['gone']);
    expect(window.pending).toBeNull();
  });
});
