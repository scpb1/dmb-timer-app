import FontAwesome from '@expo/vector-icons/FontAwesome';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { DotGridCellShape } from '@/types/timer';

export type DotGridLegendMarkKind = 'filled' | 'empty' | 'final';

const LEGEND_SIZE = 11;

function HeartMark({
  filled,
  color,
  size,
}: {
  filled: boolean;
  color: string;
  size: number;
}) {
  return <FontAwesome name={filled ? 'heart' : 'heart-o'} size={size} color={color} />;
}

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

  if (shape === 'heart') {
    return <HeartMark filled={filled} color={filled ? accent : outline} size={size} />;
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: filled ? accent : 'transparent',
        borderWidth: 1,
        borderColor: filled ? accent : outline,
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

export const DotGridCell = memo(function DotGridCell({
  shape,
  filled,
  isFinal,
  accent,
  emptyBorder,
  cellSize,
}: DotGridCellProps) {
  const outline = isFinal && !filled ? accent : emptyBorder;

  if (shape === 'heart') {
    return (
      <View style={[styles.heartWrap, { width: cellSize, height: cellSize }]}>
        <HeartMark filled={filled} color={filled ? accent : outline} size={cellSize} />
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
            borderColor: filled ? accent : outline,
            backgroundColor: filled ? accent : 'transparent',
            borderWidth: 1,
          },
        ]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  circleWrap: {
    alignItems: 'center',
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
