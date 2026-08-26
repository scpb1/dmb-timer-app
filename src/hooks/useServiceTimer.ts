import { useCallback, useEffect, useState } from 'react';
import { parseISO } from 'date-fns';

import { CONFIG_KEYS } from '@/types/config';
import {
  DEFAULT_TIMER_SETTINGS,
  normalizeProgressBarMode,
  type ProgressBarMode,
  type StatCardMode,
  type TimerCenterDisplay,
  type TimerSettings,
  type TimerType,
} from '@/types/timer';
import { getConfig, setConfig } from '@/services/database';
import {
  calculateServiceProgress,
  getCenterDisplayValues,
  getTimeBreakdown,
  type CenterDisplayValues,
  type ServiceProgress,
  type TimeBreakdown,
} from '@/utils/timerCalculations';
import { logger } from '@/utils/logger';

interface ServiceTimerState {
  isLoading: boolean;
  enlistmentDate: Date | null;
  demobilizationDate: Date | null;
  settings: TimerSettings;
  progress: ServiceProgress | null;
  centerDisplay: CenterDisplayValues | null;
  passedBreakdown: TimeBreakdown | null;
  remainingBreakdown: TimeBreakdown | null;
}

interface UseServiceTimerResult extends ServiceTimerState {
  updateSettings: (partial: Partial<TimerSettings>) => Promise<void>;
  reload: () => Promise<void>;
}

function parseTimerSettings(
  timerType: string | null,
  progressBarMode: string | null,
  decimalPlaces: string | null,
  centerDisplay: string | null,
  statCardMode: string | null,
): TimerSettings {
  const validModes: ProgressBarMode[] = ['percent', 'days', 'weeks', 'months'];
  const validStatCardModes: StatCardMode[] = ['days', 'weeks', 'months'];
  const validTypes: TimerType[] = ['circular', 'linear'];
  const validCenterDisplays: TimerCenterDisplay[] = ['remaining', 'elapsed'];

  const mode =
    progressBarMode && validModes.includes(progressBarMode as ProgressBarMode)
      ? (progressBarMode as ProgressBarMode)
      : DEFAULT_TIMER_SETTINGS.progressBarMode;

  const cardMode =
    statCardMode && validStatCardModes.includes(statCardMode as StatCardMode)
      ? (statCardMode as StatCardMode)
      : DEFAULT_TIMER_SETTINGS.statCardMode;

  const type =
    timerType && validTypes.includes(timerType as TimerType)
      ? (timerType as TimerType)
      : DEFAULT_TIMER_SETTINGS.timerType;

  const normalizedMode = normalizeProgressBarMode(type, mode);

  const parsedDecimals = decimalPlaces ? Number(decimalPlaces) : NaN;
  const percentDecimalPlaces =
    Number.isFinite(parsedDecimals) && parsedDecimals >= 0 && parsedDecimals <= 6
      ? parsedDecimals
      : DEFAULT_TIMER_SETTINGS.percentDecimalPlaces;

  const display =
    centerDisplay && validCenterDisplays.includes(centerDisplay as TimerCenterDisplay)
      ? (centerDisplay as TimerCenterDisplay)
      : DEFAULT_TIMER_SETTINGS.centerDisplay;

  return {
    timerType: type,
    progressBarMode: normalizedMode,
    percentDecimalPlaces,
    centerDisplay: display,
    statCardMode: cardMode,
  };
}

async function loadTimerSettings(): Promise<TimerSettings> {
  const [timerType, progressBarMode, decimalPlaces, centerDisplay, statCardMode] =
    await Promise.all([
      getConfig(CONFIG_KEYS.TIMER_TYPE),
      getConfig(CONFIG_KEYS.PROGRESS_BAR_MODE),
      getConfig(CONFIG_KEYS.PERCENT_DECIMAL_PLACES),
      getConfig(CONFIG_KEYS.TIMER_CENTER_DISPLAY),
      getConfig(CONFIG_KEYS.STAT_CARD_MODE),
    ]);

  return parseTimerSettings(
    timerType,
    progressBarMode,
    decimalPlaces,
    centerDisplay,
    statCardMode,
  );
}

