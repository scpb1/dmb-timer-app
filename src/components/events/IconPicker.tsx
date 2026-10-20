import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { EventGlyphBadge } from '@/components/events/EventGlyphBadge';
import {
  EVENT_ICON_CATALOG,
  type EventGlyph,
  type MaterialIconName,
} from '@/utils/eventGlyphs';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface IconPickerProps {
  value?: string;
  onChange: (icon: string | undefined) => void;
  autoGlyph?: EventGlyph;
}

export function IconPicker({ value, onChange, autoGlyph }: IconPickerProps) {
  const theme = useAppTheme();
  const isAutoSelected = autoGlyph !== undefined && !value;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text.primary }]}>Иконка</Text>
      <View style={styles.grid}>
        {autoGlyph ? (
          <Pressable
            style={[
              styles.cell,
              {
                borderColor: theme.overlay.border,
                backgroundColor: theme.overlay.fill,
              },
              isAutoSelected && {
                borderColor: theme.text.primary,
                backgroundColor: theme.overlay.muted,
              },
            ]}
            onPress={() => onChange(undefined)}
            accessibilityRole="button"
            accessibilityLabel="Иконка по умолчанию"
            accessibilityState={{ selected: isAutoSelected }}
          >
            <EventGlyphBadge glyph={autoGlyph} compact />
          </Pressable>
        ) : null}

        {EVENT_ICON_CATALOG.map((option) => {
          const isActive = value === option.name;

          return (
            <Pressable
              key={option.name}
              style={[
                styles.cell,
                {
                  borderColor: theme.overlay.border,
                  backgroundColor: theme.overlay.fill,
                },
                isActive && {
                  borderColor: theme.text.primary,
                  backgroundColor: theme.overlay.muted,
                },
              ]}
              onPress={() => onChange(option.name)}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: isActive }}
            >
              <MaterialCommunityIcons
                name={option.name as MaterialIconName}
                size={22}
                color={theme.text.primary}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: 44,
    height: 44,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
