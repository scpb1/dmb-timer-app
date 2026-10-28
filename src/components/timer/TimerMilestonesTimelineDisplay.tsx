import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FEATURES } from '@/constants';
import { MilestonesChecklistList } from '@/components/timer/milestones/MilestonesChecklistList';
import { MilestonesChipsList } from '@/components/timer/milestones/MilestonesChipsList';
import { MilestonesSpineList } from '@/components/timer/milestones/MilestonesSpineList';
import { TimerVizSummaryCard } from '@/components/timer/TimerVizSummaryCard';
import type { MilestonesLayout } from '@/types/timer';
import type { DisplayEvent } from '@/types/events';
import type { DisplayHoliday } from '@/types/holidays';
import type { ServiceProgress } from '@/utils/timerCalculations';
import {
  buildDefaultEventsChecklistItems,
  buildEventsTimelineItems,
} from '@/utils/eventsTimeline';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface TimerMilestonesTimelineDisplayProps {
  progress: ServiceProgress;
  startDate: Date;
  endDate: Date;
  decimalPlaces: number;
  timerKind?: 'service' | 'custom';
  photoBackground?: boolean;
  upcomingHeadline?: string | null;
  events: DisplayEvent[];
  holidays: DisplayHoliday[];
  defaultListEventIds: string[];
  layout: MilestonesLayout;
  onDownloadArmyChecklist?: () => void;
  isDownloadingArmyChecklist?: boolean;
}

function resolveMilestonesLayout(layout: MilestonesLayout): 'spine' | 'checklist' | 'chips' {
  if (layout === 'chips' && !FEATURES.milestonesChipsLayout) {
    return 'spine';
  }
  return layout;
}

export function TimerMilestonesTimelineDisplay({
  progress,
  startDate,
  endDate,
  decimalPlaces,
  timerKind = 'service',
  photoBackground = false,
  upcomingHeadline = null,
  events,
  holidays,
  defaultListEventIds,
  layout: milestonesLayout,
  onDownloadArmyChecklist,
  isDownloadingArmyChecklist = false,
}: TimerMilestonesTimelineDisplayProps) {
  const theme = useAppTheme();
  const effectiveLayout = resolveMilestonesLayout(milestonesLayout);
  const range = useMemo(
    () => ({ start: startDate, end: endDate }),
    [startDate, endDate],
  );

  const spineItems = useMemo(
    () => buildEventsTimelineItems(events, holidays, range),
    [events, holidays, range],
  );

  const checklistItems = useMemo(
    () => buildDefaultEventsChecklistItems(events, defaultListEventIds, range),
    [events, defaultListEventIds, range],
  );

  const items = effectiveLayout === 'checklist' ? checklistItems : spineItems;

  const muted = photoBackground ? 'rgba(242, 240, 236, 0.78)' : theme.text.secondary;

  const list =
    items.length === 0 ? null : effectiveLayout === 'chips' ? (
      <MilestonesChipsList items={items} photoBackground={photoBackground} />
    ) : effectiveLayout === 'checklist' ? (
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
        timerKind={timerKind}
        photoBackground={photoBackground}
        dotGridUnitMode="days"
        upcomingHeadline={upcomingHeadline}
      />

      {items.length === 0 ? (
        <Text style={[styles.empty, { color: muted }]}>
          {effectiveLayout === 'checklist'
            ? 'Нет армейских событий в выбранном периоде'
            : 'Нет событий и праздников в выбранном периоде'}
        </Text>
      ) : (
        list
      )}

      {effectiveLayout === 'checklist' && onDownloadArmyChecklist ? (
        <Pressable
          style={[
            styles.downloadButton,
            photoBackground && styles.downloadButtonPhoto,
            isDownloadingArmyChecklist && styles.downloadButtonDisabled,
          ]}
          onPress={onDownloadArmyChecklist}
          disabled={isDownloadingArmyChecklist}
          accessibilityRole="button"
          accessibilityLabel="Скачать чеклист армейских событий"
        >
          <Text
            style={[
              styles.downloadButtonText,
              { color: theme.text.primary },
              photoBackground && styles.downloadButtonPhotoText,
            ]}
          >
            Скачать чеклист армейских событий
          </Text>
        </Pressable>
      ) : null}
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
  downloadButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
  },
  downloadButtonPhoto: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(242, 240, 236, 0.38)',
  },
  downloadButtonDisabled: {
    opacity: 0.55,
  },
  downloadButtonText: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 15,
    textAlign: 'center',
  },
  downloadButtonPhotoText: {
    color: '#F2F0EC',
    textShadowColor: 'rgba(0, 0, 0, 0.48)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
