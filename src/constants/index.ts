export { FEATURES } from './features';

export const APP_NAME = 'Счётчик ДДД';

export const DEFAULT_LOCALE = 'ru-RU';

export const AUTO_LOCK_TIMEOUT_MS = 60_000;

export const DB_TRANSACTION_TIMEOUT_MS = 15;

/** Срок службы: дембель = призыв + N календарных дней. */
export const SERVICE_DURATION_PRESETS = [
  { days: 365, label: '365 дней' },
  { days: 547, label: '547 дней' },
] as const;
