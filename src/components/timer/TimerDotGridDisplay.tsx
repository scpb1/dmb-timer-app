import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { DotGridCell, DotGridLegendMark } from '@/components/timer/DotGridCell';
import { TimerVizSummaryCard } from '@/components/timer/TimerVizSummaryCard';
import type { DotGridCellShape, ProgressBarMode } from '@/types/timer';
import type { ServiceProgress } from '@/utils/timerCalculations';
import { getDotGridMetrics } from '@/utils/timerCalculations';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface TimerDotGridDisplayProps {
  mode: ProgressBarMode;
  progress: ServiceProgress;
  endDate: Date;
  decimalPlaces: number;
  cellShape: DotGridCellShape;
  photoBackground?: boolean;
  upcomingHeadline?: string | null;
}

/** Горизонтальный padding плашки */
export const TIMER_VIZ_CARD_H_PADDING = 14;
/** Горизонтальный отступ сетки от краёв контейнера */
export const TIMER_VIZ_GRID_H_PADDING = 2;

const MIN_CELL_SIZE = 7;
const MIN_GAP = 2;
const MAX_GAP = 14;

function baseDotGridGap(mode: ProgressBarMode, cellShape: DotGridCellShape): number {
  if (cellShape === 'square') {
    return 0;
  }
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
  cellShape: DotGridCellShape,
): { cellSize: number; gap: number } {
  if (innerWidth <= 0 || columns <= 0) {
    return { cellSize: 11, gap: baseDotGridGap(mode, cellShape) };
  }
  if (cellShape === 'square') {
    const cellSize = innerWidth / columns;
    return { cellSize, gap: 0 };
  }

  let gap = baseDotGridGap(mode, cellShape);
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

export function TimerDotGridDisplay({
  mode,
  progress,
  endDate,
  decimalPlaces,
  cellShape,
  photoBackground = false,
  upcomingHeadline = null,
}: TimerDotGridDisplayProps) {
  const theme = useAppTheme();
  const metrics = useMemo(() => getDotGridMetrics(mode, progress), [mode, progress]);
  const [sectionWidth, setSectionWidth] = useState(0);

  const accent = photoBackground ? '#F2F0EC' : theme.text.accent;
  const emptyBorder = photoBackground ? 'rgba(242, 240, 236, 0.45)' : 'rgba(167, 154, 138, 0.45)';
  const muted = photoBackground ? 'rgba(242, 240, 236, 0.78)' : theme.text.secondary;

  const innerWidth = Math.max(0, sectionWidth - TIMER_VIZ_GRID_H_PADDING * 2);

  const { cellSize, gap } = useMemo(
    () => fitGridLayout(innerWidth, metrics.columns, mode, cellShape),
    [innerWidth, metrics.columns, mode, cellShape],
  );

  const onSectionLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (width > 0 && width !== sectionWidth) {
      setSectionWidth(width);
    }
  };

  return (
    <View style={styles.wrapper} onLayout={onSectionLayout}>
      <TimerVizSummaryCard
        progress={progress}
        endDate={endDate}
        decimalPlaces={decimalPlaces}
        photoBackground={photoBackground}
        dotGridUnitMode={mode}
        upcomingHeadline={upcomingHeadline}
      />

      <View style={styles.dotSection}>
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
                  cellShape === 'square' && styles.gridSquare,
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
                    <DotGridCell
                      key={index}
                      shape={cellShape}
                      filled={filled}
                      isFinal={isFinal}
                      accent={accent}
                      emptyBorder={emptyBorder}
                      index={index}
                      columns={metrics.columns}
                      total={metrics.total}
                      cellSize={cellSize}
                    />
                  );
                })}
              </View>
            );
          })}
        </View>

        <View style={styles.legend}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: 16,
  },
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
  gridSquare: {
    borderColor: 'transparent',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  legendEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendItem: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 11,
  },
});
