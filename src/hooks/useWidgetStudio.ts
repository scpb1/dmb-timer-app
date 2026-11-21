import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { CONFIG_KEYS } from '@/types/config';
import {
  DEFAULT_WIDGET_STUDIO,
  type WidgetFamily,
  type WidgetHolidayAppearance,
  type WidgetStatsAppearance,
  type WidgetStudioSettings,
  type WidgetTimerAppearance,
} from '@/types/widgets';
import { getConfig, setConfig } from '@/services/database';
import { persistWidgetBackground, removeWidgetBackground } from '@/utils/widgetBackground';
import { logger } from '@/utils/logger';
import {
  parseWidgetStudioSettings,
  serializeWidgetStudioSettings,
} from '@/utils/widgetStudio';
import { refreshHomeWidgets } from '@/utils/timerWidget';

let refreshHandle: ReturnType<typeof setTimeout> | null = null;
let studioWriteChain: Promise<void> = Promise.resolve();

function enqueueStudioWrite(work: () => Promise<void>): Promise<void> {
  const next = studioWriteChain.then(work, work);
  studioWriteChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function scheduleHomeWidgetRefresh() {
  if (refreshHandle) {
    clearTimeout(refreshHandle);
  }
  refreshHandle = setTimeout(() => {
    void refreshHomeWidgets();
  }, 450);
}

interface UseWidgetStudioResult {
  isLoading: boolean;
  settings: WidgetStudioSettings;
  setFamily: (family: WidgetFamily) => Promise<void>;
  updateSettings: (partial: Partial<WidgetStudioSettings>) => Promise<void>;
  updateTimer: (partial: Partial<WidgetTimerAppearance>) => Promise<void>;
  updateHoliday: (partial: Partial<WidgetHolidayAppearance>) => Promise<void>;
  updateStats: (partial: Partial<WidgetStatsAppearance>) => Promise<void>;
  pickBackground: (family: WidgetFamily) => Promise<void>;
  clearBackground: (family: WidgetFamily) => Promise<void>;
}

function appearanceUri(
  settings: WidgetStudioSettings,
  family: WidgetFamily,
): string | null {
  return settings[family].backgroundImageUri;
}

function withBackgroundUri(
  current: WidgetStudioSettings,
  family: WidgetFamily,
  uri: string | null,
): WidgetStudioSettings {
  if (family === 'timer') {
    return { ...current, timer: { ...current.timer, backgroundImageUri: uri } };
  }
  if (family === 'holiday') {
    return { ...current, holiday: { ...current.holiday, backgroundImageUri: uri } };
  }
  return { ...current, stats: { ...current.stats, backgroundImageUri: uri } };
}

export function useWidgetStudio(): UseWidgetStudioResult {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<WidgetStudioSettings>({
    ...DEFAULT_WIDGET_STUDIO,
    timer: { ...DEFAULT_WIDGET_STUDIO.timer },
    holiday: { ...DEFAULT_WIDGET_STUDIO.holiday },
    stats: { ...DEFAULT_WIDGET_STUDIO.stats },
  });
  const settingsRef = useRef(settings);
  const localRevisionRef = useRef(0);

  const persist = useCallback(async (patch: (current: WidgetStudioSettings) => WidgetStudioSettings) => {
    localRevisionRef.current += 1;
    const next = patch(settingsRef.current);
    settingsRef.current = next;
    setSettings(next);
    await enqueueStudioWrite(() =>
      setConfig(CONFIG_KEYS.WIDGET_STUDIO_DATA, serializeWidgetStudioSettings(next)),
    );
    scheduleHomeWidgetRefresh();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const raw = await getConfig(CONFIG_KEYS.WIDGET_STUDIO_DATA);
        if (!cancelled && localRevisionRef.current === 0) {
          const parsed = parseWidgetStudioSettings(raw);
          settingsRef.current = parsed;
          setSettings(parsed);
        }
      } catch (error) {
        logger.error('Не удалось прочитать настройки виджетов', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = useCallback(
    async (partial: Partial<WidgetStudioSettings>) => {
      await persist((current) => ({ ...current, ...partial }));
    },
    [persist],
  );

  const setFamily = useCallback(
    async (family: WidgetFamily) => {
      await persist((current) => ({ ...current, family }));
    },
    [persist],
  );

  const updateTimer = useCallback(
    async (partial: Partial<WidgetTimerAppearance>) => {
      await persist((current) => ({ ...current, timer: { ...current.timer, ...partial } }));
    },
    [persist],
  );

  const updateHoliday = useCallback(
    async (partial: Partial<WidgetHolidayAppearance>) => {
      await persist((current) => ({ ...current, holiday: { ...current.holiday, ...partial } }));
    },
    [persist],
  );

  const updateStats = useCallback(
    async (partial: Partial<WidgetStatsAppearance>) => {
      await persist((current) => ({ ...current, stats: { ...current.stats, ...partial } }));
    },
    [persist],
  );

  const pickBackground = useCallback(
    async (family: WidgetFamily) => {
      try {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Нет доступа', 'Разрешите доступ к галерее, чтобы выбрать фон виджета');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: false,
          quality: 0.85,
        });
        const sourceUri = !result.canceled ? result.assets[0]?.uri : null;
        if (!sourceUri) {
          return;
        }

        const savedUri = await persistWidgetBackground(sourceUri);
        const previous = appearanceUri(settingsRef.current, family);
        await persist((current) => withBackgroundUri(current, family, savedUri));
        try {
          await removeWidgetBackground(previous);
        } catch (error) {
          logger.error('Не удалось удалить прежний фон виджета', error);
        }
      } catch (error) {
        logger.error('Не удалось выбрать фон виджета', error);
        Alert.alert('Ошибка', 'Не получилось сохранить фото для виджета');
      }
    },
    [persist],
  );

  const clearBackground = useCallback(
    async (family: WidgetFamily) => {
      const previous = appearanceUri(settingsRef.current, family);
      await persist((current) => withBackgroundUri(current, family, null));
      await removeWidgetBackground(previous);
    },
    [persist],
  );

  return {
    isLoading,
    settings,
    setFamily,
    updateSettings,
    updateTimer,
    updateHoliday,
    updateStats,
    pickBackground,
    clearBackground,
  };
}
