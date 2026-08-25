import { StyleSheet, Text, View } from 'react-native';

import type { TimeBreakdown } from '@/utils/timerCalculations';
import { formatTimeBreakdownLines } from '@/utils/timerCalculations';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface TimerStatCardProps {
  title: 'ПРОШЛО' | 'ОСТАЛОСЬ';
  breakdown: TimeBreakdown;
}

export function TimerStatCard({ title, breakdown }: TimerStatCardProps) {
  const timeLines = formatTimeBreakdownLines(breakdown);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.daysBlock}>
        <Text style={styles.daysNumber}>{breakdown.days}</Text>
        <Text style={styles.daysLabel}>дней</Text>
      </View>

      <View style={styles.timeBlock}>
        {timeLines.map((line, index) => (
          <Text key={index} style={styles.timeLine}>
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
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
  },
  title: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.light.text.secondary,
    marginBottom: 16,
  },
  daysBlock: {
    alignItems: 'center',
  },
  daysNumber: {
    fontFamily: typography.fontFamily.display,
    fontSize: 36,
    color: colors.light.text.primary,
    lineHeight: 40,
  },
  daysLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.secondary,
    marginTop: 2,
  },
  timeBlock: {
    marginTop: 16,
    alignItems: 'center',
    gap: 2,
  },
  timeLine: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    color: colors.light.text.secondary,
    lineHeight: 18,
  },
});
