import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SupportCardFilter } from '@/types/support';
import { layout, useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

const OPTIONS: { value: SupportCardFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'term', label: 'Срок' },
  { value: 'bond', label: 'Связь' },
  { value: 'self', label: 'Я' },
];

interface SupportFilterProps {
  value: SupportCardFilter;
  onChange: (value: SupportCardFilter) => void;
}

export function SupportFilter({ value, onChange }: SupportFilterProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.overlay.fill,
          borderColor: theme.overlay.border,
        },
      ]}
    >
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.chip,
              active && { backgroundColor: theme.overlay.muted },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
          >
            <Text
              style={[
                styles.label,
                { color: active ? theme.text.primary : theme.text.secondary },
                active && styles.labelActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: layout.cardBorderRadius,
    borderWidth: 1,
    padding: 3,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: layout.cardBorderRadius,
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
  },
  labelActive: {
    fontFamily: typography.fontFamily.sansBold,
  },
});
