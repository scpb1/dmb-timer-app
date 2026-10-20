import { parseISO } from 'date-fns';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { CONFIG_KEYS } from '@/types/config';
import {
  DEFAULT_CUSTOM_TIMERS_STORAGE,
  SERVICE_TIMER_ID,
  type CustomTimerRecord,
  type CustomTimersStorage,
} from '@/types/timer';
import { initDatabase, getConfig } from '@/services/database';
import { calculateServiceProgress } from '@/utils/timerCalculations';
import {
  buildTimerWidgetPayload,
  EMPTY_WIDGET_PAYLOAD,
} from '@/utils/timerWidget';
import { TimerWidget } from '@/widgets/TimerWidget';

function parseCustomTimers(raw: string | null): CustomTimerRecord[] {
  if (!raw) {
    return DEFAULT_CUSTOM_TIMERS_STORAGE.timers;
  }
  try {
    const parsed = JSON.parse(raw) as CustomTimersStorage;
    return Array.isArray(parsed?.timers) ? parsed.timers : [];
  } catch {
    return [];
  }
}

async function loadPayload() {
  await initDatabase();
  const [enlistmentRaw, demobilizationRaw, customRaw, activeId, partnerName] = await Promise.all([
    getConfig(CONFIG_KEYS.ENLISTMENT_DATE),
    getConfig(CONFIG_KEYS.DEMOBILIZATION_DATE),
    getConfig(CONFIG_KEYS.CUSTOM_TIMERS_DATA),
    getConfig(CONFIG_KEYS.ACTIVE_TIMER_ID),
    getConfig(CONFIG_KEYS.PARTNER_NAME),
  ]);

  const customTimers = parseCustomTimers(customRaw);
  const custom = customTimers.find((timer) => timer.id === activeId);

  if (custom) {
    const startDate = parseISO(custom.startDate);
    const endDate = parseISO(custom.endDate);
    const progress = calculateServiceProgress(startDate, endDate);
    return buildTimerWidgetPayload(
      { id: custom.id, name: custom.name, startDate, endDate, kind: 'custom' },
      progress,
    );
  }

  if (enlistmentRaw && demobilizationRaw) {
    const startDate = parseISO(enlistmentRaw);
    const endDate = parseISO(demobilizationRaw);
    const progress = calculateServiceProgress(startDate, endDate);
    return buildTimerWidgetPayload(
      { id: SERVICE_TIMER_ID, name: partnerName?.trim() || 'Служба', startDate, endDate, kind: 'service' },
      progress,
    );
  }

  return EMPTY_WIDGET_PAYLOAD;
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const payload = await loadPayload().catch(() => EMPTY_WIDGET_PAYLOAD);
      props.renderWidget(<TimerWidget {...payload} />);
      break;
    }
    default:
      break;
  }
}
