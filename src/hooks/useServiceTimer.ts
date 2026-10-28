import { useCallback, useEffect, useState } from 'react';
import { parseISO, startOfDay } from 'date-fns';
import * as Crypto from 'expo-crypto';

import { CONFIG_KEYS } from '@/types/config';
import {
  DEFAULT_CUSTOM_TIMERS_STORAGE,
  DEFAULT_TIMER_SETTINGS,
  SERVICE_TIMER_ID,
  normalizeProgressBarMode,
  type ActiveTimer,
  type CustomTimerRecord,
  type CustomTimersStorage,
  type ProgressBarMode,
  type StatCardMode,
  type TimerCenterDisplay,
  type TimerSettings,
  type TimerType,
  type TimerUpcomingPreviewMode,
} from '@/types/timer';
import { getConfig, setConfig } from '@/services/database';
import {
  clampBackgroundDim,
  DEFAULT_BACKGROUND_DIM,
  setTimerPhotoBackgroundActive,
} from '@/utils/timerBackground';
import {
  calculateServiceProgress,
  getCenterDisplayLabels,
  getCenterDisplayValues,
  getServiceTimeBreakdowns,
  type CenterDisplayValues,
  type ServiceProgress,
  type TimeBreakdown,
} from '@/utils/timerCalculations';
import { logger } from '@/utils/logger';
import { updateTimerWidgets } from '@/utils/timerWidget';

function serviceTimerNameFrom(partnerName: string): string {
  const trimmed = partnerName.trim();
  return trimmed || 'Служба';
}

interface ServiceTimerState {
  isLoading: boolean;
  partnerName: string;
  enlistmentDate: Date | null;
  demobilizationDate: Date | null;
  customTimers: CustomTimerRecord[];
  activeTimer: ActiveTimer | null;
  settings: TimerSettings;
  progress: ServiceProgress | null;
  centerDisplay: CenterDisplayValues | null;
  passedBreakdown: TimeBreakdown | null;
  remainingBreakdown: TimeBreakdown | null;
}

export interface CustomTimerInput {
  name: string;
  startDate: Date;
  endDate: Date;
}

