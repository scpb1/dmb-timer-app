import { StyleSheet, Text, View } from 'react-native';

import type { StatCardDisplay } from '@/utils/timerCalculations';
import { timerPhotoTextStyles } from '@/components/timer/timerPhotoStyles';
import {
  elapsedRemainingLabel,
  statCardUnitText,
} from '@/components/timer/timerStatCardStyles';
import { layout, useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface TimerUnifiedStatCardProps {
  elapsed: StatCardDisplay;
  remaining: StatCardDisplay;
  photoBackground?: boolean;
  showBorder?: boolean;
}

function StatColumn({
  title,
  display,
  photoBackground,
}: {
  title: string;
  display: StatCardDisplay;
  photoBackground: boolean;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.column}>
      <Text
        style={[
          elapsedRemainingLabel.label,
          { color: theme.text.secondary },
          photoBackground && styles.photoText,
        ]}
      >
        {title}
      </Text>

      <View style={styles.primaryBlock}>
        <Text
          style={[
            styles.primaryValue,
            { color: theme.text.primary },
            photoBackground && timerPhotoTextStyles.heroNumber,
          ]}
        >
          {display.primaryValue}
        </Text>
        <Text
          style={[
            styles.unitLabel,
            { color: theme.text.secondary },
            photoBackground && styles.photoText,
          ]}
        >
          {display.unitLabel}
        </Text>
      </View>

      <View style={styles.detailBlock}>
        {display.detailLines.map((line, index) => (
          <Text
            key={index}
            style={[
              styles.detailLine,
              { color: theme.text.secondary },
              photoBackground && styles.photoText,
            ]}
          >
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** Одна плашка «прошло | осталось» (прототип Q) */
export function TimerUnifiedStatCard({
  elapsed,
  remaining,
  photoBackground = false,
  showBorder = true,
}: TimerUnifiedStatCardProps) {
  const theme = useAppTheme();
  const dividerColor = photoBackground
    ? 'rgba(242, 240, 236, 0.38)'
    : theme.overlay.border;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.overlay.fill,
          borderColor: theme.overlay.border,
        },
        photoBackground && styles.photoCard,
        !showBorder && styles.borderless,
      ]}
    >
      <StatColumn title="прошло" display={elapsed} photoBackground={photoBackground} />
      <View style={[styles.divider, { backgroundColor: dividerColor }]} />
      <StatColumn title="осталось" display={remaining} photoBackground={photoBackground} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: layout.cardBorderRadius,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  divider: {
    width: 1,
    marginVertical: 4,
  },
  primaryBlock: {
    alignItems: 'center',
  },
  primaryValue: {
    fontFamily: typography.fontFamily.display,
    fontSize: 36,
    lineHeight: 40,
  },
  unitLabel: {
    ...statCardUnitText,
    marginTop: 2,
  },
  detailBlock: {
    marginTop: 12,
    alignItems: 'center',
    gap: 2,
  },
  detailLine: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  photoCard: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(242, 240, 236, 0.38)',
  },
  borderless: {
    borderWidth: 0,
  },
  photoText: {
    color: '#F2F0EC',
    textShadowColor: 'rgba(0, 0, 0, 0.48)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
