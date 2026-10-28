import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { EventGlyphBadge } from '@/components/events/EventGlyphBadge';
import { SplitStarIcon, starIconVariantForName } from '@/components/events/SplitStarIcon';
import {
  EVENT_ICON_CATALOG,
  type CatalogIconName,
  type EventGlyph,
  type MaterialIconName,
} from '@/utils/eventGlyphs';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface IconPickerProps {
  value?: string;
  onChange: (icon: string | undefined) => void;
  autoGlyph?: EventGlyph;
  previewColor?: string;
  /** Белая иконка на заливке previewFillColor (призыв / дембель). */
  previewOnFill?: boolean;
  previewFillColor?: string;
}

function CatalogIconPreview({
  name,
  size,
  color,
}: {
  name: CatalogIconName;
  size: number;
  color: string;
}) {
  const starVariant = starIconVariantForName(name);
  if (starVariant) {
    return <SplitStarIcon size={size} color={color} variant={starVariant} />;
  }

  return <MaterialCommunityIcons name={name as MaterialIconName} size={size} color={color} />;
}

export function IconPicker({
  value,
  onChange,
  autoGlyph,
  previewColor,
  previewOnFill = false,
  previewFillColor,
}: IconPickerProps) {
  const theme = useAppTheme();
  const fillColor = previewFillColor ?? previewColor ?? theme.text.primary;
  const iconColor = previewOnFill ? '#FFFFFF' : (previewColor ?? theme.text.primary);
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
            <EventGlyphBadge
              glyph={autoGlyph}
              compact
              color={previewOnFill ? '#FFFFFF' : previewColor}
              backgroundColor={previewOnFill ? fillColor : undefined}
            />
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
              {previewOnFill ? (
                <View
                  style={[
                    styles.fillPreview,
                    { backgroundColor: fillColor },
                  ]}
                >
                  <CatalogIconPreview name={option.name} size={22} color={iconColor} />
                </View>
              ) : (
                <CatalogIconPreview name={option.name} size={22} color={iconColor} />
              )}
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
  fillPreview: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
