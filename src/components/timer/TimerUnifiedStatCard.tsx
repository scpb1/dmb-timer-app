import { StyleSheet, Text, View } from 'react-native';

import type { StatCardDisplay } from '@/utils/timerCalculations';
import { timerPhotoTextStyles } from '@/components/timer/timerPhotoStyles';
import {
  solidWhiteStatCard,
  solidWhiteStatCardColors,
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
  solidWhite?: boolean;
}

function StatColumn({
  title,
  display,
  photoBackground,
  solidWhite,
}: {
  title: string;
  display: StatCardDisplay;
  photoBackground: boolean;
  solidWhite: boolean;
}) {
  const theme = useAppTheme();
  const onPhoto = photoBackground && !solidWhite;
  const mutedColor = solidWhite ? solidWhiteStatCardColors.muted : theme.text.secondary;
  const inkColor = solidWhite ? solidWhiteStatCardColors.ink : theme.text.primary;

  return (
    <View style={styles.column}>
      <Text
        style={[
          elapsedRemainingLabel.label,
          { color: mutedColor },
          onPhoto && styles.photoText,
        ]}
      >
        {title}
      </Text>

      <View style={styles.primaryBlock}>
        <Text
          style={[
            styles.primaryValue,
            { color: inkColor },
            onPhoto && timerPhotoTextStyles.heroNumber,
          ]}
        >
          {display.primaryValue}
        </Text>
        <Text
          style={[
            styles.unitLabel,
            { color: mutedColor },
            onPhoto && styles.photoText,
          ]}
        >
          {display.unitLabel}
        </Text>
      </View>

      {display.detailLines.length > 0 ? (
        <View style={styles.detailBlock}>
          {display.detailLines.map((line, index) => (
            <Text
              key={index}
              style={[
                styles.detailLine,
                { color: mutedColor },
                onPhoto && styles.photoText,
              ]}
            >
              {line}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Одна плашка «прошло | осталось» (прототип Q) */
export function TimerUnifiedStatCard({
  elapsed,
  remaining,
  photoBackground = false,
  showBorder = true,
  solidWhite = false,
}: TimerUnifiedStatCardProps) {
  const theme = useAppTheme();
  const onPhoto = photoBackground && !solidWhite;
  const dividerColor = solidWhite
    ? 'rgba(28, 25, 23, 0.12)'
    : onPhoto
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
        onPhoto && styles.photoCard,
        !showBorder && styles.borderless,
        solidWhite && solidWhiteStatCard.card,
      ]}
    >
      <StatColumn
        title="прошло"
        display={elapsed}
        photoBackground={photoBackground}
        solidWhite={solidWhite}
      />
      <View style={[styles.divider, { backgroundColor: dividerColor }]} />
      <StatColumn
        title="осталось"
        display={remaining}
        photoBackground={photoBackground}
        solidWhite={solidWhite}
      />
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