function computeTimerState(
  enlistmentDate: Date,
  demobilizationDate: Date,
  settings: TimerSettings,
  now: Date,
): Pick<
  ServiceTimerState,
  'progress' | 'centerDisplay' | 'passedBreakdown' | 'remainingBreakdown'
> {
  const progress = calculateServiceProgress(enlistmentDate, demobilizationDate, now);
  const centerDisplay = getCenterDisplayValues(
    settings.progressBarMode,
    progress,
    settings.percentDecimalPlaces,
    settings.centerDisplay,
  );

  return {
    progress,
    centerDisplay,
    passedBreakdown: getTimeBreakdown(enlistmentDate, now),
    remainingBreakdown: getTimeBreakdown(now, demobilizationDate),
  };
}

/** Загружает даты службы, настройки таймера и пересчитывает прогресс каждую секунду */
export function useServiceTimer(): UseServiceTimerResult {
  const [state, setState] = useState<ServiceTimerState>({
    isLoading: true,
    enlistmentDate: null,
    demobilizationDate: null,
    settings: DEFAULT_TIMER_SETTINGS,
    progress: null,
    centerDisplay: null,
    passedBreakdown: null,
    remainingBreakdown: null,
  });

  const reload = useCallback(async () => {
    try {
      const [enlistmentRaw, demobilizationRaw, settings] = await Promise.all([
        getConfig(CONFIG_KEYS.ENLISTMENT_DATE),
        getConfig(CONFIG_KEYS.DEMOBILIZATION_DATE),
        loadTimerSettings(),
      ]);

      if (!enlistmentRaw || !demobilizationRaw) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          enlistmentDate: null,
          demobilizationDate: null,
          settings,
          progress: null,
          centerDisplay: null,
          passedBreakdown: null,
          remainingBreakdown: null,
        }));
        return;
      }

      const enlistmentDate = parseISO(enlistmentRaw);
      const demobilizationDate = parseISO(demobilizationRaw);
      const now = new Date();
      const computed = computeTimerState(enlistmentDate, demobilizationDate, settings, now);

      setState({
        isLoading: false,
        enlistmentDate,
        demobilizationDate,
        settings,
        ...computed,
      });
    } catch (error) {
      logger.error('Ошибка загрузки данных таймера', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!state.enlistmentDate || !state.demobilizationDate) {
      return;
    }

    const tick = () => {
      const now = new Date();
      const computed = computeTimerState(
        state.enlistmentDate!,
        state.demobilizationDate!,
        state.settings,
        now,
      );

      setState((prev) => ({
        ...prev,
        ...computed,
      }));
    };

    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [state.enlistmentDate, state.demobilizationDate, state.settings]);

  const updateSettings = useCallback(async (partial: Partial<TimerSettings>) => {
    const merged: TimerSettings = {
      ...DEFAULT_TIMER_SETTINGS,
      ...state.settings,
      ...partial,
    };

    const nextSettings: TimerSettings = {
      ...merged,
      progressBarMode: normalizeProgressBarMode(
        merged.timerType,
        merged.progressBarMode,
      ),
    };

    await Promise.all([
      setConfig(CONFIG_KEYS.TIMER_TYPE, nextSettings.timerType),
      setConfig(CONFIG_KEYS.PROGRESS_BAR_MODE, nextSettings.progressBarMode),
      setConfig(CONFIG_KEYS.PERCENT_DECIMAL_PLACES, String(nextSettings.percentDecimalPlaces)),
      setConfig(CONFIG_KEYS.TIMER_CENTER_DISPLAY, nextSettings.centerDisplay),
      setConfig(CONFIG_KEYS.STAT_CARD_MODE, nextSettings.statCardMode),
    ]);

    setState((prev) => {
      if (!prev.enlistmentDate || !prev.demobilizationDate) {
        return { ...prev, settings: nextSettings };
      }

      const computed = computeTimerState(
        prev.enlistmentDate,
        prev.demobilizationDate,
        nextSettings,
        new Date(),
      );

      return {
        ...prev,
        settings: nextSettings,
        ...computed,
      };
    });
  }, [state.settings]);

  return {
    ...state,
    updateSettings,
    reload,
  };
}
