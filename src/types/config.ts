export const CONFIG_KEYS = {
  ONBOARDING_COMPLETED: 'onboarding_completed',
  USER_NAME: 'user_name',
  PARTNER_NAME: 'partner_name',
  ENLISTMENT_DATE: 'enlistment_date',
  DEMOBILIZATION_DATE: 'demobilization_date',
  PROGRESS_PERCENT: 'progress_percent',
  DAYS_PASSED: 'days_passed',
  DAYS_LEFT: 'days_left',
} as const;

export type ConfigKey = (typeof CONFIG_KEYS)[keyof typeof CONFIG_KEYS];
