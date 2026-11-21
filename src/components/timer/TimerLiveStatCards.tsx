import { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { TimerStatCard } from '@/components/timer/TimerStatCard';
import { TimerUnifiedStatCard } from '@/components/timer/TimerUnifiedStatCard';
import type { StatCardMode, TimerPhase } from '@/types/timer';
import {
  getPhaseCardTitle,
  getServiceStatCardPair,
  getServiceTimeBreakdowns,
  getStatCardDisplay,
  type ServiceProgress,
} from '@/utils/timerCalculations';

interface TimerLiveStatCardsProps {
  startDate: Date | null;
  endDate: Date | null;
  progress: ServiceProgress | null;
  phase: TimerPhase;
  statCardMode: StatCardMode;
  timerKind: 'service' | 'custom';
  photoBackground: boolean;
  showBorder: boolean;
}

/** Секунды плашки живут здесь, чтобы сетка и лента вех не перерисовывались каждую секунду. */
export const TimerLiveStatCards = memo(function TimerLiveStatCards({
  startDate,
  endDate,
  progress,
  phase,
  statCardMode,
  timerKind,
  photoBackground,
  showBorder,
}: TimerLiveStatCardsProps) {
  const showsSeconds = statCardMode === 'days';
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!showsSeconds || !startDate || !endDate) {
      return;
    }
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, [endDate, showsSeconds, startDate]);

  const anchorKey = `${startDate?.getTime() ?? 0}:${endDate?.getTime() ?? 0}:${progress?.phase ?? ''}:${progress?.daysPassed ?? ''}`;
  const anchor = useMemo(() => new Date(anchorKey ? Date.now() : Date.now()), [anchorKey]);
  const moment = showsSeconds ? now : anchor;

  if (!progress || !startDate || !endDate) {
    return null;
  }

  const { passed, remaining } = getServiceTimeBreakdowns(startDate, endDate, moment);
  if (phase === 'active') {
    const pair = getServiceStatCardPair(progress, passed, remaining, statCardMode);
    return (
      <View style={styles.statsRow}>
        <TimerUnifiedStatCard
          elapsed={pair.elapsed}
          remaining={pair.remaining}
          photoBackground={photoBackground}
          showBorder={showBorder}
        />
      </View>
    );
  }

  const phaseBreakdown = phase === 'before' ? remaining : passed;
  return (
    <View style={styles.statsRow}>
      <TimerStatCard
        title={getPhaseCardTitle(phase, timerKind)}
        display={getStatCardDisplay(phaseBreakdown, statCardMode, {
          phase,
          kind: timerKind,
          progress,
        })}
        photoBackground={photoBackground}
        showBorder={showBorder}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
});
