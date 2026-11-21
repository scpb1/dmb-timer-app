import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import type { EventsTimelineItem } from '@/utils/eventsTimeline';
import { getEventsTimelineVisualFillRatio } from '@/utils/eventsTimeline';
import { typography } from '@/theme/typography';

import { useMilestoneVizColors } from './useMilestoneVizColors';

const ITEM_MIN_HEIGHT = 48;
const VIRTUAL_ROW_HEIGHT = 58;
const VIRTUAL_LIST_THRESHOLD = 32;
const WRAP_PADDING_V = 4;
const DOT_SIZE = 12;
const ROW_PADDING_V = 9;

function dotVerticalBounds(state: EventsTimelineItem['state']): { top: number; height: number } {
  if (state === 'here') {
    return { top: ROW_PADDING_V + 11, height: 16 };
  }
  return { top: ROW_PADDING_V + 13, height: DOT_SIZE };
}

interface MilestonesSpineListProps {
  items: EventsTimelineItem[];
  photoBackground?: boolean;
}

function milestonesLayoutKey(items: EventsTimelineItem[]): string {
  return items.map((item) => `${item.id}:${item.state}`).join('|');
}

const MilestoneFlatRow = memo(function MilestoneFlatRow({
  item,
  index,
  count,
  fillRatio,
  photoBackground,
}: {
  item: EventsTimelineItem;
  index: number;
  count: number;
  fillRatio: number;
  photoBackground: boolean;
}) {
  const colors = useMilestoneVizColors(photoBackground);
  const isHere = item.state === 'here';
  const isPast = item.state === 'past';
  const lineColor =
    count <= 1 || index / Math.max(1, count - 1) <= fillRatio ? colors.accent : colors.unpassedFill;

  return (
    <View style={styles.flatRow}>
      <View style={[styles.flatLine, { backgroundColor: lineColor }]} />
      <View
        style={[
          styles.dot,
          styles.flatDot,
          {
            borderColor: isHere ? colors.primary : isPast ? colors.accent : colors.nodeBorder,
            backgroundColor:
              isPast || isHere ? colors.accent : photoBackground ? 'transparent' : colors.cardFill,
          },
          isHere && styles.dotHere,
          !isPast && !isHere && styles.dotFuture,
        ]}
      />
      <Text
        numberOfLines={1}
        style={[
          styles.title,
          { color: colors.primary },
          photoBackground && styles.photoText,
          !isPast && !isHere && styles.titleFuture,
        ]}
      >
        {item.title}
      </Text>
      <Text numberOfLines={1} style={[styles.sub, { color: colors.muted }]}>
        {item.subtitle}
      </Text>
    </View>
  );
});

