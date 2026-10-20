import { Platform } from 'react-native';

import { APP_NAME } from '@/constants';
import type { ActiveTimer, TimerPhase } from '@/types/timer';
import type { ServiceProgress } from '@/utils/timerCalculations';
import { getCenterDisplayLabels } from '@/utils/timerCalculations';
import { isAndroidWidgetAvailable } from '@/utils/nativeAvailability';
import { logger } from '@/utils/logger';

export interface TimerWidgetPayload {
  name: string;
  primary: string;
  label: string;
  percent: string;
  phase: TimerPhase | 'empty';
}

export const EMPTY_WIDGET_PAYLOAD: TimerWidgetPayload = {
  name: APP_NAME,
  primary: '—',
  label: 'нет дат',
  percent: '',
  phase: 'empty',
};

export function buildTimerWidgetPayload(
  timer: ActiveTimer | null,
  progress: ServiceProgress | null,
): TimerWidgetPayload {
  if (!timer || !progress) {
    return EMPTY_WIDGET_PAYLOAD;
  }

  const labels = getCenterDisplayLabels(timer.kind);

  if (progress.phase === 'before') {
    return {
      name: timer.name,
      primary: String(progress.daysUntilStart),
      label: labels.before,
      percent: '0%',
      phase: progress.phase,
    };
  }

  if (progress.phase === 'after') {
    return {
      name: timer.name,
      primary: String(progress.daysAfterEnd),
      label: labels.after,
      percent: '100%',
      phase: progress.phase,
    };
  }

  return {
    name: timer.name,
    primary: String(progress.daysLeft),
    label: 'ддд',
    percent: `${Math.round(progress.progressPercent)}%`,
    phase: progress.phase,
  };
}

let lastWidgetKey = '';

export async function updateTimerWidgets(
  timer: ActiveTimer | null,
  progress: ServiceProgress | null,
): Promise<void> {
  const payload = buildTimerWidgetPayload(timer, progress);
  const key = `${payload.name}|${payload.primary}|${payload.label}|${payload.percent}`;
  if (key === lastWidgetKey) {
    return;
  }

  lastWidgetKey = key;

  try {
    const { requestWidgetUpdate } = require('react-native-android-widget') as typeof import('react-native-android-widget');
    const { TimerWidget } = require('../widgets/TimerWidget') as typeof import('@/widgets/TimerWidget');

    await requestWidgetUpdate({
      widgetName: 'TimerWidget',
      renderWidget: () => <TimerWidget {...payload} />,
      widgetNotFound: () => undefined,
    });
  } catch (error) {
    logger.error('Не удалось обновить виджет таймера', error);
  }
}
