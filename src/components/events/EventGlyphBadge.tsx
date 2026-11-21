import {
  Entypo,
  Feather,
  FontAwesome,
  FontAwesome6,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { SplitStarIcon, starIconVariantForName } from '@/components/events/SplitStarIcon';
import {
  SPLIT_STAR_ICON_ID,
  type CatalogIconSet,
  type EntypoIconName,
  type EventGlyph,
  type FeatherIconName,
  type FontAwesome6IconName,
  type FontAwesomeIconName,
  type MaterialIconName,
  type MaterialIconsName,
} from '@/utils/eventGlyphs';
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

function VectorGlyph({
  set,
  name,
  size,
  color,
}: {
  set?: Exclude<CatalogIconSet, 'custom'>;
  name: string;
  size: number;
  color: string;
}) {
  switch (set) {
    case 'feather':
      return <Feather name={name as FeatherIconName} size={size} color={color} />;
    case 'fontawesome':
      return <FontAwesome name={name as FontAwesomeIconName} size={size} color={color} />;
    case 'fontawesome6':
      return <FontAwesome6 name={name as FontAwesome6IconName} size={size} color={color} />;
    case 'materialIcons':
      return <MaterialIcons name={name as MaterialIconsName} size={size} color={color} />;
    case 'entypo':
      return <Entypo name={name as EntypoIconName} size={size} color={color} />;
    default:
      return <MaterialCommunityIcons name={name as MaterialIconName} size={size} color={color} />;
  }
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
  const baseSize =
    iconSizeOverride ??
    (compact ? 22 : glyph.type === 'icon' && glyph.size ? glyph.size : 30);
  const iconSize =
    glyph.type === 'icon' && glyph.scale ? Math.round(baseSize * glyph.scale) : baseSize;

  const wrapStyle = opacity !== undefined ? { opacity } : undefined;
  const starVariant =
    glyph.type === 'custom' && glyph.id === SPLIT_STAR_ICON_ID
      ? 'split'
      : glyph.type === 'icon' && (!glyph.set || glyph.set === 'material')
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
        <VectorGlyph set={glyph.set} name={glyph.name} size={iconSize} color={color} />
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
