import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MilestonesChecklistList } from '@/components/timer/milestones/MilestonesChecklistList';
import { MilestonesChipsList } from '@/components/timer/milestones/MilestonesChipsList';
import { MilestonesSpineList } from '@/components/timer/milestones/MilestonesSpineList';
import { TimerVizSummaryCard } from '@/components/timer/TimerVizSummaryCard';
import type { MilestonesLayout } from '@/types/timer';
import type { DisplayEvent } from '@/types/events';
import type { DisplayHoliday } from '@/types/holidays';
import type { ServiceProgress } from '@/utils/timerCalculations';
import { buildEventsTimelineItems } from '@/utils/eventsTimeline';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface TimerMilestonesTimelineDisplayProps {
  progress: ServiceProgress;
  startDate: Date;
  endDate: Date;
  decimalPlaces: number;
  photoBackground?: boolean;
  upcomingHeadline?: string | null;
  events: DisplayEvent[];
  holidays: DisplayHoliday[];
  layout: MilestonesLayout;
}

export function TimerMilestonesTimelineDisplay({
  progress,
  startDate,
  endDate,
  decimalPlaces,
  photoBackground = false,
  upcomingHeadline = null,
  events,
  holidays,
  layout: milestonesLayout,
}: TimerMilestonesTimelineDisplayProps) {
  const theme = useAppTheme();
  const items = useMemo(
    () =>
      buildEventsTimelineItems(events, holidays, { start: startDate, end: endDate }),
    [events, holidays, startDate, endDate],
  );

  const muted = photoBackground ? 'rgba(242, 240, 236, 0.78)' : theme.text.secondary;

  const list =
    items.length === 0 ? null : milestonesLayout === 'chips' ? (
      <MilestonesChipsList items={items} photoBackground={photoBackground} />
    ) : milestonesLayout === 'checklist' ? (
      <MilestonesChecklistList items={items} photoBackground={photoBackground} />
    ) : (
      <MilestonesSpineList items={items} photoBackground={photoBackground} />
    );

  return (
    <View style={styles.wrapper}>
      <TimerVizSummaryCard
        progress={progress}
        endDate={endDate}
        decimalPlaces={decimalPlaces}
        photoBackground={photoBackground}
        upcomingHeadline={upcomingHeadline}
      />

      {items.length === 0 ? (
        <Text style={[styles.empty, { color: muted }]}>
          Нет событий и праздников в выбранном периоде
        </Text>
      ) : (
        list
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: 16,
  },
  empty: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
