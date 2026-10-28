import { StyleSheet, Text, View } from 'react-native';

import { typography } from '@/theme/typography';

interface MilestonesChecklistMarkProps {
  state: 'past' | 'here' | 'future';
  photoBackground?: boolean;
  outlineColor?: string;
}

export function MilestonesChecklistMark({
  state,
  photoBackground = false,
  outlineColor,
}: MilestonesChecklistMarkProps) {
  const isPast = state === 'past';
  const isHere = state === 'here';
  const isFuture = state === 'future';
  const border = outlineColor ?? '#FFFFFF';
  const checkColor = border;

  return (
    <View
      style={[
        styles.mark,
        { borderColor: border, backgroundColor: 'transparent' },
        isFuture && styles.markFuture,
      ]}
    >
      {isPast ? (
        <Text style={[styles.markDone, { color: checkColor }]}>✓</Text>
      ) : isHere ? (
        <Text style={[styles.markHere, { color: border }]}>●</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markFuture: {
    opacity: 0.55,
  },
  markDone: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 12,
    lineHeight: 14,
  },
  markHere: {
    fontSize: 14,
    lineHeight: 16,
  },
});
