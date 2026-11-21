import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import {
  getServiceSummaryAutoShownDate,
  isDemobilizationDay,
  markServiceSummaryAutoShown,
  shouldAutoOpenServiceSummary,
} from '@/utils/serviceSummary';
import { logger } from '@/utils/logger';

/**
 * Открывает итоги в календарный день дембеля:
 * первый заход в приложение за день и переход 23:59 → 00:00, если приложение уже открыто.
 */
export function useServiceSummaryAutoOpen(
  demobilizationDate: Date | null,
  onOpen: () => void,
): void {
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  const demobTime = demobilizationDate ? demobilizationDate.getTime() : null;
  const inFlightRef = useRef(false);
  const openedThisSessionRef = useRef(false);

  useEffect(() => {
    if (demobTime == null) {
      return;
    }

    const demobilization = new Date(demobTime);

    const tryOpen = async () => {
      if (openedThisSessionRef.current || inFlightRef.current) {
        return;
      }

      const now = new Date();
      if (!isDemobilizationDay(demobilization, now)) {
        return;
      }

      inFlightRef.current = true;
      try {
        const lastShown = await getServiceSummaryAutoShownDate();
        if (!shouldAutoOpenServiceSummary(demobilization, lastShown, now)) {
          openedThisSessionRef.current = true;
          return;
        }

        openedThisSessionRef.current = true;
        onOpenRef.current();

        try {
          await markServiceSummaryAutoShown(now);
        } catch (error) {
          logger.error('Не удалось запомнить автопоказ итогов', error);
        }
      } catch (error) {
        openedThisSessionRef.current = false;
        logger.error('Ошибка автопоказа итогов службы', error);
      } finally {
        inFlightRef.current = false;
      }
    };

    void tryOpen();

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const armMidnight = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const next = new Date();
      next.setHours(24, 0, 0, 0);
      timeoutId = setTimeout(() => {
        void tryOpen();
        armMidnight();
      }, Math.max(1000, next.getTime() - Date.now()));
    };
    armMidnight();

    const onAppStateChange = (status: AppStateStatus) => {
      if (status === 'active') {
        void tryOpen();
        armMidnight();
      }
    };
    const appStateSub = AppState.addEventListener('change', onAppStateChange);

    return () => {
      appStateSub.remove();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [demobTime]);
}
