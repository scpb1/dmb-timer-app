import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import type { ParcelStatItem } from '@/utils/parcelCalculations';

interface ParcelStatGridProps {
  stats: ParcelStatItem[];
}

export function ParcelStatGrid({ stats }: ParcelStatGridProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.grid}>
      {stats.map((stat) => (
        <View
          key={stat.label}
          style={[
            styles.card,
            {
              backgroundColor: theme.overlay.fill,
              borderColor: theme.overlay.border,
            },
          ]}
        >
          <Text style={[styles.label, { color: theme.text.secondary }]}>{stat.label}</Text>
          <Text style={[styles.value, { color: theme.text.primary }]}>{stat.value}</Text>
          {stat.subValue ? (
            <Text style={[styles.subValue, { color: theme.text.secondary }]}>{stat.subValue}</Text>
          ) : null}
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
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    minHeight: 88,
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    marginBottom: 8,
  },
  value: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 20,
  },
  subValue: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    marginTop: 4,
  },
});
