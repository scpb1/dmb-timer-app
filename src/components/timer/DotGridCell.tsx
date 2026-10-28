import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

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
  cellSize: number;
}

export function DotGridCell({
  shape,
  filled,
  isFinal,
  accent,
  emptyBorder,
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
