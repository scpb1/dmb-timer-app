import { useCallback, useEffect, useState } from 'react';
import { isBefore, startOfDay } from 'date-fns';

import { CONFIG_KEYS } from '@/types/config';
import { getConfig, setConfig } from '@/services/database';
import { registerMemoryCacheReset } from '@/services/memoryCaches';
import { logger } from '@/utils/logger';
import { parseStoredDate } from '@/utils/storedDate';
import { rescheduleAppNotifications } from '@/services/holidayNotifications';

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

const EMPTY_PROFILE: ProfileState = {
  isLoading: true,
  userName: '',
  partnerName: '',
  enlistmentDate: null,
  demobilizationDate: null,
};

/** Последние прочитанные имена/даты — чтобы настройки не вспыхивали пустыми полями. */
let profileSnapshot: ProfileState = EMPTY_PROFILE;

function rememberProfile(next: ProfileState) {
  profileSnapshot = next;
}

async function readProfile(): Promise<ProfileState> {
  const [userName, partnerName, enlistmentRaw, demobilizationRaw] = await Promise.all([
    getConfig(CONFIG_KEYS.USER_NAME),
    getConfig(CONFIG_KEYS.PARTNER_NAME),
    getConfig(CONFIG_KEYS.ENLISTMENT_DATE),
    getConfig(CONFIG_KEYS.DEMOBILIZATION_DATE),
  ]);

  return {
    isLoading: false,
    userName: userName ?? '',
    partnerName: partnerName ?? '',
    enlistmentDate: parseStoredDate(enlistmentRaw),
    demobilizationDate: parseStoredDate(demobilizationRaw),
  };
}

/** Прогреть снимок с главной, чтобы настройки открылись с уже заполненными полями. */
export async function warmProfileSnapshot(): Promise<void> {
  try {
    rememberProfile(await readProfile());
  } catch (error) {
    logger.error('Ошибка прогрева профиля', error);
  }
}

export function clearProfileSnapshot(): void {
  profileSnapshot = EMPTY_PROFILE;
}

registerMemoryCacheReset(clearProfileSnapshot);

/** Имена и даты службы — правка после онбординга */
export function useProfile(): UseProfileResult {
  const [state, setState] = useState<ProfileState>(profileSnapshot);

  const reload = useCallback(async () => {
    try {
      const next = await readProfile();
      rememberProfile(next);
      setState(next);
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
      setState((prev) => {
        const next = { ...prev, userName: nextUser, partnerName: nextPartner };
        rememberProfile(next);
        return next;
      });
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
      await Promise.all([
        setConfig(CONFIG_KEYS.ENLISTMENT_DATE, enlistment.toISOString()),
        setConfig(CONFIG_KEYS.DEMOBILIZATION_DATE, demobilization.toISOString()),
      ]);
      setState((prev) => {
        const next = {
          ...prev,
          enlistmentDate: enlistment,
          demobilizationDate: demobilization,
        };
        rememberProfile(next);
        return next;
      });
      void rescheduleAppNotifications().catch((error) => {
        logger.error('Не удалось обновить уведомления после сохранения дат', error);
      });
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
