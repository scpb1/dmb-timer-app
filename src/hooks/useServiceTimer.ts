import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Crypto from 'expo-crypto';

import { CONFIG_KEYS } from '@/types/config';
import {
  DEFAULT_TIMER_SETTINGS,
  SERVICE_TIMER_ID,
  normalizeProgressBarMode,
  type ActiveTimer,
  type CustomTimerRecord,
  type TimerSettings,
} from '@/types/timer';
import { getConfigs, setConfig } from '@/services/database';
import { registerMemoryCacheReset } from '@/services/memoryCaches';
import {
  isTimerSnapshotFresh,
  markTimerSnapshotFresh,
  TIMER_SNAPSHOT_KEYS,
  timerSnapshotEpoch,
} from '@/services/timerSnapshot';
import {
  customTimerRecordFromInput,
  persistCustomTimers,
  type CustomTimerInput,
} from '@/services/customTimersRepository';
import {
  clearTimerSettingsCache,
  getCachedTimerSettings,
  persistTimerSettingsDiff,
  rememberTimerSettings,
  timerSettingsFromConfig,
} from '@/services/timerSettingsRepository';
import { parseStoredDate } from '@/utils/storedDate';
import { rescheduleAppNotifications } from '@/services/holidayNotifications';
import { clampBackgroundFocus } from '@/utils/coverImageFrame';
import { clampBackgroundDim, setTimerPhotoBackgroundActive } from '@/utils/timerBackground';
import {
  calculateServiceProgress,
  getCenterDisplayLabels,
  getCenterDisplayValues,
  getServiceTimeBreakdowns,
  type CenterDisplayValues,
  type ServiceProgress,
  type TimeBreakdown,
} from '@/utils/timerCalculations';
import {
  parseCustomTimersStorage,
  pruneNotificationDisabledIds,
  resolveActiveTimer,
  withTimerNotificationEnabled,
} from '@/utils/timerRecords';
import { logger } from '@/utils/logger';
import { updateTimerWidgets } from '@/utils/timerWidget';

export { clearTimerSettingsCache };
export type { CustomTimerInput };

interface ServiceTimerState {
  isLoading: boolean;
  partnerName: string;
  enlistmentDate: Date | null;
  demobilizationDate: Date | null;
  customTimers: CustomTimerRecord[];
  notificationDisabledIds: string[];
  activeTimer: ActiveTimer | null;
  settings: TimerSettings;
  progress: ServiceProgress | null;
  centerDisplay: CenterDisplayValues | null;
  passedBreakdown: TimeBreakdown | null;
  remainingBreakdown: TimeBreakdown | null;
}

