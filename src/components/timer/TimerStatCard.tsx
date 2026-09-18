import { StyleSheet, Text, View } from 'react-native';

import type { StatCardDisplay } from '@/utils/timerCalculations';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface TimerStatCardProps {
  title: 'ПРОШЛО' | 'ОСТАЛОСЬ';
  display: StatCardDisplay | undefined;
  photoBackground?: boolean;
}

export function TimerStatCard({
  title,
  display,
  photoBackground = false,
}: TimerStatCardProps) {
  if (!display) {
    return null;
  }

  return (
    <View style={[styles.card, photoBackground && styles.photoCard]}>
      <Text style={[styles.title, photoBackground && styles.photoText]}>{title}</Text>

      <View style={styles.primaryBlock}>
        <Text style={[styles.primaryValue, photoBackground && styles.photoText]}>
          {display.primaryValue}
        </Text>
        <Text style={[styles.unitLabel, photoBackground && styles.photoText]}>
          {display.unitLabel}
        </Text>
      </View>

      <View style={styles.detailBlock}>
        {display.detailLines.map((line, index) => (
          <Text key={index} style={[styles.detailLine, photoBackground && styles.photoText]}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
  },
  title: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 18,
    color: colors.light.text.secondary,
    marginBottom: 16,
  },
  primaryBlock: {
    alignItems: 'center',
  },
  primaryValue: {
    fontFamily: typography.fontFamily.display,
    fontSize: 36,
    color: colors.light.text.primary,
    lineHeight: 40,
  },
  unitLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.secondary,
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
    color: colors.light.text.secondary,
    lineHeight: 18,
  },
  photoCard: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(242, 240, 236, 0.38)',
  },
  photoText: {
    color: '#F2F0EC',
    textShadowColor: 'rgba(0, 0, 0, 0.48)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
