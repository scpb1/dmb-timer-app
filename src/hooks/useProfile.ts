import { useCallback, useEffect, useState } from 'react';
import { isBefore, parseISO, startOfDay } from 'date-fns';

import { CONFIG_KEYS } from '@/types/config';
import { getConfig, setConfig } from '@/services/database';
import { logger } from '@/utils/logger';
import { rescheduleHolidayNotifications } from '@/services/holidayNotifications';

interface ProfileState {
  isLoading: boolean;
  userName: string;
  partnerName: string;
  enlistmentDate: Date | null;
  demobilizationDate: Date | null;
}

interface UseProfileResult extends ProfileState {
  reload: () => Promise<void>;
  saveNames: (userName: string, partnerName: string) => Promise<boolean>;
  saveDates: (enlistmentDate: Date, demobilizationDate: Date) => Promise<string | null>;
}

function parseStoredDate(raw: string | null): Date | null {
  if (!raw) {
    return null;
  }
  const parsed = parseISO(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Имена и даты службы — правка после онбординга */
export function useProfile(): UseProfileResult {
  const [state, setState] = useState<ProfileState>({
    isLoading: true,
    userName: '',
    partnerName: '',
    enlistmentDate: null,
    demobilizationDate: null,
  });

  const reload = useCallback(async () => {
    try {
      const [userName, partnerName, enlistmentRaw, demobilizationRaw] = await Promise.all([
        getConfig(CONFIG_KEYS.USER_NAME),
        getConfig(CONFIG_KEYS.PARTNER_NAME),
        getConfig(CONFIG_KEYS.ENLISTMENT_DATE),
        getConfig(CONFIG_KEYS.DEMOBILIZATION_DATE),
      ]);

      setState({
        isLoading: false,
        userName: userName ?? '',
        partnerName: partnerName ?? '',
        enlistmentDate: parseStoredDate(enlistmentRaw),
        demobilizationDate: parseStoredDate(demobilizationRaw),
      });
    } catch (error) {
      logger.error('Ошибка загрузки профиля', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveNames = useCallback(async (userName: string, partnerName: string) => {
    const nextUser = userName.trim();
    const nextPartner = partnerName.trim();
    if (!nextUser || !nextPartner) {
      return false;
    }

    try {
      await setConfig(CONFIG_KEYS.USER_NAME, nextUser);
      await setConfig(CONFIG_KEYS.PARTNER_NAME, nextPartner);
      setState((prev) => ({ ...prev, userName: nextUser, partnerName: nextPartner }));
      return true;
    } catch (error) {
      logger.error('Ошибка сохранения имён', error);
      return false;
    }
  }, []);

  const saveDates = useCallback(async (enlistmentDate: Date, demobilizationDate: Date) => {
    const enlistment = startOfDay(enlistmentDate);
    const demobilization = startOfDay(demobilizationDate);

    if (!isBefore(enlistment, demobilization)) {
      return 'Дата дембеля должна быть позже даты призыва';
    }

    try {
      await setConfig(CONFIG_KEYS.ENLISTMENT_DATE, enlistment.toISOString());
      await setConfig(CONFIG_KEYS.DEMOBILIZATION_DATE, demobilization.toISOString());
      setState((prev) => ({
        ...prev,
        enlistmentDate: enlistment,
        demobilizationDate: demobilization,
      }));
      await rescheduleHolidayNotifications();
      return null;
    } catch (error) {
      logger.error('Ошибка сохранения дат', error);
      return 'Не удалось сохранить даты';
    }
  }, []);

  return {
    ...state,
    reload,
    saveNames,
    saveDates,
  };
}
