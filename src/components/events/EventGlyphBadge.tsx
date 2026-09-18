import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { EventGlyph } from '@/utils/eventGlyphs';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface EventGlyphBadgeProps {
  glyph: EventGlyph;
}

export function EventGlyphBadge({ glyph }: EventGlyphBadgeProps) {
  const color = glyph.color ?? colors.light.text.primary;

  return (
    <View style={styles.badge} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {glyph.type === 'icon' ? (
        <MaterialCommunityIcons name={glyph.name} size={30} color={color} />
      ) : (
        <Text
          style={[
            styles.label,
            glyph.text.length > 4 && styles.labelCompact,
            { color },
          ]}
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
  label: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 15,
    letterSpacing: -0.3,
  },
  labelCompact: {
    fontSize: 12,
  },
});
