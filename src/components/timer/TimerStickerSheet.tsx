import { StyleSheet, View } from 'react-native';

import { TimerStatCard } from '@/components/timer/TimerStatCard';
import { TimerUnifiedStatCard } from '@/components/timer/TimerUnifiedStatCard';
import { TimerUpcomingCard } from '@/components/timer/TimerUpcomingCard';
import type { EventGlyph } from '@/utils/eventGlyphs';
import type { StatCardMode, TimerPhase } from '@/types/timer';
import {
  getPhaseCardTitle,
  getServiceStatCardPair,
  getStatCardDisplay,
  type TimeBreakdown,
} from '@/utils/timerCalculations';
import type { TimerUpcomingItem } from '@/utils/timerUpcoming';

/** Тот же зазор, что у группы «событие + плашка» на таймере. */
const STICKER_GAP = 16;

interface TimerStickerSheetProps {
  includeEvent: boolean;
  item: TimerUpcomingItem | null;
  glyph: EventGlyph | null;
  omitDemobilizationCountdown: boolean;
  phase: TimerPhase;
  statCardMode: StatCardMode;
  kind: 'service' | 'custom';
  daysPassed: number;
  daysLeft: number;
  monthsPassed: number;
  monthDaysPassed: number;
  monthsLeft: number;
  monthDaysLeft: number;
  passed: TimeBreakdown;
  remaining: TimeBreakdown;
}

/** Белая плашка для PNG. Фон прозрачный, скругление остаётся у карточек. */
export function TimerStickerSheet({
  includeEvent,
  item,
  glyph,
  omitDemobilizationCountdown,
  phase,
  statCardMode,
  kind,
  daysPassed,
  daysLeft,
  monthsPassed,
  monthDaysPassed,
  monthsLeft,
  monthDaysLeft,
  passed,
  remaining,
}: TimerStickerSheetProps) {
  const progress = {
    phase,
    daysPassed,
    daysLeft,
    monthsPassed,
    monthDaysPassed,
    monthsLeft,
    monthDaysLeft,
  };
  const phaseBreakdown = phase === 'before' ? remaining : passed;
  const activeCards =
    phase === 'active'
      ? getServiceStatCardPair(progress, passed, remaining, statCardMode)
      : null;
  const showEvent = includeEvent && item != null && glyph != null;

  return (
    <View style={styles.sheet} collapsable={false}>
      {showEvent ? (
        <TimerUpcomingCard
          item={item}
          glyph={glyph}
          solidWhite
          showBorder={false}
          omitDemobilizationCountdown={omitDemobilizationCountdown}
        />
      ) : null}

      {activeCards ? (
        <TimerUnifiedStatCard
          elapsed={activeCards.elapsed}
          remaining={activeCards.remaining}
          solidWhite
          showBorder={false}
        />
      ) : (
        <TimerStatCard
          title={getPhaseCardTitle(phase, kind)}
          display={getStatCardDisplay(phaseBreakdown, statCardMode, { phase, kind, progress })}
          solidWhite
          showBorder={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    width: '100%',
    gap: STICKER_GAP,
    backgroundColor: 'transparent',
  },
});
