import { differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

import { FEATURES } from '@/constants';
import { CONFIG_KEYS } from '@/types/config';
import type { ActiveTimer, DotGridCellShape } from '@/types/timer';
import { getConfig } from '@/services/database';
import { buildDisplayHolidays, parseHolidaysStorage } from '@/utils/holidayCalculations';
import { formatCount } from '@/utils/inflection';
import { progressEmptyColor } from '@/components/timer/progressSegmentColors';
import { withAlpha } from '@/utils/color';
import { getColorTheme } from '@/theme/themes';
import { logger } from '@/utils/logger';
import { isAndroidWidgetAvailable } from '@/utils/nativeAvailability';
import { loadTimerRecords } from '@/utils/timerRecords';
import {
  calculateServiceProgress,
  getCenterDisplayLabels,
  getCenterDisplayValues,
  getFrameDisplayValues,
  getLinearDisplayValues,
  getServiceStatCardPair,
  getServiceTimeBreakdowns,
  type ServiceProgress,
} from '@/utils/timerCalculations';
import { typography } from '@/theme/typography';
import {
  nativeThemeColors,
  parseWidgetStudioSettings,
  resolveWidgetHoliday,
  type NativeWidgetColors,
} from '@/utils/widgetStudio';
import type { NativeHolidayWidgetProps } from '@/widgets/HolidayWidget';
import type { NativeStatsWidgetProps } from '@/widgets/StatsWidget';
import type { NativeTimerWidgetProps } from '@/widgets/TimerWidget';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function describeSegmentPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngleDeg: number,
  endAngleDeg: number,
): string {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const startRad = toRad(startAngleDeg);
  const endRad = toRad(endAngleDeg);
  const largeArc = endAngleDeg - startAngleDeg > 180 ? 1 : 0;
  const ix1 = cx + innerRadius * Math.cos(startRad);
  const iy1 = cy + innerRadius * Math.sin(startRad);
  const ox1 = cx + outerRadius * Math.cos(startRad);
  const oy1 = cy + outerRadius * Math.sin(startRad);
  const ox2 = cx + outerRadius * Math.cos(endRad);
  const oy2 = cy + outerRadius * Math.sin(endRad);
  const ix2 = cx + innerRadius * Math.cos(endRad);
  const iy2 = cy + innerRadius * Math.sin(endRad);

  return [
    `M ${ix1.toFixed(2)} ${iy1.toFixed(2)}`,
    `L ${ox1.toFixed(2)} ${oy1.toFixed(2)}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${ox2.toFixed(2)} ${oy2.toFixed(2)}`,
    `L ${ix2.toFixed(2)} ${iy2.toFixed(2)}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function capSegments(segmentCount: number, filledCount: number, max: number) {
  const count = Math.min(max, Math.max(1, segmentCount));
  const filled = Math.min(
    count,
    Math.round((filledCount / Math.max(1, segmentCount)) * count),
  );
  return { count, filled };
}

export function buildCircularTimerSvg(
  segmentCount: number,
  filledCount: number,
  colors: NativeWidgetColors,
  primary: string,
  label: string,
  secondary: string | null,
  themeId?: string | null,
): string {
  const { count, filled } = capSegments(segmentCount, filledCount, 36);
  const size = 200;
  const center = size / 2;
  const outerRadius = center - 6;
  const innerRadius = outerRadius - 22;
  const angleStep = 360 / count;
  const gapAngle = Math.min(1.4, angleStep * 0.22);
  const segmentSpan = angleStep - gapAngle;

  const colorTheme = getColorTheme(themeId ?? null);
  const empty = progressEmptyColor(
    colors.overlayMuted,
    colors.muted,
    colorTheme.scheme,
    false,
  );
  const paths = Array.from({ length: count }, (_, index) => {
    const segmentCenter = index * angleStep + angleStep / 2;
    const startAngle = segmentCenter - segmentSpan / 2;
    const endAngle = segmentCenter + segmentSpan / 2;
    const d = describeSegmentPath(center, center, innerRadius, outerRadius, startAngle, endAngle);
    const fill = index < filled ? colors.accent : empty;
    return `<path d="${d}" fill="${fill}"/>`;
  }).join('');

  const secondaryText = secondary
    ? `<text x="${center}" y="78" text-anchor="middle" font-family="${typography.fontFamily.sans}" font-size="12" fill="${colors.muted}">${escapeXml(secondary)}</text>`
    : '';

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    paths,
    secondaryText,
    `<text x="${center}" y="118" text-anchor="middle" font-family="${typography.fontFamily.display}" font-size="36" fill="${colors.text}">${escapeXml(primary)}</text>`,
    `<text x="${center}" y="140" text-anchor="middle" font-family="${typography.fontFamily.sans}" font-size="13" fill="${colors.muted}">${escapeXml(label)}</text>`,
    '</svg>',
  ].join('');
}

export function buildLinearBarSvg(
  segmentCount: number,
  filledCount: number,
  colors: NativeWidgetColors,
  themeId?: string | null,
): string {
  const { count, filled } = capSegments(segmentCount, filledCount, 48);
  const width = 280;
  const height = 24;
  const gap = count > 1 ? 1.5 : 0;
  const segmentWidth = (width - gap * (count - 1)) / count;

  const colorTheme = getColorTheme(themeId ?? null);
  const empty = progressEmptyColor(
    colors.overlayMuted,
    colors.muted,
    colorTheme.scheme,
    false,
  );
  const rects = Array.from({ length: count }, (_, index) => {
    const x = index * (segmentWidth + gap);
    const fill = index < filled ? colors.accent : empty;
    return `<rect x="${x.toFixed(2)}" y="0" width="${segmentWidth.toFixed(2)}" height="${height}" fill="${fill}"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${rects}</svg>`;
}

function heartPath(cx: number, cy: number, size: number): string {
  const s = size / 24;
  const x = cx - size / 2;
  const y = cy - size / 2;
  return [
    `M ${x + 12 * s} ${y + 21 * s}`,
    `C ${x + 3 * s} ${y + 14 * s} ${x + 1 * s} ${y + 8 * s} ${x + 6 * s} ${y + 4.5 * s}`,
    `C ${x + 9 * s} ${y + 2.5 * s} ${x + 12 * s} ${y + 4 * s} ${x + 12 * s} ${y + 7 * s}`,
    `C ${x + 12 * s} ${y + 4 * s} ${x + 15 * s} ${y + 2.5 * s} ${x + 18 * s} ${y + 4.5 * s}`,
    `C ${x + 23 * s} ${y + 8 * s} ${x + 21 * s} ${y + 14 * s} ${x + 12 * s} ${y + 21 * s}`,
    'Z',
  ].join(' ');
}

export function buildDotGridSvg(
  segmentCount: number,
  filledCount: number,
  cellShape: DotGridCellShape,
  colors: NativeWidgetColors,
  _themeId?: string | null,
): string {
  const { count, filled } = capSegments(segmentCount, filledCount, 96);
  const emptyStroke = withAlpha(colors.muted, 0.45);
  const columns = Math.min(12, count);
  const rows = Math.ceil(count / columns);
  const cell = 10;
  const gap = 3;
  const width = columns * cell + (columns - 1) * gap;
  const height = rows * cell + (rows - 1) * gap;

  const cells = Array.from({ length: count }, (_, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const cx = col * (cell + gap) + cell / 2;
    const cy = row * (cell + gap) + cell / 2;
    const isFilled = index < filled;
    const isFinal = index === count - 1;

    if (cellShape === 'heart') {
      if (isFilled) {
        return `<path d="${heartPath(cx, cy, cell)}" fill="${colors.accent}"/>`;
      }
      const stroke = isFinal ? colors.accent : emptyStroke;
      return `<path d="${heartPath(cx, cy, cell)}" fill="none" stroke="${stroke}" stroke-width="1"/>`;
    }

    if (isFilled) {
      return `<circle cx="${cx}" cy="${cy}" r="${cell / 2 - 0.5}" fill="${colors.accent}"/>`;
    }
    const stroke = isFinal ? colors.accent : emptyStroke;
    return `<circle cx="${cx}" cy="${cy}" r="${cell / 2 - 0.5}" fill="none" stroke="${stroke}" stroke-width="1"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${cells}</svg>`;
}

export async function loadHomeWidgetModels() {
  const records = await loadTimerRecords();
  const [studioRaw, holidaysRaw, themeId] = await Promise.all([
    getConfig(CONFIG_KEYS.WIDGET_STUDIO_DATA),
    getConfig(CONFIG_KEYS.HOLIDAYS_DATA),
    getConfig(CONFIG_KEYS.COLOR_THEME_ID),
  ]);
  const settings = parseWidgetStudioSettings(studioRaw);
  const colors = nativeThemeColors(themeId);
  const progress = records.activeTimer
    ? calculateServiceProgress(records.activeTimer.startDate, records.activeTimer.endDate)
    : null;

  const labels = records.activeTimer
    ? getCenterDisplayLabels(records.activeTimer.kind)
    : undefined;
  const center =
    records.activeTimer && progress
      ? getCenterDisplayValues(
          settings.timer.progressBarMode,
          progress,
          settings.timer.percentDecimalPlaces,
          settings.timer.centerDisplay,
          labels,
        )
      : { primaryValue: '—', unitLabel: 'нет дат', secondaryValue: null };

  const linear =
    records.activeTimer && progress
      ? getLinearDisplayValues(
          settings.timer.progressBarMode,
          progress,
          settings.timer.percentDecimalPlaces,
          settings.timer.centerDisplay,
          labels,
        )
      : null;
  const frame =
    records.activeTimer && progress
      ? getFrameDisplayValues(progress, settings.timer.centerDisplay, labels)
      : { primaryValue: '—', unitLabel: 'нет дат' };

  const segmentCount = progress?.segmentCounts[settings.timer.progressBarMode] ?? 12;
  const filledCount = progress?.filledSegments[settings.timer.progressBarMode] ?? 0;
  const primary =
    settings.timer.kind === 'frame'
      ? frame.primaryValue
      : settings.timer.kind === 'linear' && linear
        ? linear.mode === 'percent'
          ? (linear.percentText ?? '—')
          : (linear.primaryValue ?? '—')
        : settings.timer.progressBarMode === 'percent'
          ? `${center.primaryValue}%`
          : center.primaryValue;
  const label =
    settings.timer.kind === 'frame'
      ? frame.unitLabel
      : settings.timer.kind === 'linear' && linear && linear.mode !== 'percent'
        ? (linear.unitLabel ?? '')
        : center.unitLabel;
  const secondary =
    settings.timer.progressBarMode === 'percent' || !center.secondaryValue
      ? null
      : `${center.secondaryValue}%`;

  const kind = settings.timer.kind;
  const graphicSvg =
    kind === 'circular'
      ? buildCircularTimerSvg(segmentCount, filledCount, colors, primary, label, secondary, themeId)
      : kind === 'linear'
        ? buildLinearBarSvg(segmentCount, filledCount, colors, themeId)
        : kind === 'dotGrid'
          ? buildDotGridSvg(segmentCount, filledCount, settings.timer.cellShape, colors, themeId)
          : '';

  const timer: NativeTimerWidgetProps = {
    kind,
    primary,
    label,
    secondary,
    graphicSvg,
    ...colors,
  };

  const now = new Date();
  const holidays = buildDisplayHolidays(
    parseHolidaysStorage(holidaysRaw),
    now,
    records.activeTimer
      ? { start: records.activeTimer.startDate, end: records.activeTimer.endDate }
      : null,
  );
  const holidayRecord = resolveWidgetHoliday(holidays, settings.holiday, now);
  const days = holidayRecord
    ? differenceInCalendarDays(startOfDay(holidayRecord.date), startOfDay(now))
    : 0;
  let daysUntil = '';
  if (holidayRecord) {
    if (days < 0) {
      daysUntil = `прошло ${formatCount(Math.abs(days), 'day')}`;
    } else if (days === 0) {
      daysUntil = 'сегодня';
    } else {
      daysUntil = `через ${formatCount(days, 'day')}`;
    }
  }
  const holiday: NativeHolidayWidgetProps = {
    name: holidayRecord?.name ?? 'Нет праздников',
    daysUntil,
    dateLabel: holidayRecord ? format(holidayRecord.date, 'd MMMM', { locale: ru }) : '',
    ...colors,
  };

  let stats: NativeStatsWidgetProps = {
    elapsedValue: '—',
    elapsedLabel: 'дней',
    remainingValue: '—',
    remainingLabel: 'дней',
    ...colors,
  };
  if (records.activeTimer) {
    const breakdowns = getServiceTimeBreakdowns(
      records.activeTimer.startDate,
      records.activeTimer.endDate,
    );
    const progress = calculateServiceProgress(
      records.activeTimer.startDate,
      records.activeTimer.endDate,
    );
    const pair = getServiceStatCardPair(
      progress,
      breakdowns.passed,
      breakdowns.remaining,
      settings.stats.mode,
    );
    const withRemainder = (label: string, detailLines: string[]) =>
      settings.stats.mode === 'weeks' || settings.stats.mode === 'months'
        ? [label, ...detailLines].join(', ')
        : label;
    stats = {
      elapsedValue: String(pair.elapsed.primaryValue),
      elapsedLabel: withRemainder(pair.elapsed.unitLabel, pair.elapsed.detailLines),
      remainingValue: String(pair.remaining.primaryValue),
      remainingLabel: withRemainder(pair.remaining.unitLabel, pair.remaining.detailLines),
      ...colors,
    };
  }

  return { timer, holiday, stats };
}

export async function refreshHomeWidgets(
  _timer?: ActiveTimer | null,
  _progress?: ServiceProgress | null,
): Promise<void> {
  if (!FEATURES.widgets || !isAndroidWidgetAvailable()) {
    return;
  }

  try {
    const { requestWidgetUpdate } = require('react-native-android-widget') as typeof import('react-native-android-widget');
    const { TimerWidget } = require('../widgets/TimerWidget') as typeof import('@/widgets/TimerWidget');
    const { HolidayWidget } = require('../widgets/HolidayWidget') as typeof import('@/widgets/HolidayWidget');
    const { StatsWidget } = require('../widgets/StatsWidget') as typeof import('@/widgets/StatsWidget');
    const models = await loadHomeWidgetModels();

    await Promise.all([
      requestWidgetUpdate({
        widgetName: 'TimerWidget',
        renderWidget: () => <TimerWidget {...models.timer} />,
        widgetNotFound: () => undefined,
      }),
      requestWidgetUpdate({
        widgetName: 'HolidayWidget',
        renderWidget: () => <HolidayWidget {...models.holiday} />,
        widgetNotFound: () => undefined,
      }),
      requestWidgetUpdate({
        widgetName: 'StatsWidget',
        renderWidget: () => <StatsWidget {...models.stats} />,
        widgetNotFound: () => undefined,
      }),
    ]);
  } catch (error) {
    logger.error('Не удалось обновить виджеты', error);
  }
}

export async function updateTimerWidgets(
  timer: ActiveTimer | null,
  progress: ServiceProgress | null,
): Promise<void> {
  await refreshHomeWidgets(timer, progress);
}
