import { getConfig, setConfig } from '@/services/database';
import { registerMemoryCacheReset } from '@/services/memoryCaches';

export interface ConfigJsonValidation<T> {
  value: T;
  changed: boolean;
}

interface ConfigJsonStoreOptions<TStored, TDisplay> {
  key: string;
  parse: (raw: string | null) => TStored;
  /** Миграция и проверка снимка. `changed` пишет результат обратно. */
  validate?: (stored: TStored) => Promise<ConfigJsonValidation<TStored>> | ConfigJsonValidation<TStored>;
  toDisplay?: (stored: TStored) => Promise<TDisplay> | TDisplay;
  afterPersist?: (stored: TStored) => void | Promise<void>;
  /** Не парсить повторно, пока строка в config не изменилась. */
  remember?: boolean;
  serialize?: (stored: TStored) => string;
}

export interface ConfigJsonLoadResult<TStored, TDisplay> {
  stored: TStored;
  display: TDisplay;
  raw: string | null;
}

/** Чтение и запись одного JSON-значения в таблице config. */
export function createConfigJsonStore<TStored, TDisplay = TStored>(
  options: ConfigJsonStoreOptions<TStored, TDisplay>,
) {
  const encode = (stored: TStored) => options.serialize?.(stored) ?? JSON.stringify(stored);
  let memory: { raw: string | null; stored: TStored } | null = null;
  let currentRaw: string | null | undefined;

  registerMemoryCacheReset(() => {
    memory = null;
    currentRaw = undefined;
  });

  const toDisplay = async (stored: TStored): Promise<TDisplay> => {
    if (!options.toDisplay) {
      return stored as unknown as TDisplay;
    }
    return options.toDisplay(stored);
  };

  const write = async (stored: TStored): Promise<string> => {
    const raw = encode(stored);
    await setConfig(options.key, raw);
    memory = { raw, stored };
    currentRaw = raw;
    await options.afterPersist?.(stored);
    return raw;
  };

  return {
    currentRaw(): string | null | undefined {
      return currentRaw;
    },
    async load(): Promise<ConfigJsonLoadResult<TStored, TDisplay>> {
      if (options.remember && memory) {
        currentRaw = memory.raw;
        return {
          stored: memory.stored,
          display: await toDisplay(memory.stored),
          raw: memory.raw,
        };
      }

      const loadedRaw = await getConfig(options.key);
      let stored = options.parse(loadedRaw);
      let raw = loadedRaw;
      if (options.validate) {
        const validated = await options.validate(stored);
        stored = validated.value;
        if (validated.changed) {
          raw = await write(stored);
        }
      }
      if (options.remember) {
        memory = { raw, stored };
      }
      currentRaw = raw;
      return { stored, display: await toDisplay(stored), raw };
    },
    async save(stored: TStored): Promise<TDisplay> {
      await write(stored);
      return toDisplay(stored);
    },
  };
}
