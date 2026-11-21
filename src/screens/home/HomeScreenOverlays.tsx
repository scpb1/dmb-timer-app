import type { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';

import { LetterBookExportModal } from '@/components/diary/LetterBookExportModal';
import { ArmyEventsChecklistShareCard } from '@/components/timer/ArmyEventsChecklistShareCard';
import { ExtraTimerFormModal } from '@/components/timer/ExtraTimerFormModal';
import { ServiceSummaryModal } from '@/components/timer/ServiceSummaryModal';
import { TimerShareCard } from '@/components/timer/TimerShareCard';
import type { CustomTimerInput } from '@/hooks/useServiceTimer';
import type { CustomTimerRecord, TimerSettings } from '@/types/timer';
import type { ActiveTimer } from '@/types/timer';
import type { CenterDisplayValues, ServiceProgress, TimeBreakdown } from '@/utils/timerCalculations';
import type { EventGlyph } from '@/utils/eventGlyphs';
import type { TimerUpcomingItem } from '@/utils/timerUpcoming';
import type { DisplayEvent } from '@/types/events';
import type { DisplayHoliday } from '@/types/holidays';
import type { EventsTimelineItem } from '@/utils/eventsTimeline';

interface HomeScreenOverlaysProps {
  timerModalVisible: boolean;
  editingTimer: CustomTimerRecord | null;
  onCloseTimerModal: () => void;
  onSaveTimer: (input: CustomTimerInput) => Promise<boolean>;
  onDeleteTimer?: () => Promise<void>;
  summaryVisible: boolean;
  partnerName: string;
  enlistmentDate: Date | null;
  demobilizationDate: Date | null;
  onCloseSummary: () => void;
  onOpenLetterBook: () => void;
  letterBookVisible: boolean;
  onCloseLetterBook: () => void;
  isSharingArmyChecklist: boolean;
  armyChecklistShareItems: EventsTimelineItem[];
  shareWidth: number;
  shareHeight: number;
  armyChecklistShareRef: RefObject<View>;
  settings: TimerSettings;
  armyChecklistShowDates: boolean;
  isSharing: boolean;
  activeTimer: ActiveTimer | null;
  progress: ServiceProgress | null;
  centerDisplay: CenterDisplayValues | null;
  passedBreakdown: TimeBreakdown | null;
  remainingBreakdown: TimeBreakdown | null;
  shareRef: RefObject<View>;
  frameUpcoming: TimerUpcomingItem | null;
  frameUpcomingGlyph: EventGlyph | null;
  upcoming: TimerUpcomingItem | null;
  upcomingGlyph: EventGlyph | null;
  showStatCards: boolean;
  timelineEvents: DisplayEvent[];
  timelineHolidays: DisplayHoliday[];
  timelineDefaultListEventIds: string[];
  timelineUpcoming: TimerUpcomingItem | null;
}

/** Модалки главной и скрытые карточки, из которых собирается картинка для шаринга. */
export function HomeScreenOverlays(props: HomeScreenOverlaysProps) {
  return (
    <>
      <ExtraTimerFormModal
        visible={props.timerModalVisible}
        timer={props.editingTimer}
        onClose={props.onCloseTimerModal}
        onSave={props.onSaveTimer}
        onDelete={props.onDeleteTimer}
      />

      <ServiceSummaryModal
        visible={props.summaryVisible}
        partnerName={props.partnerName}
        enlistmentDate={props.enlistmentDate}
        demobilizationDate={props.demobilizationDate}
        onClose={props.onCloseSummary}
        onOpenLetterBook={props.onOpenLetterBook}
      />

      <LetterBookExportModal visible={props.letterBookVisible} onClose={props.onCloseLetterBook} />

      {props.isSharingArmyChecklist && props.armyChecklistShareItems.length > 0 ? (
        <View
          pointerEvents="none"
          style={[styles.sharePoster, { width: props.shareWidth, height: props.shareHeight }]}
          collapsable={false}
        >
          <View
            ref={props.armyChecklistShareRef}
            collapsable={false}
            style={{ width: props.shareWidth, height: props.shareHeight }}
          >
            <ArmyEventsChecklistShareCard
              width={props.shareWidth}
              height={props.shareHeight}
              settings={props.settings}
              items={props.armyChecklistShareItems}
              showEventDates={props.armyChecklistShowDates}
            />
          </View>
        </View>
      ) : null}

      {props.isSharing &&
      props.activeTimer &&
      props.progress &&
      props.centerDisplay &&
      props.passedBreakdown &&
      props.remainingBreakdown ? (
        <View
          pointerEvents="none"
          style={[styles.sharePoster, { width: props.shareWidth, height: props.shareHeight }]}
          collapsable={false}
        >
          <View
            ref={props.shareRef}
            collapsable={false}
            style={{ width: props.shareWidth, height: props.shareHeight }}
          >
            <TimerShareCard
              width={props.shareWidth}
              height={props.shareHeight}
              settings={props.settings}
              activeTimer={props.activeTimer}
              progress={props.progress}
              centerDisplay={props.centerDisplay}
              passedBreakdown={props.passedBreakdown}
              remainingBreakdown={props.remainingBreakdown}
              frameUpcoming={props.frameUpcoming}
              frameUpcomingGlyph={props.frameUpcomingGlyph}
              upcoming={props.upcoming}
              upcomingGlyph={props.upcomingGlyph}
              showStatCards={props.showStatCards}
              timelineEvents={props.timelineEvents}
              timelineHolidays={props.timelineHolidays}
              timelineDefaultListEventIds={props.timelineDefaultListEventIds}
              timelineUpcoming={props.timelineUpcoming}
            />
          </View>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  sharePoster: {
    position: 'absolute',
    top: 0,
    left: -100000,
    zIndex: -1,
  },
});
