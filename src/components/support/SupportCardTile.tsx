import { Pressable, StyleSheet, Text } from 'react-native';

import type { SupportCard } from '@/types/support';
import { layout, useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface SupportCardTileProps {
  card: SupportCard;
  onPress: () => void;
}

export function SupportCardTile({ card, onPress }: SupportCardTileProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: theme.overlay.fill,
          borderColor: theme.overlay.border,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={card.title}
      accessibilityHint="Открыть карточку"
    >
      <Text style={[styles.title, { color: theme.text.primary }]} numberOfLines={4}>
        {card.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 132,
    borderRadius: layout.cardBorderRadius,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 16,
    justifyContent: 'flex-end',
  },
  title: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
    lineHeight: 22,
  },
});
