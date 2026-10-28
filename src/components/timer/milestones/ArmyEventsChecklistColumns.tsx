import { StyleSheet, Text, View } from 'react-native';

import { MilestonesChecklistMark } from '@/components/timer/milestones/MilestonesChecklistMark';
import type { EventsTimelineItem } from '@/utils/eventsTimeline';
import { formatEventDate } from '@/utils/eventCalculations';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface ArmyEventsChecklistColumnsProps {
  items: EventsTimelineItem[];
  photoBackground?: boolean;
  compact?: boolean;
  showEventDates?: boolean;
}

function splitIntoColumns<T>(items: T[]): [T[], T[]] {
  const splitAt = Math.ceil(items.length / 2);
  return [items.slice(0, splitAt), items.slice(splitAt)];
}

function ChecklistRow({
  item,
  photoBackground,
  compact,
  titleColor,
  subColor,
  accentColor,
  markOutline,
  showEventDates,
}: {
  item: EventsTimelineItem;
  photoBackground: boolean;
  compact: boolean;
  titleColor: string;
  subColor: string;
  accentColor: string;
  markOutline: string;
  showEventDates: boolean;
}) {
  const isHere = item.state === 'here';
  const isFuture = item.state === 'future';

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <MilestonesChecklistMark
        state={item.state}
        photoBackground={photoBackground}
        outlineColor={markOutline}
      />
      <View style={[styles.body, isFuture && styles.bodyFuture]}>
        <Text
          style={[
            styles.title,
            { color: isHere ? accentColor : titleColor },
            photoBackground && styles.photoText,
          ]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        {compact && showEventDates ? (
          <Text
            style={[
              styles.eventDate,
              { color: subColor },
              photoBackground && styles.photoSub,
            ]}
          >
            {formatEventDate(item.date)}
          </Text>
        ) : null}
        {!compact ? (
          <Text style={[styles.sub, { color: subColor }, photoBackground && styles.photoSub]}>
            {item.subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function ArmyEventsChecklistColumns({
  items,
  photoBackground = false,
  compact = false,
  showEventDates = false,
}: ArmyEventsChecklistColumnsProps) {
  const theme = useAppTheme();
  const titleColor = photoBackground ? '#F2F0EC' : theme.text.primary;
  const subColor = photoBackground ? 'rgba(242, 240, 236, 0.78)' : theme.text.secondary;
  const accentColor = photoBackground ? '#F2F0EC' : theme.text.accent;
  const markOutline = photoBackground ? '#FFFFFF' : theme.text.primary;
  const [left, right] = splitIntoColumns(items);

  const column = (columnItems: EventsTimelineItem[]) => (
    <View style={styles.column}>
      {columnItems.map((item) => (
        <ChecklistRow
          key={item.id}
          item={item}
          photoBackground={photoBackground}
          compact={compact}
          titleColor={titleColor}
          subColor={subColor}
          accentColor={accentColor}
          markOutline={markOutline}
          showEventDates={showEventDates}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.columns}>
      {column(left)}
      {column(right)}
    </View>
  );
}

const styles = StyleSheet.create({
  columns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
  },
  column: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  rowCompact: {
    gap: 6,
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
    fontSize: 13,
  },
  sub: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 11,
    marginTop: 1,
  },
  eventDate: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 10,
    marginTop: 2,
    opacity: 0.72,
  },
  photoText: {
    color: '#F2F0EC',
    textShadowColor: 'rgba(0, 0, 0, 0.48)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  photoSub: {
    color: 'rgba(242, 240, 236, 0.78)',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
