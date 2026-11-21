/** Имена папок в documentDirectory. Их же используют дневник, трекеры, песочница и фоны. */
export const DIARY_MEDIA_DIRECTORY = 'diary/';
export const CALL_AUDIO_DIRECTORY = 'tracker-calls/';
export const MEETING_MEDIA_DIRECTORY = 'tracker-meetings/';
export const SANDBOX_MEDIA_DIRECTORY = 'sandbox-media/';
export const TIMER_BACKGROUND_DIRECTORY = 'timer-background/';
export const WIDGET_BACKGROUND_DIRECTORY = 'widget-background/';

export const USER_MEDIA_DIRECTORIES = [
  DIARY_MEDIA_DIRECTORY,
  CALL_AUDIO_DIRECTORY,
  MEETING_MEDIA_DIRECTORY,
  SANDBOX_MEDIA_DIRECTORY,
  TIMER_BACKGROUND_DIRECTORY,
  WIDGET_BACKGROUND_DIRECTORY,
] as const;
