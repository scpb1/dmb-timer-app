import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import type { DotGridCellShape } from '@/types/timer';

export type DotGridLegendMarkKind = 'filled' | 'empty' | 'final';

const LEGEND_SIZE = 11;

/** Мини-иконка для легенды сетки — та же форма, что у ячеек */
export function DotGridLegendMark({
  shape,
  kind,
  accent,
  emptyBorder,
  size = LEGEND_SIZE,
}: {
  shape: DotGridCellShape;
  kind: DotGridLegendMarkKind;
  accent: string;
  emptyBorder: string;
  size?: number;
}) {
  const filled = kind === 'filled';
  const isFinal = kind === 'final';
  const outline = isFinal ? accent : emptyBorder;
  const fillColor = filled ? accent : 'transparent';
  const stroke = filled ? accent : outline;

  if (shape === 'heart') {
    return (
      <MaterialCommunityIcons
        name={filled ? 'heart' : 'heart-outline'}
        size={size}
        color={filled ? accent : stroke}
      />
    );
  }

  if (shape === 'square') {
    return (
      <View
        style={{
          width: size,
          height: size,
          backgroundColor: fillColor,
          borderWidth: 1,
          borderColor: stroke,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: fillColor,
        borderWidth: 1,
        borderColor: stroke,
      }}
    />
  );
}

interface DotGridCellProps {
  shape: DotGridCellShape;
  filled: boolean;
  isFinal: boolean;
  accent: string;
  emptyBorder: string;
  /** Индекс в сетке — для линий у квадратов */
  index: number;
  columns: number;
  total: number;
  cellSize: number;
}

export function DotGridCell({
  shape,
  filled,
  isFinal,
  accent,
  emptyBorder,
  index,
  columns,
  total,
  cellSize,
}: DotGridCellProps) {
  const outline = isFinal && !filled ? accent : emptyBorder;
  const fillColor = filled ? accent : 'transparent';
  const stroke = filled ? accent : outline;

  if (shape === 'heart') {
    return (
      <View style={[styles.heartWrap, { width: cellSize, height: cellSize }]}>
        <MaterialCommunityIcons
          name={filled ? 'heart' : 'heart-outline'}
          size={cellSize}
          color={filled ? accent : stroke}
        />
      </View>
    );
  }

  if (shape === 'square') {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const lineColor = isFinal && !filled ? accent : emptyBorder;
    const squareStyle: ViewStyle = {
      width: cellSize,
      height: cellSize,
      backgroundColor: fillColor,
      borderColor: lineColor,
      borderTopWidth: row === 0 ? 1 : 0,
      borderLeftWidth: col === 0 ? 1 : 0,
      borderRightWidth: 1,
      borderBottomWidth: 1,
    };

    return <View style={squareStyle} />;
  }

  return (
    <View style={[styles.circleWrap, { width: cellSize, height: cellSize }]}>
      <View
        style={[
          styles.circle,
          {
            width: cellSize,
            height: cellSize,
            borderColor: stroke,
            backgroundColor: fillColor,
            borderWidth: 1,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circleWrap: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  circle: {
    borderRadius: 99,
  },
  heartWrap: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
});
