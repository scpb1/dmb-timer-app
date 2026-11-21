import { addDays, format, isAfter, setHours, setMilliseconds, setMinutes, setSeconds, startOfDay } from 'date-fns';

export interface PlannedNotification {
  identifier: string;
  title: string;
  body: string;
  date: Date;
}

export interface NotificationScheduleRequest {
  identifier: string;
  content: { title: string; body: string; sound: boolean };
  trigger: { date: Date; channelId: string };
}

export interface LetterReminderTemplate {
  hour: number;
  minute: number;
  title: string;
  body: string;
}

function atTime(date: Date, hour: number, minute: number): Date {
  return setMilliseconds(setSeconds(setMinutes(setHours(startOfDay(date), hour), minute), 0), 0);
}

/** Будущие срабатывания. Прошедшее время в список не попадает. */
export function dueNotificationRequests(
  items: PlannedNotification[],
  now: Date,
  channelId: string,
  hour: number,
  minute: number,
): NotificationScheduleRequest[] {
  return items.flatMap((item) => {
    const fireAt = atTime(item.date, hour, minute);
    if (!isAfter(fireAt, now)) {
      return [];
    }
    return [
      {
        identifier: item.identifier,
        content: { title: item.title, body: item.body, sound: true },
        trigger: { date: fireAt, channelId },
      },
    ];
  });
}

/** Напоминания «написать письмо» на ближайшие дни, кроме уже написанных. */
export function letterReminderRequests(
  now: Date,
  writtenDates: ReadonlySet<string>,
  reminders: readonly LetterReminderTemplate[],
  days: number,
  channelId: string,
  idPrefix: string,
): NotificationScheduleRequest[] {
  const requests: NotificationScheduleRequest[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    const day = addDays(startOfDay(now), offset);
    const stamp = format(day, 'yyyy-MM-dd');
    if (writtenDates.has(stamp)) {
      continue;
    }
    for (const reminder of reminders) {
      const fireAt = atTime(day, reminder.hour, reminder.minute);
      if (!isAfter(fireAt, now)) {
        continue;
      }
      requests.push({
        identifier: `${idPrefix}${stamp}:${reminder.hour}`,
        content: { title: reminder.title, body: reminder.body, sound: true },
        trigger: { date: fireAt, channelId },
      });
    }
  }
  return requests;
}

interface ScheduledId {
  identifier: string;
}

interface NotificationScheduler {
  getAllScheduledNotificationsAsync: () => Promise<ScheduledId[]>;
  cancelScheduledNotificationAsync: (identifier: string) => Promise<void>;
  scheduleNotificationAsync: (request: NotificationScheduleRequest) => Promise<string>;
}

/** Снимает свои уведомления и ставит новый список через переданный API. */
export async function replaceScheduledNotifications(
  api: NotificationScheduler,
  isOwnId: (identifier: string) => boolean,
  requests: NotificationScheduleRequest[],
): Promise<void> {
  const scheduled = await api.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => isOwnId(item.identifier))
      .map((item) => api.cancelScheduledNotificationAsync(item.identifier)),
  );
  await Promise.all(requests.map((request) => api.scheduleNotificationAsync(request)));
}
