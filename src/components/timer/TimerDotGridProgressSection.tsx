import { memo, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';

import { DotGridCell, DotGridLegendMark } from '@/components/timer/DotGridCell';
import type { DotGridCellShape, ProgressBarMode } from '@/types/timer';
import type { ServiceProgress } from '@/utils/timerCalculations';
import { getDotGridMetrics } from '@/utils/timerCalculations';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import { withAlpha } from '@/utils/color';

export const TIMER_VIZ_GRID_H_PADDING = 2;

/** Совпадает с paddingHorizontal в HomeScreen scrollContent (24 × 2) */
const DOT_GRID_SCROLL_H_PADDING = 48;

const MIN_CELL_SIZE = 7;
const MIN_GAP = 2;
const MAX_GAP = 14;

function baseDotGridGap(mode: ProgressBarMode): number {
  switch (mode) {
    case 'months':
      return 5;
    case 'weeks':
      return 4;
    case 'percent':
      return 3;
    case 'days':
    default:
      return 2;
  }
}

function fitGridLayout(
  innerWidth: number,
  columns: number,
  mode: ProgressBarMode,
): { cellSize: number; gap: number } {
  if (innerWidth <= 0 || columns <= 0) {
    return { cellSize: MIN_CELL_SIZE, gap: baseDotGridGap(mode) };
  }

  let gap = baseDotGridGap(mode);
  let cellSize = (innerWidth - gap * (columns - 1)) / columns;

  if (cellSize < MIN_CELL_SIZE && columns > 1) {
    gap = Math.min(
      MAX_GAP,
      Math.max(MIN_GAP, (innerWidth - columns * MIN_CELL_SIZE) / (columns - 1)),
    );
    cellSize = (innerWidth - gap * (columns - 1)) / columns;
  }

  return { cellSize: Math.max(MIN_CELL_SIZE, cellSize), gap };
}

function LegendEntry({
  shape,
  markKind,
  accent,
  emptyBorder,
  label,
  muted,
}: {
  shape: DotGridCellShape;
  markKind: 'filled' | 'empty' | 'final';
  accent: string;
  emptyBorder: string;
  label: string;
  muted: string;
}) {
  return (
    <View style={styles.legendEntry}>
      <DotGridLegendMark
        shape={shape}
        kind={markKind}
        accent={accent}
        emptyBorder={emptyBorder}
      />
      <Text style={[styles.legendItem, { color: muted }]}>{label}</Text>
    </View>
  );
}

interface TimerDotGridProgressSectionProps {
  mode: ProgressBarMode;
  progress: ServiceProgress;
  cellShape: DotGridCellShape;
  photoBackground?: boolean;
}

export const TimerDotGridProgressSection = memo(function TimerDotGridProgressSection({
  mode,
  progress,
  cellShape,
  photoBackground = false,
}: TimerDotGridProgressSectionProps) {
  const theme = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const gridProgress = useMemo(
    () => ({
      phase: progress.phase,
      totalDays: progress.totalDays,
      daysPassed: progress.daysPassed,
      progressPercent: progress.progressPercent,
    }),
    [progress.daysPassed, progress.phase, progress.progressPercent, progress.totalDays],
  );
  const metrics = useMemo(() => getDotGridMetrics(mode, gridProgress), [gridProgress, mode]);
  const estimatedSectionWidth = Math.max(0, windowWidth - DOT_GRID_SCROLL_H_PADDING);
  const [measuredSectionWidth, setMeasuredSectionWidth] = useState(0);
  const sectionWidth =
    measuredSectionWidth > 0 ? measuredSectionWidth : estimatedSectionWidth;

  const accent = photoBackground ? '#F2F0EC' : theme.text.accent;
  const emptyBorder = photoBackground
    ? 'rgba(242, 240, 236, 0.45)'
    : withAlpha(theme.text.secondary, 0.45);
  const muted = photoBackground ? 'rgba(242, 240, 236, 0.78)' : theme.text.secondary;

  const innerWidth = Math.max(0, sectionWidth - TIMER_VIZ_GRID_H_PADDING * 2);

  const { cellSize, gap } = useMemo(
    () => fitGridLayout(innerWidth, metrics.columns, mode),
    [innerWidth, metrics.columns, mode],
  );

  const onSectionLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (width > 0) {
      setMeasuredSectionWidth((prev) => (prev === width ? prev : width));
    }
  };

  return (
    <View style={styles.dotSection} onLayout={onSectionLayout}>
      <View style={[styles.gridWrap, innerWidth > 0 && { width: innerWidth }]}>
        {Array.from({ length: Math.ceil(metrics.total / metrics.columns) }, (_, row) => {
          const rowStart = row * metrics.columns;
          const rowCount = Math.min(metrics.columns, metrics.total - rowStart);
          const rowCountTotal = Math.ceil(metrics.total / metrics.columns);

          return (
            <View
              key={row}
              style={[
                styles.gridRow,
                {
                  width: innerWidth > 0 ? innerWidth : '100%',
                  gap,
                  marginBottom: row < rowCountTotal - 1 ? gap : 0,
                },
              ]}
            >
              {Array.from({ length: rowCount }, (_, col) => {
                const index = rowStart + col;
                const filled = index < metrics.passed;
                const isFinal = index === metrics.total - 1;
                return (
                  <View
                    key={index}
                    style={[
                      styles.cellSlot,
                      { width: cellSize, height: cellSize },
                    ]}
                  >
                    <DotGridCell
                      shape={cellShape}
                      filled={filled}
                      isFinal={isFinal}
                      accent={accent}
                      emptyBorder={emptyBorder}
                      cellSize={cellSize}
                    />
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>

      <View
        style={[
          styles.legend,
          innerWidth > 0 ? { width: innerWidth, alignSelf: 'center' } : null,
        ]}
      >
        <LegendEntry
          shape={cellShape}
          markKind="filled"
          accent={accent}
          emptyBorder={emptyBorder}
          label={`Прошло (${metrics.passed})`}
          muted={muted}
        />
        <LegendEntry
          shape={cellShape}
          markKind="empty"
          accent={accent}
          emptyBorder={emptyBorder}
          label={`Осталось (${metrics.remaining})`}
          muted={muted}
        />
        <LegendEntry
          shape={cellShape}
          markKind="final"
          accent={accent}
          emptyBorder={emptyBorder}
          label="Дембель"
          muted={muted}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  dotSection: {
    width: '100%',
    alignItems: 'center',
  },
  gridWrap: {
    alignSelf: 'center',
    maxWidth: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  cellSlot: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    maxWidth: '100%',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 4,
  },
  legendEntry: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minWidth: 0,
  },
  legendItem: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 11,
  },
});
