import { StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import type { EventGlyph } from '@/utils/eventGlyphs';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface EventGlyphBadgeProps {
  glyph: EventGlyph;
  compact?: boolean;
}

export function EventGlyphBadge({ glyph, compact = false }: EventGlyphBadgeProps) {
  const theme = useAppTheme();
  const color = glyph.color ?? theme.text.primary;
  const iconSize = compact ? 22 : glyph.type === 'icon' && glyph.size ? glyph.size : 30;

  return (
    <View
      style={[styles.badge, compact && styles.badgeCompact]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {glyph.type === 'icon' ? (
        glyph.set === 'feather' ? (
          <Feather name={glyph.name} size={iconSize} color={color} />
        ) : (
          <MaterialCommunityIcons name={glyph.name} size={iconSize} color={color} />
        )
      ) : (
        <Text
          style={[styles.label, compact && styles.labelCompact, { color }]}
          numberOfLines={1}
        >
          {glyph.text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 40,
    height: 40,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCompact: {
    width: 28,
    height: 28,
    marginRight: 0,
  },
  label: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 15,
    letterSpacing: -0.3,
  },
  labelCompact: {
    fontSize: 11,
  },
});
