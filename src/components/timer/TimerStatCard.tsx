import { StyleSheet, Text, View } from 'react-native';

import {
  solidWhiteStatCard,
  solidWhiteStatCardColors,
  elapsedRemainingLabel,
  isElapsedRemainingLabel,
  statCardUnitText,
} from '@/components/timer/timerStatCardStyles';
import type { StatCardDisplay } from '@/utils/timerCalculations';
import { timerPhotoTextStyles } from '@/components/timer/timerPhotoStyles';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface TimerStatCardProps {
  title: 'прошло' | 'осталось';
  display: StatCardDisplay | undefined;
  photoBackground?: boolean;
  showBorder?: boolean;
  solidWhite?: boolean;
}

export function TimerStatCard({
  title,
  display,
  photoBackground = false,
  showBorder = true,
  solidWhite = false,
}: TimerStatCardProps) {
  const theme = useAppTheme();
  if (!display) {
    return null;
  }

  const microCaps = isElapsedRemainingLabel(title);
  const onPhoto = photoBackground && !solidWhite;
  const mutedColor = solidWhite ? solidWhiteStatCardColors.muted : theme.text.secondary;
  const inkColor = solidWhite ? solidWhiteStatCardColors.ink : theme.text.primary;

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
      <Text
        style={[
          microCaps ? elapsedRemainingLabel.label : styles.phaseTitle,
          { color: solidWhite && !microCaps ? inkColor : mutedColor },
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

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 4,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  phaseTitle: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 18,
    marginBottom: 16,
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
    marginTop: 16,
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