interface UseServiceTimerResult extends ServiceTimerState {
  updateSettings: (partial: Partial<TimerSettings>) => Promise<void>;
  setActiveTimerId: (id: string) => Promise<void>;
  setTimerNotificationsEnabled: (id: string, enabled: boolean) => Promise<void>;
  addCustomTimer: (input: CustomTimerInput) => Promise<boolean>;
  updateCustomTimer: (id: string, input: CustomTimerInput) => Promise<boolean>;
  deleteCustomTimer: (id: string) => Promise<void>;
  reload: () => Promise<void>;
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

export interface PublishedTimerView {
  activeTimerId: string;
  at: number;
  progress: ServiceProgress;
  centerDisplay: CenterDisplayValues;
  passedBreakdown: TimeBreakdown;
  remainingBreakdown: TimeBreakdown;
}

let publishedTimerView: PublishedTimerView | null = null;

export function readPublishedTimerView(): PublishedTimerView | null {
  return publishedTimerView;
}

export function computeActiveTimerView(
  activeTimer: ActiveTimer,
  settings: TimerSettings,
  now: Date,
): ReturnType<typeof computeTimerState> {
  return computeTimerState(activeTimer, settings, now);
}

function publishTimerView(
  activeTimerId: string,
  computed: ReturnType<typeof computeTimerState>,
): void {
  if (
    !computed.progress ||
    !computed.centerDisplay ||
    !computed.passedBreakdown ||
    !computed.remainingBreakdown
  ) {
    return;
  }
  publishedTimerView = {
    activeTimerId,
    at: Date.now(),
    progress: computed.progress,
    centerDisplay: computed.centerDisplay,
    passedBreakdown: computed.passedBreakdown,
    remainingBreakdown: computed.remainingBreakdown,
  };
}

/** Подписи и календарные числа. Секунды в разбивке сюда не входят: их рисует отдельная плашка. */
function timerViewSignature(
  settings: TimerSettings,
  computed: ReturnType<typeof computeTimerState>,
): string {
  const mode = settings.progressBarMode;
  const progress = computed.progress;
  const center = computed.centerDisplay;
  const passed = computed.passedBreakdown;
  const remaining = computed.remainingBreakdown;
  if (!progress || !center || !passed || !remaining) {
    return '';
  }
  return [
    settings.timerType,
    mode,
    settings.centerDisplay,
    settings.percentDecimalPlaces,
    settings.statCardMode,
    progress.phase,
    progress.totalDays,
    progress.daysPassed,
    progress.daysLeft,
    progress.daysUntilStart,
    progress.daysAfterEnd,
    progress.filledSegments[mode],
    progress.segmentCounts[mode],
    progress.weeksPassed,
    progress.weeksLeft,
    progress.monthsPassed,
    progress.monthsLeft,
    progress.monthDaysPassed,
    progress.monthDaysLeft,
    center.primaryValue,
    center.secondaryValue ?? '',
    center.unitLabel,
    passed.days,
    passed.hours,
    passed.minutes,
    remaining.days,
    remaining.hours,
    remaining.minutes,
  ].join('|');
}

interface StoredTimerSnapshot {
  id: number;
  enlistmentRaw: string | null;
  demobilizationRaw: string | null;
  customRaw: string | null;
  activeId: string | null;
  partnerName: string | null;
  settings: TimerSettings;
}

let storedTimerSnapshot: StoredTimerSnapshot | null = null;
let storedTimerRead: Promise<StoredTimerSnapshot> | null = null;
let storedTimerSerial = 0;

registerMemoryCacheReset(() => {
  storedTimerSnapshot = null;
  publishedTimerView = null;
});

async function readStoredTimerSnapshot(): Promise<StoredTimerSnapshot> {
  if (storedTimerSnapshot && isTimerSnapshotFresh()) {
    return storedTimerSnapshot;
  }
  if (storedTimerRead) {
    return storedTimerRead;
  }

  const epoch = timerSnapshotEpoch();
  storedTimerRead = (async () => {
    const values = await getConfigs(TIMER_SNAPSHOT_KEYS);
    const snapshot: StoredTimerSnapshot = {
      id: storedTimerSerial + 1,
      enlistmentRaw: values[CONFIG_KEYS.ENLISTMENT_DATE] ?? null,
      demobilizationRaw: values[CONFIG_KEYS.DEMOBILIZATION_DATE] ?? null,
      customRaw: values[CONFIG_KEYS.CUSTOM_TIMERS_DATA] ?? null,
      activeId: values[CONFIG_KEYS.ACTIVE_TIMER_ID] ?? null,
      partnerName: values[CONFIG_KEYS.PARTNER_NAME] ?? null,
      settings: timerSettingsFromConfig(values),
    };
    storedTimerSerial = snapshot.id;
    if (epoch === timerSnapshotEpoch()) {
      storedTimerSnapshot = snapshot;
      rememberTimerSettings(snapshot.settings);
      markTimerSnapshotFresh();
    }
    return snapshot;
  })().finally(() => {
    storedTimerRead = null;
  });

  return storedTimerRead;
}

interface UseServiceTimerOptions {
  /** Пересчёт прогресса каждую секунду. На экране настроек не нужен. */
  tick?: boolean;
}

/** Загружает даты, доп. таймеры и пересчитывает прогресс каждую секунду */
export function useServiceTimer(options?: UseServiceTimerOptions): UseServiceTimerResult {
  const [state, setState] = useState<ServiceTimerState>({
    isLoading: getCachedTimerSettings() === null,
    partnerName: '',
    enlistmentDate: null,
    demobilizationDate: null,
    customTimers: [],
    notificationDisabledIds: [],
    activeTimer: null,
    settings: getCachedTimerSettings() ?? DEFAULT_TIMER_SETTINGS,
    progress: null,
    centerDisplay: null,
    passedBreakdown: null,
    remainingBreakdown: null,
  });
  const settingsRef = useRef(state.settings);
  settingsRef.current = state.settings;
  const recordsRef = useRef({
    customTimers: state.customTimers,
    notificationDisabledIds: state.notificationDisabledIds,
    enlistmentDate: state.enlistmentDate,
    demobilizationDate: state.demobilizationDate,
    partnerName: state.partnerName,
    activeTimer: state.activeTimer,
  });
  recordsRef.current = {
    customTimers: state.customTimers,
    notificationDisabledIds: state.notificationDisabledIds,
    enlistmentDate: state.enlistmentDate,
    demobilizationDate: state.demobilizationDate,
    partnerName: state.partnerName,
    activeTimer: state.activeTimer,
  };
  const stateRef = useRef(state);
  stateRef.current = state;
  const appliedSnapshotId = useRef<number | null>(null);
  const viewSignatureRef = useRef('');

  const reload = useCallback(async () => {
    try {
      const snapshot = await readStoredTimerSnapshot();
      if (appliedSnapshotId.current === snapshot.id) {
        setState((prev) => (prev.isLoading ? { ...prev, isLoading: false } : prev));
        return;
      }
      appliedSnapshotId.current = snapshot.id;

      const enlistmentDate = parseStoredDate(snapshot.enlistmentRaw);
      const demobilizationDate = parseStoredDate(snapshot.demobilizationRaw);
      const customStorage = parseCustomTimersStorage(snapshot.customRaw);
      const customTimers = customStorage.timers;
      const notificationDisabledIds = pruneNotificationDisabledIds(
        customStorage.notificationDisabledIds,
        [SERVICE_TIMER_ID, ...customTimers.map((timer) => timer.id)],
      );
      const resolvedPartnerName = snapshot.partnerName ?? '';
      const { settings } = snapshot;
      const activeTimer = resolveActiveTimer(
        snapshot.activeId,
        enlistmentDate,
        demobilizationDate,
        customTimers,
        resolvedPartnerName,
      );

      if (!activeTimer) {
        viewSignatureRef.current = '';
        publishedTimerView = null;
        setTimerPhotoBackgroundActive(Boolean(settings.backgroundImageUri));
        setState((prev) => ({
          ...prev,
          isLoading: false,
          partnerName: resolvedPartnerName,
          enlistmentDate,
          demobilizationDate,
          customTimers,
          notificationDisabledIds,
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

      const computed = computeTimerState(activeTimer, settings, new Date());
      viewSignatureRef.current = timerViewSignature(settings, computed);
      publishTimerView(activeTimer.id, computed);
      setTimerPhotoBackgroundActive(Boolean(settings.backgroundImageUri));
      setState({
        isLoading: false,
        partnerName: resolvedPartnerName,
        enlistmentDate,
        demobilizationDate,
        customTimers,
        notificationDisabledIds,
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
    if (options?.tick === false) {
      return;
    }
    const intervalId = setInterval(() => {
      const prev = stateRef.current;
      if (!prev.activeTimer) {
        return;
      }

      const computed = computeTimerState(prev.activeTimer, prev.settings, new Date());
      publishTimerView(prev.activeTimer.id, computed);
      const signature = timerViewSignature(prev.settings, computed);
      if (signature === viewSignatureRef.current) {
        return;
      }

      viewSignatureRef.current = signature;
      persistWidget(prev.activeTimer, computed.progress);
      setState((current) => {
        if (!current.activeTimer) {
          return current;
        }
        return { ...current, ...computed };
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [options?.tick]);

  const updateSettings = useCallback(async (partial: Partial<TimerSettings>) => {
    const prevSettings = settingsRef.current;
    const merged: TimerSettings = {
      ...DEFAULT_TIMER_SETTINGS,
      ...prevSettings,
      ...partial,
    };
    const nextSettings: TimerSettings = {
      ...merged,
      progressBarMode: normalizeProgressBarMode(merged.timerType, merged.progressBarMode),
      backgroundDim: clampBackgroundDim(merged.backgroundDim),
      backgroundFocusX: clampBackgroundFocus(merged.backgroundFocusX),
      backgroundFocusY: clampBackgroundFocus(merged.backgroundFocusY),
    };
    settingsRef.current = nextSettings;
    rememberTimerSettings(nextSettings);
    setTimerPhotoBackgroundActive(Boolean(nextSettings.backgroundImageUri));

    setState((prev) => {
      if (!prev.activeTimer) {
        viewSignatureRef.current = '';
        return { ...prev, settings: nextSettings };
      }

      const computed = computeTimerState(prev.activeTimer, nextSettings, new Date());
      viewSignatureRef.current = timerViewSignature(nextSettings, computed);
      publishTimerView(prev.activeTimer.id, computed);
      persistWidget(prev.activeTimer, computed.progress);
      return {
        ...prev,
        settings: nextSettings,
        ...computed,
      };
    });

    try {
      await persistTimerSettingsDiff(prevSettings, nextSettings);
    } catch (error) {
      logger.error('Ошибка сохранения настроек таймера', error);
    }
  }, []);

  const persistCustomStorage = useCallback(
    (timers: CustomTimerRecord[], notificationDisabledIds: string[]) =>
      persistCustomTimers(timers, notificationDisabledIds),
    [],
  );

  const reportTimerSaveError = useCallback(
    async (error: unknown) => {
      logger.error('Не удалось сохранить таймер', error);
      Alert.alert('Не удалось сохранить', 'Попробуйте ещё раз');
      await reload();
    },
    [reload],
  );

  const publishTimerLists = useCallback(
    (timers: CustomTimerRecord[], notificationDisabledIds: string[], activeId: string) => {
      const current = recordsRef.current;
      const activeTimer = resolveActiveTimer(
        activeId,
        current.enlistmentDate,
        current.demobilizationDate,
        timers,
        current.partnerName,
      );
      recordsRef.current = {
        ...current,
        customTimers: timers,
        notificationDisabledIds,
        activeTimer,
      };
      setState((prev) => {
        const resolved = resolveActiveTimer(
          activeId,
          prev.enlistmentDate,
          prev.demobilizationDate,
          timers,
          prev.partnerName,
        );
        if (!resolved) {
          persistWidget(null, null);
          return {
            ...prev,
            customTimers: timers,
            notificationDisabledIds,
            activeTimer: null,
            progress: null,
            centerDisplay: null,
            passedBreakdown: null,
            remainingBreakdown: null,
          };
        }
        const computed = computeTimerState(resolved, prev.settings, new Date());
        persistWidget(resolved, computed.progress);
        return {
          ...prev,
          customTimers: timers,
          notificationDisabledIds,
          activeTimer: resolved,
          ...computed,
        };
      });
    },
    [],
  );

  const setActiveTimerId = useCallback(async (id: string) => {
    const current = recordsRef.current;
    const activeTimer = resolveActiveTimer(
      id,
      current.enlistmentDate,
      current.demobilizationDate,
      current.customTimers,
      current.partnerName,
    );
    recordsRef.current = { ...current, activeTimer };
    setState((prev) => {
      const resolved = resolveActiveTimer(
        id,
        prev.enlistmentDate,
        prev.demobilizationDate,
        prev.customTimers,
        prev.partnerName,
      );
      if (!resolved) {
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
      const computed = computeTimerState(resolved, prev.settings, new Date());
      persistWidget(resolved, computed.progress);
      return { ...prev, activeTimer: resolved, ...computed };
    });
    try {
      await setConfig(CONFIG_KEYS.ACTIVE_TIMER_ID, id);
    } catch (error) {
      recordsRef.current = current;
      await reportTimerSaveError(error);
    }
  }, [reportTimerSaveError]);

  const setTimerNotificationsEnabled = useCallback(
    async (id: string, enabled: boolean) => {
      const current = recordsRef.current;
      const nextDisabled = withTimerNotificationEnabled(current.notificationDisabledIds, id, enabled);
      const pruned = pruneNotificationDisabledIds(nextDisabled, [
        SERVICE_TIMER_ID,
        ...current.customTimers.map((timer) => timer.id),
      ]);
      recordsRef.current = { ...current, notificationDisabledIds: pruned };
      setState((prev) => ({ ...prev, notificationDisabledIds: pruned }));
      try {
        await persistCustomStorage(current.customTimers, pruned);
        void rescheduleAppNotifications();
      } catch (error) {
        recordsRef.current = current;
        await reportTimerSaveError(error);
      }
    },
    [persistCustomStorage, reportTimerSaveError],
  );

  const addCustomTimer = useCallback(
    async (input: CustomTimerInput): Promise<boolean> => {
      const record = customTimerRecordFromInput(input, Crypto.randomUUID());
      if (!record) {
        return false;
      }

      const current = recordsRef.current;
      const nextTimers = [...current.customTimers, record];
      const pruned = pruneNotificationDisabledIds(current.notificationDisabledIds, [
        SERVICE_TIMER_ID,
        ...nextTimers.map((timer) => timer.id),
      ]);
      publishTimerLists(nextTimers, pruned, record.id);

      try {
        await persistCustomStorage(nextTimers, pruned);
        await setConfig(CONFIG_KEYS.ACTIVE_TIMER_ID, record.id);
        void rescheduleAppNotifications();
        return true;
      } catch (error) {
        recordsRef.current = current;
        await reportTimerSaveError(error);
        return false;
      }
    },
    [persistCustomStorage, publishTimerLists, reportTimerSaveError],
  );

  const updateCustomTimer = useCallback(
    async (id: string, input: CustomTimerInput): Promise<boolean> => {
      const record = customTimerRecordFromInput(input, id);
      if (!record) {
        return false;
      }

      const current = recordsRef.current;
      const nextTimers = current.customTimers.map((timer) => (timer.id === id ? record : timer));
      const pruned = pruneNotificationDisabledIds(current.notificationDisabledIds, [
        SERVICE_TIMER_ID,
        ...nextTimers.map((timer) => timer.id),
      ]);
      const activeId = current.activeTimer?.id ?? SERVICE_TIMER_ID;
      publishTimerLists(nextTimers, pruned, activeId);

      try {
        await persistCustomStorage(nextTimers, pruned);
        void rescheduleAppNotifications();
        return true;
      } catch (error) {
        recordsRef.current = current;
        await reportTimerSaveError(error);
        return false;
      }
    },
    [persistCustomStorage, publishTimerLists, reportTimerSaveError],
  );

  const deleteCustomTimer = useCallback(
    async (id: string) => {
      const current = recordsRef.current;
      const nextTimers = current.customTimers.filter((timer) => timer.id !== id);
      const pruned = pruneNotificationDisabledIds(current.notificationDisabledIds, [
        SERVICE_TIMER_ID,
        ...nextTimers.map((timer) => timer.id),
      ]);
      const nextActiveId =
        current.activeTimer?.id === id ? SERVICE_TIMER_ID : (current.activeTimer?.id ?? SERVICE_TIMER_ID);
      publishTimerLists(nextTimers, pruned, nextActiveId);

      try {
        await persistCustomStorage(nextTimers, pruned);
        await setConfig(CONFIG_KEYS.ACTIVE_TIMER_ID, nextActiveId);
        void rescheduleAppNotifications();
      } catch (error) {
        recordsRef.current = current;
        await reportTimerSaveError(error);
      }
    },
    [persistCustomStorage, publishTimerLists, reportTimerSaveError],
  );

  return {
    ...state,
    updateSettings,
    setActiveTimerId,
    setTimerNotificationsEnabled,
    addCustomTimer,
    updateCustomTimer,
    deleteCustomTimer,
    reload,
  };
}
