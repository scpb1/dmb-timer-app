import { StyleSheet, Text, View } from 'react-native';

import { MilestonesChecklistMark } from '@/components/timer/milestones/MilestonesChecklistMark';
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
  const markOutline = photoBackground ? '#FFFFFF' : colors.primary;

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
      <Text style={[styles.heading, { color: colors.muted }]}>Армейские события</Text>
      {items.map((item, index) => {
        const isHere = item.state === 'here';
        const isFuture = !isHere && item.state === 'future';
        return (
          <View
            key={item.id}
            style={[
              styles.row,
              index > 0 && styles.rowBorder,
              isHere && { backgroundColor: colors.hereBg, borderTopColor: 'transparent' },
            ]}
          >
            <MilestonesChecklistMark
              state={item.state}
              photoBackground={photoBackground}
              outlineColor={markOutline}
            />
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