interface UseServiceTimerResult extends ServiceTimerState {
  updateSettings: (partial: Partial<TimerSettings>) => Promise<void>;
  setActiveTimerId: (id: string) => Promise<void>;
  addCustomTimer: (input: CustomTimerInput) => Promise<boolean>;
  updateCustomTimer: (id: string, input: CustomTimerInput) => Promise<boolean>;
  deleteCustomTimer: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

function parseBoolConfig(value: string | null, defaultValue: boolean): boolean {
  if (value == null || value === '') {
    return defaultValue;
  }
  if (value === '0' || value === 'false') {
    return false;
  }
  if (value === '1' || value === 'true') {
    return true;
  }
  return defaultValue;
}

function parseTimerSettings(
  timerType: string | null,
  progressBarMode: string | null,
  decimalPlaces: string | null,
  centerDisplay: string | null,
  statCardMode: string | null,
  backgroundImageUri: string | null,
  backgroundDim: string | null,
  timerUpcomingPreview: string | null,
  timerUpcomingPinnedRef: string | null,
  photoStatCardBorder: string | null,
  photoUpcomingCardBorder: string | null,
  dotGridCellShape: string | null,
  milestonesLayout: string | null,
): TimerSettings {
  const validModes: ProgressBarMode[] = ['percent', 'days', 'weeks', 'months'];
  const validStatCardModes: StatCardMode[] = ['days', 'weeks', 'months'];
  const validTypes: TimerType[] = ['circular', 'linear', 'frame', 'dotGrid', 'milestones'];
  const validDotGridShapes = ['circle', 'heart'] as const;
  const validMilestonesLayouts = ['spine', 'chips', 'checklist'] as const;
  const validCenterDisplays: TimerCenterDisplay[] = ['remaining', 'elapsed'];
  const validUpcomingModes: TimerUpcomingPreviewMode[] = ['off', 'nearest', 'pinned'];
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

  const parsedDecimals =
    decimalPlaces == null || decimalPlaces === '' ? NaN : Number(decimalPlaces);
  const percentDecimalPlaces =
    Number.isFinite(parsedDecimals) && parsedDecimals >= 0 && parsedDecimals <= 6
      ? parsedDecimals
      : DEFAULT_TIMER_SETTINGS.percentDecimalPlaces;

  const display =
    centerDisplay && validCenterDisplays.includes(centerDisplay as TimerCenterDisplay)
      ? (centerDisplay as TimerCenterDisplay)
      : DEFAULT_TIMER_SETTINGS.centerDisplay;

  const upcomingPreview =
    timerUpcomingPreview &&
    validUpcomingModes.includes(timerUpcomingPreview as TimerUpcomingPreviewMode)
      ? (timerUpcomingPreview as TimerUpcomingPreviewMode)
      : DEFAULT_TIMER_SETTINGS.timerUpcomingPreview;

  const pinnedRef = timerUpcomingPinnedRef?.trim() || null;

  return {
    timerType: type,
    progressBarMode: normalizedMode,
    percentDecimalPlaces,
    centerDisplay: display,
    statCardMode: cardMode,
    backgroundImageUri: backgroundImageUri || null,
    backgroundDim:
      backgroundDim == null || backgroundDim === ''
        ? DEFAULT_BACKGROUND_DIM
        : clampBackgroundDim(Number(backgroundDim)),
    timerUpcomingPreview: upcomingPreview,
    timerUpcomingPinnedRef: pinnedRef,
    photoStatCardBorder: parseBoolConfig(
      photoStatCardBorder,
      DEFAULT_TIMER_SETTINGS.photoStatCardBorder,
    ),
    photoUpcomingCardBorder: parseBoolConfig(
      photoUpcomingCardBorder,
      DEFAULT_TIMER_SETTINGS.photoUpcomingCardBorder,
    ),
    dotGridCellShape:
      dotGridCellShape &&
      validDotGridShapes.includes(dotGridCellShape as (typeof validDotGridShapes)[number])
        ? (dotGridCellShape as TimerSettings['dotGridCellShape'])
        : DEFAULT_TIMER_SETTINGS.dotGridCellShape,
    milestonesLayout:
      milestonesLayout &&
      validMilestonesLayouts.includes(milestonesLayout as (typeof validMilestonesLayouts)[number])
        ? (milestonesLayout as TimerSettings['milestonesLayout'])
        : DEFAULT_TIMER_SETTINGS.milestonesLayout,
  };
}

function parseCustomTimers(raw: string | null): CustomTimerRecord[] {
  if (!raw) {
    return DEFAULT_CUSTOM_TIMERS_STORAGE.timers;
  }

  try {
    const parsed = JSON.parse(raw) as CustomTimersStorage;
    if (!Array.isArray(parsed?.timers)) {
      return [];
    }

    return parsed.timers.filter(
      (timer): timer is CustomTimerRecord =>
        Boolean(timer?.id && timer.name && timer.startDate && timer.endDate),
    );
  } catch {
    return [];
  }
}

function toActiveTimer(
  id: string | null,
  enlistmentDate: Date | null,
  demobilizationDate: Date | null,
  customTimers: CustomTimerRecord[],
  partnerName: string,
): ActiveTimer | null {
  if (id && id !== SERVICE_TIMER_ID) {
    const custom = customTimers.find((timer) => timer.id === id);
    if (custom) {
      return {
        id: custom.id,
        name: custom.name,
        startDate: parseISO(custom.startDate),
        endDate: parseISO(custom.endDate),
        kind: 'custom',
      };
    }
  }

  if (enlistmentDate && demobilizationDate) {
    return {
      id: SERVICE_TIMER_ID,
      name: serviceTimerNameFrom(partnerName),
      startDate: enlistmentDate,
      endDate: demobilizationDate,
      kind: 'service',
    };
  }

  return null;
}

async function loadTimerSettings(): Promise<TimerSettings> {
  const [
    timerType,
    progressBarMode,
    decimalPlaces,
    centerDisplay,
    statCardMode,
    backgroundImageUri,
    backgroundDim,
    timerUpcomingPreview,
    timerUpcomingPinnedRef,
    photoStatCardBorder,
    photoUpcomingCardBorder,
    dotGridCellShape,
    milestonesLayout,
  ] = await Promise.all([
    getConfig(CONFIG_KEYS.TIMER_TYPE),
    getConfig(CONFIG_KEYS.PROGRESS_BAR_MODE),
    getConfig(CONFIG_KEYS.PERCENT_DECIMAL_PLACES),
    getConfig(CONFIG_KEYS.TIMER_CENTER_DISPLAY),
    getConfig(CONFIG_KEYS.STAT_CARD_MODE),
    getConfig(CONFIG_KEYS.TIMER_BACKGROUND_IMAGE),
    getConfig(CONFIG_KEYS.TIMER_BACKGROUND_DIM),
    getConfig(CONFIG_KEYS.TIMER_UPCOMING_PREVIEW),
    getConfig(CONFIG_KEYS.TIMER_UPCOMING_PINNED_REF),
    getConfig(CONFIG_KEYS.TIMER_PHOTO_STAT_BORDER),
    getConfig(CONFIG_KEYS.TIMER_PHOTO_UPCOMING_BORDER),
    getConfig(CONFIG_KEYS.DOT_GRID_CELL_SHAPE),
    getConfig(CONFIG_KEYS.MILESTONES_LAYOUT),
  ]);

  return parseTimerSettings(
    timerType,
    progressBarMode,
    decimalPlaces,
    centerDisplay,
    statCardMode,
    backgroundImageUri,
    backgroundDim,
    timerUpcomingPreview,
    timerUpcomingPinnedRef,
    photoStatCardBorder,
    photoUpcomingCardBorder,
    dotGridCellShape,
    milestonesLayout,
  );
}

function computeTimerState(
  activeTimer: ActiveTimer,
  settings: TimerSettings,
  now: Date,
): Pick<
  ServiceTimerState,
  'progress' | 'centerDisplay' | 'passedBreakdown' | 'remainingBreakdown'
> {
  const progress = calculateServiceProgress(activeTimer.startDate, activeTimer.endDate, now);
  const labels = getCenterDisplayLabels(activeTimer.kind);
  const centerDisplay = getCenterDisplayValues(
    settings.progressBarMode,
    progress,
    settings.percentDecimalPlaces,
    settings.centerDisplay,
    labels,
  );
  const { passed, remaining } = getServiceTimeBreakdowns(
    activeTimer.startDate,
    activeTimer.endDate,
    now,
  );

  return {
    progress,
    centerDisplay,
    passedBreakdown: passed,
    remainingBreakdown: remaining,
  };
}

function persistWidget(activeTimer: ActiveTimer | null, progress: ServiceProgress | null) {
  void updateTimerWidgets(activeTimer, progress);
}

/** Загружает даты, доп. таймеры и пересчитывает прогресс каждую секунду */
export function useServiceTimer(): UseServiceTimerResult {
  const [state, setState] = useState<ServiceTimerState>({
    isLoading: true,
    partnerName: '',
    enlistmentDate: null,
    demobilizationDate: null,
    customTimers: [],
    activeTimer: null,
    settings: DEFAULT_TIMER_SETTINGS,
    progress: null,
    centerDisplay: null,
    passedBreakdown: null,
    remainingBreakdown: null,
  });

  const reload = useCallback(async () => {
    try {
      const [enlistmentRaw, demobilizationRaw, customRaw, activeId, partnerName, settings] =
        await Promise.all([
        getConfig(CONFIG_KEYS.ENLISTMENT_DATE),
        getConfig(CONFIG_KEYS.DEMOBILIZATION_DATE),
        getConfig(CONFIG_KEYS.CUSTOM_TIMERS_DATA),
        getConfig(CONFIG_KEYS.ACTIVE_TIMER_ID),
        getConfig(CONFIG_KEYS.PARTNER_NAME),
        loadTimerSettings(),
      ]);

      const enlistmentDate = enlistmentRaw ? parseISO(enlistmentRaw) : null;
      const demobilizationDate = demobilizationRaw ? parseISO(demobilizationRaw) : null;
      const customTimers = parseCustomTimers(customRaw);
      const resolvedPartnerName = partnerName ?? '';
      const activeTimer = toActiveTimer(
        activeId,
        enlistmentDate,
        demobilizationDate,
        customTimers,
        resolvedPartnerName,
      );

      if (!activeTimer) {
        setTimerPhotoBackgroundActive(Boolean(settings.backgroundImageUri));
        setState((prev) => ({
          ...prev,
          isLoading: false,
          partnerName: resolvedPartnerName,
          enlistmentDate,
          demobilizationDate,
          customTimers,
          activeTimer: null,
          settings,
          progress: null,
          centerDisplay: null,
          passedBreakdown: null,
          remainingBreakdown: null,
        }));
        persistWidget(null, null);
        return;
      }

      const now = new Date();
      const computed = computeTimerState(activeTimer, settings, now);

      setTimerPhotoBackgroundActive(Boolean(settings.backgroundImageUri));
      setState({
        isLoading: false,
        partnerName: resolvedPartnerName,
        enlistmentDate,
        demobilizationDate,
        customTimers,
        activeTimer,
        settings,
        ...computed,
      });
      persistWidget(activeTimer, computed.progress);
    } catch (error) {
      logger.error('Ошибка загрузки данных таймера', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setState((prev) => {
        if (!prev.activeTimer) {
          return prev;
        }

        const computed = computeTimerState(prev.activeTimer, prev.settings, new Date());
        persistWidget(prev.activeTimer, computed.progress);
        return {
          ...prev,
          ...computed,
        };
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const updateSettings = useCallback(
    async (partial: Partial<TimerSettings>) => {
      const merged: TimerSettings = {
        ...DEFAULT_TIMER_SETTINGS,
        ...state.settings,
        ...partial,
      };

      const nextSettings: TimerSettings = {
        ...merged,
        progressBarMode: normalizeProgressBarMode(merged.timerType, merged.progressBarMode),
        backgroundDim: clampBackgroundDim(merged.backgroundDim),
      };

      await Promise.all([
        setConfig(CONFIG_KEYS.TIMER_TYPE, nextSettings.timerType),
        setConfig(CONFIG_KEYS.PROGRESS_BAR_MODE, nextSettings.progressBarMode),
        setConfig(CONFIG_KEYS.PERCENT_DECIMAL_PLACES, String(nextSettings.percentDecimalPlaces)),
        setConfig(CONFIG_KEYS.TIMER_CENTER_DISPLAY, nextSettings.centerDisplay),
        setConfig(CONFIG_KEYS.STAT_CARD_MODE, nextSettings.statCardMode),
        setConfig(CONFIG_KEYS.TIMER_BACKGROUND_DIM, String(nextSettings.backgroundDim)),
        setConfig(CONFIG_KEYS.TIMER_UPCOMING_PREVIEW, nextSettings.timerUpcomingPreview),
        setConfig(
          CONFIG_KEYS.TIMER_UPCOMING_PINNED_REF,
          nextSettings.timerUpcomingPinnedRef ?? '',
        ),
        setConfig(
          CONFIG_KEYS.TIMER_PHOTO_STAT_BORDER,
          nextSettings.photoStatCardBorder ? '1' : '0',
        ),
        setConfig(
          CONFIG_KEYS.TIMER_PHOTO_UPCOMING_BORDER,
          nextSettings.photoUpcomingCardBorder ? '1' : '0',
        ),
        setConfig(CONFIG_KEYS.DOT_GRID_CELL_SHAPE, nextSettings.dotGridCellShape),
        setConfig(CONFIG_KEYS.MILESTONES_LAYOUT, nextSettings.milestonesLayout),
      ]);
      await setConfig(
        CONFIG_KEYS.TIMER_BACKGROUND_IMAGE,
        nextSettings.backgroundImageUri ?? '',
      );
      setTimerPhotoBackgroundActive(Boolean(nextSettings.backgroundImageUri));

      setState((prev) => {
        if (!prev.activeTimer) {
          return { ...prev, settings: nextSettings };
        }

        const computed = computeTimerState(prev.activeTimer, nextSettings, new Date());
        persistWidget(prev.activeTimer, computed.progress);

        return {
          ...prev,
          settings: nextSettings,
          ...computed,
        };
      });
    },
    [state.settings],
  );

  const persistCustomTimers = useCallback(async (timers: CustomTimerRecord[]) => {
    await setConfig(CONFIG_KEYS.CUSTOM_TIMERS_DATA, JSON.stringify({ timers }));
  }, []);

  const setActiveTimerId = useCallback(async (id: string) => {
    setState((prev) => {
      const activeTimer = toActiveTimer(
        id,
        prev.enlistmentDate,
        prev.demobilizationDate,
        prev.customTimers,
        prev.partnerName,
      );
      if (!activeTimer) {
        persistWidget(null, null);
        return {
          ...prev,
          activeTimer: null,
          progress: null,
          centerDisplay: null,
          passedBreakdown: null,
          remainingBreakdown: null,
        };
      }
      const computed = computeTimerState(activeTimer, prev.settings, new Date());
      persistWidget(activeTimer, computed.progress);
      return { ...prev, activeTimer, ...computed };
    });
    await setConfig(CONFIG_KEYS.ACTIVE_TIMER_ID, id);
  }, []);

  const addCustomTimer = useCallback(
    async (input: CustomTimerInput): Promise<boolean> => {
      const name = input.name.trim();
      if (!name || startOfDay(input.endDate) <= startOfDay(input.startDate)) {
        return false;
      }

      const record: CustomTimerRecord = {
        id: Crypto.randomUUID(),
        name,
        startDate: startOfDay(input.startDate).toISOString(),
        endDate: startOfDay(input.endDate).toISOString(),
      };

      const nextTimers = [...state.customTimers, record];
      await persistCustomTimers(nextTimers);
      await setConfig(CONFIG_KEYS.ACTIVE_TIMER_ID, record.id);

      setState((prev) => {
        const activeTimer = toActiveTimer(
          record.id,
          prev.enlistmentDate,
          prev.demobilizationDate,
          nextTimers,
          prev.partnerName,
        );
        if (!activeTimer) {
          return { ...prev, customTimers: nextTimers };
        }
        const computed = computeTimerState(activeTimer, prev.settings, new Date());
        persistWidget(activeTimer, computed.progress);
        return { ...prev, customTimers: nextTimers, activeTimer, ...computed };
      });

      return true;
    },
    [persistCustomTimers, state.customTimers],
  );

  const updateCustomTimer = useCallback(
    async (id: string, input: CustomTimerInput): Promise<boolean> => {
      const name = input.name.trim();
      if (!name || startOfDay(input.endDate) <= startOfDay(input.startDate)) {
        return false;
      }

      const nextTimers = state.customTimers.map((timer) =>
        timer.id === id
          ? {
              ...timer,
              name,
              startDate: startOfDay(input.startDate).toISOString(),
              endDate: startOfDay(input.endDate).toISOString(),
            }
          : timer,
      );

      await persistCustomTimers(nextTimers);
      setState((prev) => {
        const activeId = prev.activeTimer?.id ?? SERVICE_TIMER_ID;
        const activeTimer = toActiveTimer(
          activeId,
          prev.enlistmentDate,
          prev.demobilizationDate,
          nextTimers,
          prev.partnerName,
        );
        if (!activeTimer) {
          return { ...prev, customTimers: nextTimers };
        }
        const computed = computeTimerState(activeTimer, prev.settings, new Date());
        persistWidget(activeTimer, computed.progress);
        return { ...prev, customTimers: nextTimers, activeTimer, ...computed };
      });

      return true;
    },
    [persistCustomTimers, state.customTimers],
  );

  const deleteCustomTimer = useCallback(
    async (id: string) => {
      const nextTimers = state.customTimers.filter((timer) => timer.id !== id);
      await persistCustomTimers(nextTimers);

      setState((prev) => {
        const nextActiveId = prev.activeTimer?.id === id ? SERVICE_TIMER_ID : prev.activeTimer?.id;
        if (nextActiveId) {
          void setConfig(CONFIG_KEYS.ACTIVE_TIMER_ID, nextActiveId);
        }
        const activeTimer = toActiveTimer(
          nextActiveId ?? SERVICE_TIMER_ID,
          prev.enlistmentDate,
          prev.demobilizationDate,
          nextTimers,
          prev.partnerName,
        );
        if (!activeTimer) {
          persistWidget(null, null);
          return {
            ...prev,
            customTimers: nextTimers,
            activeTimer: null,
            progress: null,
            centerDisplay: null,
            passedBreakdown: null,
            remainingBreakdown: null,
          };
        }
        const computed = computeTimerState(activeTimer, prev.settings, new Date());
        persistWidget(activeTimer, computed.progress);
        return { ...prev, customTimers: nextTimers, activeTimer, ...computed };
      });
    },
    [persistCustomTimers, state.customTimers],
  );

  return {
    ...state,
    updateSettings,
    setActiveTimerId,
    addCustomTimer,
    updateCustomTimer,
    deleteCustomTimer,
    reload,
  };
}
