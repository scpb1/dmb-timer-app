import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DropdownOption } from '@/components/common/SettingsDropdown';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface SettingsSegmentedProps<T extends string | number> {
  label: string;
  value: T;
  options?: DropdownOption<T>[];
  /** Явная раскладка по рядам (например «Прямой шток» отдельно, «Плитки» + «Чеклист») */
  optionRows?: DropdownOption<T>[][];
  onChange: (value: T) => void;
  /** Несколько рядов (знаки после запятой, длинный список закреплений) */
  wrap?: boolean;
  /** Равная ширина сегментов в ряду */
  equalWidth?: boolean;
  /** Компактнее — один ряд из многих сегментов (0–6) */
  compact?: boolean;
  hint?: string;
}

function SegmentButton<T extends string | number>({
  option,
  isSelected,
  onChange,
  equalWidth,
  wrap,
  compact,
  theme,
}: {
  option: DropdownOption<T>;
  isSelected: boolean;
  onChange: (value: T) => void;
  equalWidth: boolean;
  wrap: boolean;
  compact: boolean;
  theme: ReturnType<typeof useAppTheme>;
}) {
  return (
    <Pressable
      style={[
        styles.segment,
        compact && styles.segmentCompact,
        equalWidth && !wrap && styles.segmentEqual,
        wrap && styles.segmentWrap,
        {
          borderColor: theme.overlay.border,
          backgroundColor: theme.overlay.fill,
        },
        isSelected && {
          borderColor: theme.text.primary,
          backgroundColor: theme.overlay.muted,
        },
      ]}
      onPress={() => onChange(option.value)}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={option.label}
    >
      <Text
        style={[
          styles.segmentText,
          compact && styles.segmentTextCompact,
          { color: theme.text.primary },
          isSelected && { fontFamily: typography.fontFamily.sansBold },
        ]}
        numberOfLines={1}
      >
        {option.label}
      </Text>
    </Pressable>
  );
}

export function SettingsSegmented<T extends string | number>({
  label,
  value,
  options = [],
  optionRows,
  onChange,
  wrap = false,
  equalWidth = false,
  compact = false,
  hint,
}: SettingsSegmentedProps<T>) {
  const theme = useAppTheme();

  const rows = optionRows ?? [options];

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.text.secondary }]}>{label}</Text>
      <View style={optionRows ? styles.rowsStack : undefined}>
        {rows.map((rowOptions, rowIndex) => (
          <View
            key={rowIndex}
            style={[styles.row, wrap && styles.rowWrap, rowIndex > 0 && styles.rowGap]}
          >
            {rowOptions.map((option) => (
              <SegmentButton
                key={String(option.value)}
                option={option}
                isSelected={option.value === value}
                onChange={onChange}
                equalWidth={equalWidth || Boolean(optionRows)}
                wrap={wrap}
                compact={compact}
                theme={theme}
              />
            ))}
          </View>
        ))}
      </View>
      {hint ? (
        <Text style={[styles.hint, { color: theme.text.secondary }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 20,
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  rowWrap: {
    flexWrap: 'wrap',
  },
  rowsStack: {
    gap: 6,
  },
  rowGap: {
    marginTop: 0,
  },
  segment: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentEqual: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 6,
  },
  segmentWrap: {
    minWidth: '22%',
    flexGrow: 1,
    paddingHorizontal: 8,
  },
  segmentCompact: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  segmentText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    textAlign: 'center',
  },
  segmentTextCompact: {
    fontSize: 14,
  },
  hint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
});