export const MilestonesSpineList = memo(function MilestonesSpineList({
  items,
  photoBackground = false,
}: MilestonesSpineListProps) {
  const colors = useMilestoneVizColors(photoBackground);
  const fillRatio = getEventsTimelineVisualFillRatio(items);
  const timelineHeight = Math.max(120, items.length * ITEM_MIN_HEIGHT);
  const [spineMetrics, setSpineMetrics] = useState<{ top: number; height: number } | null>(null);
  const rowLayoutsRef = useRef<Map<number, number>>(new Map());
  const itemsLayoutKey = useMemo(() => milestonesLayoutKey(items), [items]);
  const [measureGeneration, setMeasureGeneration] = useState(0);

  useEffect(() => {
    rowLayoutsRef.current.clear();
    setSpineMetrics(null);
    setMeasureGeneration((generation) => generation + 1);
  }, [itemsLayoutKey]);

  const syncSpineFromRows = useCallback(() => {
    if (items.length === 0) {
      setSpineMetrics(null);
      return;
    }
    const rowLayouts = rowLayoutsRef.current;
    const firstRowY = rowLayouts.get(0);
    const lastRowY = rowLayouts.get(items.length - 1);
    if (firstRowY == null || lastRowY == null) {
      return;
    }
    const firstDot = dotVerticalBounds(items[0].state);
    const lastDot = dotVerticalBounds(items[items.length - 1].state);
    const top = firstRowY + firstDot.top;
    const bottom = lastRowY + lastDot.top + lastDot.height;
    setSpineMetrics({ top, height: Math.max(0, bottom - top) });
  }, [items]);

  const handleRowLayout = useCallback(
    (index: number, rowY: number) => {
      rowLayoutsRef.current.set(index, rowY);
      syncSpineFromRows();
    },
    [syncSpineFromRows],
  );

  const renderFlatRow = useCallback(
    ({ item, index }: { item: EventsTimelineItem; index: number }) => (
      <MilestoneFlatRow
        item={item}
        index={index}
        count={items.length}
        fillRatio={fillRatio}
        photoBackground={photoBackground}
      />
    ),
    [fillRatio, items.length, photoBackground],
  );

  if (items.length >= VIRTUAL_LIST_THRESHOLD) {
    return (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderFlatRow}
        style={styles.flatList}
        getItemLayout={(_data, index) => ({
          length: VIRTUAL_ROW_HEIGHT,
          offset: VIRTUAL_ROW_HEIGHT * index,
          index,
        })}
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
      />
    );
  }

  return (
    <View key={measureGeneration} style={[styles.wrap, { minHeight: timelineHeight }]}>
      {spineMetrics ? (
        <View
          style={[
            styles.spineTrack,
            {
              top: spineMetrics.top,
              height: spineMetrics.height,
              backgroundColor: colors.unpassedFill,
            },
          ]}
        >
          <View
            style={[
              styles.spineFill,
              { height: `${fillRatio * 100}%`, backgroundColor: colors.accent },
            ]}
          />
        </View>
      ) : null}

      {items.map((item, index) => {
        const isHere = item.state === 'here';
        const isPast = item.state === 'past';
        return (
          <View
            key={item.id}
            style={styles.row}
            onLayout={(event) => handleRowLayout(index, event.nativeEvent.layout.y)}
          >
            <View
              style={[
                styles.dot,
                {
                  borderColor: isHere
                    ? colors.primary
                    : isPast
                      ? colors.accent
                      : colors.nodeBorder,
                  backgroundColor:
                    isPast || isHere
                      ? colors.accent
                      : photoBackground
                        ? 'transparent'
                        : colors.cardFill,
                },
                isHere && styles.dotHere,
                !isPast && !isHere && styles.dotFuture,
              ]}
            />
            <Text
              style={[
                styles.title,
                { color: colors.primary },
                photoBackground && styles.photoText,
                !isPast && !isHere && styles.titleFuture,
              ]}
            >
              {item.title}
            </Text>
            <Text style={[styles.sub, { color: colors.muted }]}>{item.subtitle}</Text>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    paddingLeft: 28,
    paddingVertical: WRAP_PADDING_V,
    position: 'relative',
  },
  spineTrack: {
    position: 'absolute',
    left: 10,
    width: 3,
    borderRadius: 99,
    overflow: 'hidden',
  },
  spineFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    borderRadius: 99,
  },
  row: {
    paddingVertical: 9,
    paddingLeft: 14,
    minHeight: ITEM_MIN_HEIGHT,
  },
  dot: {
    position: 'absolute',
    left: -2,
    top: 13,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: 99,
    borderWidth: 2,
  },
  dotHere: {
    width: 16,
    height: 16,
    left: -4,
    top: 11,
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dotFuture: {
    opacity: 0.45,
  },
  title: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 14,
  },
  titleFuture: {
    opacity: 0.75,
  },
  sub: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  flatList: {
    width: '100%',
    maxHeight: 520,
  },
  flatRow: {
    height: VIRTUAL_ROW_HEIGHT,
    paddingLeft: 42,
    justifyContent: 'center',
  },
  flatLine: {
    position: 'absolute',
    left: 15,
    top: 0,
    bottom: 0,
    width: 3,
  },
  flatDot: {
    left: 10,
    top: 21,
  },
  photoText: {
    color: '#F2F0EC',
    textShadowColor: 'rgba(0, 0, 0, 0.48)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
