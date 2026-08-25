export const CONFIG_KEYS = {
  ONBOARDING_COMPLETED: 'onboarding_completed',
  USER_NAME: 'user_name',
  PARTNER_NAME: 'partner_name',
  ENLISTMENT_DATE: 'enlistment_date',
  DEMOBILIZATION_DATE: 'demobilization_date',
  PROGRESS_PERCENT: 'progress_percent',
  DAYS_PASSED: 'days_passed',
  DAYS_LEFT: 'days_left',
  TIMER_TYPE: 'timer_type',
  PROGRESS_BAR_MODE: 'progress_bar_mode',
  PERCENT_DECIMAL_PLACES: 'percent_decimal_places',
  TIMER_CENTER_DISPLAY: 'timer_center_display',
} as const;

export type ConfigKey = (typeof CONFIG_KEYS)[keyof typeof CONFIG_KEYS];
