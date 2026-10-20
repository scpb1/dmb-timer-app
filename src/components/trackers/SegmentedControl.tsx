import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useColorTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  compact = false,
}: SegmentedControlProps<T>) {
  const { theme, colors: palette } = useColorTheme();
  const activeFill = theme.scheme === 'light' ? 'rgba(255, 255, 255, 0.75)' : palette.overlay.muted;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.overlay.fill,
          borderColor: palette.overlay.border,
        },
      ]}
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <Pressable
            key={option.value}
            style={[
              styles.segment,
              compact && styles.segmentCompact,
              isActive && { backgroundColor: activeFill },
            ]}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={option.label}
          >
            <Text
              style={[
                styles.label,
                { color: palette.text.secondary },
                compact && styles.labelCompact,
                isActive && [styles.labelActive, { color: palette.text.primary }],
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
  container: {
    flexDirection: 'row',
    borderRadius: 4,
    padding: 4,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 4,
  },
  segmentCompact: {
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
  },
  labelCompact: {
    fontSize: 13,
  },
  labelActive: {
    fontFamily: typography.fontFamily.sansBold,
  },
});
