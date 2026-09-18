import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TimerCenterDisplay } from '@/types/timer';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

const ZONE_LABEL_ACTIVE_OPACITY = 0.55;
const ZONE_LABEL_INACTIVE_OPACITY = 0.2;

interface CenterDisplayToggleProps {
  value: TimerCenterDisplay;
  onChange: (value: TimerCenterDisplay) => void;
  photoBackground?: boolean;
}

export function CenterDisplayToggle({
  value,
  onChange,
  photoBackground = false,
}: CenterDisplayToggleProps) {
  return (
    <View style={styles.row}>
      <View style={styles.spacer} />

      <Pressable onPress={() => onChange('elapsed')} hitSlop={4}>
        <Text
          style={[
            styles.label,
            photoBackground && styles.photoText,
            {
              opacity:
                value === 'elapsed'
                  ? ZONE_LABEL_ACTIVE_OPACITY
                  : ZONE_LABEL_INACTIVE_OPACITY,
            },
          ]}
          numberOfLines={1}
        >
          прошло
        </Text>
      </Pressable>

      <View style={styles.spacer} />

      <Pressable onPress={() => onChange('remaining')} hitSlop={4}>
        <Text
          style={[
            styles.label,
            photoBackground && styles.photoText,
            {
              opacity:
                value === 'remaining'
                  ? ZONE_LABEL_ACTIVE_OPACITY
                  : ZONE_LABEL_INACTIVE_OPACITY,
            },
          ]}
          numberOfLines={1}
        >
          осталось
        </Text>
      </Pressable>

      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 22,
  },
  spacer: {
    flex: 1,
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    color: colors.light.text.secondary,
    textAlign: 'center',
  },
  photoText: {
    color: '#F2F0EC',
    textShadowColor: 'rgba(0, 0, 0, 0.42)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
