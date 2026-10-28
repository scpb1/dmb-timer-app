import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { SplitStarIcon, starIconVariantForName } from '@/components/events/SplitStarIcon';
import { SPLIT_STAR_ICON_ID, type EventGlyph } from '@/utils/eventGlyphs';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface EventGlyphBadgeProps {
  glyph: EventGlyph;
  compact?: boolean;
  iconSize?: number;
  /** Перекрывает цвет из глифа (например, белый на фото). */
  color?: string;
  /** Заливка плашки под иконкой (призыв / дембель). */
  backgroundColor?: string;
  opacity?: number;
}

export function EventGlyphBadge({
  glyph,
  compact = false,
  iconSize: iconSizeOverride,
  color: colorOverride,
  backgroundColor,
  opacity,
}: EventGlyphBadgeProps) {
  const theme = useAppTheme();
  const color = colorOverride ?? glyph.color ?? theme.text.primary;
  const iconSize =
    iconSizeOverride ??
    (compact ? 22 : glyph.type === 'icon' && glyph.size ? glyph.size : 30);

  const wrapStyle = opacity !== undefined ? { opacity } : undefined;
  const starVariant =
    glyph.type === 'custom' && glyph.id === SPLIT_STAR_ICON_ID
      ? 'split'
      : glyph.type === 'icon' && glyph.set !== 'feather'
        ? starIconVariantForName(glyph.name)
        : undefined;

  return (
    <View
      style={[
        styles.badge,
        compact && styles.badgeCompact,
        backgroundColor !== undefined && {
          backgroundColor,
          borderRadius: 6,
        },
        wrapStyle,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {starVariant ? (
        <SplitStarIcon size={iconSize} color={color} variant={starVariant} />
      ) : glyph.type === 'icon' ? (
        glyph.set === 'feather' ? (
          <Feather name={glyph.name} size={iconSize} color={color} />
        ) : (
          <MaterialCommunityIcons name={glyph.name} size={iconSize} color={color} />
        )
        ) : glyph.type === 'label' ? (
        <Text
          style={[styles.label, compact && styles.labelCompact, { color }]}
          numberOfLines={1}
        >
          {glyph.text}
        </Text>
      ) : null}
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
