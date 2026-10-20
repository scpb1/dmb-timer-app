import { useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { EventsTimelineItem } from '@/utils/eventsTimeline';
import {
  getEventsTimelineEventPosition,
  getEventsTimelineFillRatio,
} from '@/utils/eventsTimeline';
import { layout } from '@/theme';
import { typography } from '@/theme/typography';

import { useMilestoneVizColors } from './useMilestoneVizColors';

const CHIP_WIDTH = 108;

interface MilestonesChipsListProps {
  items: EventsTimelineItem[];
  photoBackground?: boolean;
}

export function MilestonesChipsList({ items, photoBackground = false }: MilestonesChipsListProps) {
  const colors = useMilestoneVizColors(photoBackground);
  const scrollRef = useRef<ScrollView>(null);
  const positions = useMemo(
    () => items.map((item) => getEventsTimelineEventPosition(items, item)),
    [items],
  );
  const fillRatio = getEventsTimelineFillRatio(items);
  const hereIndex = items.findIndex((item) => item.state === 'here');
  const scrollIndex =
    hereIndex >= 0 ? hereIndex : items.findIndex((item) => item.state === 'future');

  useEffect(() => {
    if (scrollIndex < 0) {
      return;
    }
    const offset = Math.max(0, scrollIndex * (CHIP_WIDTH + 8) - 40);
    scrollRef.current?.scrollTo({ x: offset, animated: false });
  }, [scrollIndex, items.length]);

  return (
    <View style={styles.wrap}>
      <View style={styles.trackRow} accessibilityElementsHidden>
        <View style={styles.track}>
          <View
            style={[
              styles.trackFill,
              { width: `${fillRatio * 100}%`, backgroundColor: colors.accent },
            ]}
          />
          {items.map((item, index) => {
            const isPast = item.state === 'past';
            const isHere = item.state === 'here';
            return (
              <View
                key={`tick-${item.id}`}
                style={[
                  styles.tick,
                  { left: `${positions[index] * 100}%` },
                  {
                    borderColor: colors.nodeBorder,
                    backgroundColor: photoBackground ? 'transparent' : colors.cardFill,
                  },
                  (isPast || isHere) && {
                    backgroundColor: colors.accent,
                    borderColor: colors.accent,
                  },
                  isHere && styles.tickHere,
                ]}
              />
            );
          })}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipTrack}
        snapToInterval={CHIP_WIDTH + 8}
        decelerationRate="fast"
      >
        {items.map((item, index) => {
          const isPast = item.state === 'past';
          const isHere = item.state === 'here';
          const isFuture = !isPast && !isHere;
          return (
            <View
              key={item.id}
              style={[
                styles.chip,
                {
                  backgroundColor: colors.cardFill,
                  borderColor: colors.cardBorder,
                },
                isPast && {
                  borderColor: 'rgba(229, 57, 53, 0.25)',
                  backgroundColor: photoBackground
                    ? 'rgba(229, 57, 53, 0.12)'
                    : 'rgba(229, 57, 53, 0.06)',
                },
                isHere && {
                  borderColor: 'rgba(229, 57, 53, 0.55)',
                  backgroundColor: photoBackground
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(255,255,255,0.62)',
                },
                isFuture && { opacity: 0.78 },
              ]}
            >
              {isHere ? (
                <Text style={[styles.chipPct, { color: colors.accent }]}>сегодня</Text>
              ) : (
                <Text style={[styles.chipPct, { color: colors.muted }]}>
                  {Math.round(positions[index] * 100)}%
                </Text>
              )}
              <Text
                style={[
                  styles.chipTitle,
                  { color: colors.primary },
                  photoBackground && styles.photoText,
                ]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
              <Text style={[styles.chipSub, { color: colors.muted }]} numberOfLines={2}>
                {item.subtitle}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      <Text style={[styles.hint, { color: colors.muted }]}>Свайп по карточкам событий</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  trackRow: {
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  track: {
    height: 10,
    position: 'relative',
    justifyContent: 'center',
    backgroundColor: 'rgba(167, 154, 138, 0.28)',
    borderRadius: 99,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: '50%',
    marginTop: -1.5,
    height: 3,
    borderRadius: 99,
    maxWidth: '100%',
  },
  tick: {
    position: 'absolute',
    top: '50%',
    width: 8,
    height: 8,
    marginTop: -4,
    marginLeft: -4,
    borderRadius: 99,
    borderWidth: 2,
  },
  tickHere: {
    width: 10,
    height: 10,
    marginTop: -5,
    marginLeft: -5,
    borderColor: '#3E3630',
  },
  chipTrack: {
    gap: 8,
    paddingHorizontal: 2,
  },
  chip: {
    width: CHIP_WIDTH,
    borderRadius: layout.cardBorderRadius,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  chipPct: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  chipTitle: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 13,
    lineHeight: 17,
  },
  chipSub: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 11,
    marginTop: 5,
    lineHeight: 14,
  },
  hint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
  photoText: {
    color: '#F2F0EC',
    textShadowColor: 'rgba(0, 0, 0, 0.48)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
