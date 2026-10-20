import { StyleSheet, Text, View } from 'react-native';

import type { EventsTimelineItem } from '@/utils/eventsTimeline';
import { layout } from '@/theme';
import { typography } from '@/theme/typography';

import { useMilestoneVizColors } from './useMilestoneVizColors';

interface MilestonesChecklistListProps {
  items: EventsTimelineItem[];
  photoBackground?: boolean;
}

export function MilestonesChecklistList({
  items,
  photoBackground = false,
}: MilestonesChecklistListProps) {
  const colors = useMilestoneVizColors(photoBackground);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardFill,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <Text style={[styles.heading, { color: colors.muted }]}>События и праздники</Text>
      {items.map((item, index) => {
        const isHere = item.state === 'here';
        const isPast = item.state === 'past';
        const isFuture = !isPast && !isHere;
        return (
          <View
            key={item.id}
            style={[
              styles.row,
              index > 0 && styles.rowBorder,
              isHere && { backgroundColor: colors.hereBg, borderTopColor: 'transparent' },
            ]}
          >
            <View
              style={[
                styles.mark,
                {
                  borderColor: colors.nodeBorder,
                  backgroundColor: photoBackground ? 'transparent' : colors.cardFill,
                },
                isPast && { backgroundColor: colors.accent, borderColor: colors.accent },
                isHere && {
                  borderColor: colors.primary,
                  backgroundColor: photoBackground ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.7)',
                },
                isFuture && { opacity: 0.55 },
              ]}
            >
              {isPast ? (
                <Text style={styles.markDone}>✓</Text>
              ) : isHere ? (
                <Text style={[styles.markHere, { color: colors.accent }]}>●</Text>
              ) : null}
            </View>
            <View style={[styles.body, isFuture && styles.bodyFuture]}>
              <Text
                style={[
                  styles.title,
                  { color: colors.primary },
                  photoBackground && styles.photoText,
                  isHere && { color: colors.accent },
                ]}
              >
                {item.title}
              </Text>
              <Text style={[styles.sub, { color: colors.muted }]}>{item.subtitle}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: layout.cardBorderRadius,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  heading: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 9,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(167, 154, 138, 0.35)',
  },
  mark: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markDone: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  markHere: {
    fontSize: 14,
    lineHeight: 16,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  bodyFuture: {
    opacity: 0.78,
  },
  title: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 14,
  },
  sub: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    marginTop: 1,
  },
  photoText: {
    color: '#F2F0EC',
    textShadowColor: 'rgba(0, 0, 0, 0.48)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
