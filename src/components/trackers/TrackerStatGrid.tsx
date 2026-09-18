import { StyleSheet, Text, View } from 'react-native';

import type { TrackerStatItem } from '@/utils/trackerCalculations';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface TrackerStatGridProps {
  stats: TrackerStatItem[];
}

export function TrackerStatGrid({ stats }: TrackerStatGridProps) {
  return (
    <View style={styles.grid}>
      {stats.map((stat) => (
        <View key={stat.label} style={styles.card}>
          <Text style={styles.label}>{stat.label}</Text>
          <Text style={styles.value}>{stat.value}</Text>
          {stat.subValue ? <Text style={styles.subValue}>{stat.subValue}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 7,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
    minHeight: 88,
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    color: colors.light.text.secondary,
    marginBottom: 8,
  },
  value: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 20,
    color: colors.light.text.primary,
  },
  subValue: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    color: colors.light.text.secondary,
    marginTop: 4,
  },
});
