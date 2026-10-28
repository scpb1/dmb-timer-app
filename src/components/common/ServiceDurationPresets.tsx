import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SERVICE_DURATION_PRESETS } from '@/constants';
import { colors, useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import type { ThemeMode } from '@/types/onboarding';

interface ServiceDurationPresetsProps {
  onSelect: (days: number) => void;
  themeMode?: ThemeMode;
}

/** Кнопки «365 / 547 дней» рядом с пикером дембеля */
export function ServiceDurationPresets({
  onSelect,
  themeMode,
}: ServiceDurationPresetsProps) {
  const appTheme = useAppTheme();
  const theme = themeMode ? colors[themeMode] : appTheme;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.caption, { color: theme.text.secondary }]}>
        или срок от даты призыва
      </Text>
      <View style={styles.row}>
        {SERVICE_DURATION_PRESETS.map((preset) => (
          <Pressable
            key={preset.days}
            style={[
              styles.chip,
              {
                borderColor: theme.overlay.border,
                backgroundColor: theme.overlay.fill,
              },
            ]}
            onPress={() => onSelect(preset.days)}
            accessibilityRole="button"
            accessibilityLabel={preset.label}
          >
            <Text style={[styles.label, { color: theme.text.primary }]}>{preset.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 10,
    marginBottom: 8,
  },
  caption: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  label: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 15,
  },
});
