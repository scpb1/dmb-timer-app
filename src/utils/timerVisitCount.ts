import { CONFIG_KEYS } from '@/types/config';
import { getConfig, setConfig } from '@/services/database';

function parseVisitCount(raw: string | null): number {
  if (!raw) {
    return 0;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/** Сколько раз пользователь заходил на главный экран с таймером (каждый фокус вкладки +1). */
export async function getTimerVisitCount(): Promise<number> {
  const raw = await getConfig(CONFIG_KEYS.TIMER_HOME_VISIT_COUNT);
  return parseVisitCount(raw);
}

export async function incrementTimerVisitCount(): Promise<number> {
  const next = (await getTimerVisitCount()) + 1;
  await setConfig(CONFIG_KEYS.TIMER_HOME_VISIT_COUNT, String(next));
  return next;
}
