import {
  dueNotificationRequests,
  letterReminderRequests,
  replaceScheduledNotifications,
  type NotificationScheduleRequest,
} from '@/services/notifications/notificationPlan';

const request: NotificationScheduleRequest = {
  identifier: 'own-next',
  content: { title: 'Завтра', body: 'текст', sound: true },
  trigger: { date: new Date('2026-01-16T00:00:00.000Z'), channelId: 'letters' },
};

describe('план уведомлений', () => {
  const now = new Date('2026-01-15T12:00:00.000Z');

  it('пропускает время, которое уже прошло', () => {
    expect(
      dueNotificationRequests(
        [
          {
            identifier: 'past',
            title: 'Сегодня',
            body: 'уже',
            date: new Date('2026-01-15T00:00:00.000Z'),
          },
        ],
        now,
        'holidays',
        0,
        0,
      ),
    ).toEqual([]);
  });

  it('не ставит напоминание на день, где письмо уже есть', () => {
    const requests = letterReminderRequests(
      now,
      new Set(['2026-01-16']),
      [{ hour: 21, minute: 0, title: 'Письмо', body: 'напиши' }],
      2,
      'letters',
      'letter:',
    );
    expect(requests.map((item) => item.identifier)).toEqual(['letter:2026-01-15:21']);
  });

  it('снимает только свои уведомления и ставит новый список', async () => {
    const cancelled: string[] = [];
    const scheduled: string[] = [];
    await replaceScheduledNotifications(
      {
        getAllScheduledNotificationsAsync: async () => [
          { identifier: 'own-old' },
          { identifier: 'foreign' },
        ],
        cancelScheduledNotificationAsync: async (identifier) => {
          cancelled.push(identifier);
        },
        scheduleNotificationAsync: async (item) => {
          scheduled.push(item.identifier);
          return item.identifier;
        },
      },
      (identifier) => identifier.startsWith('own'),
      [request],
    );
    expect(cancelled).toEqual(['own-old']);
    expect(scheduled).toEqual(['own-next']);
  });

  it('пустой список снимает свои и ничего не ставит', async () => {
    const cancelled: string[] = [];
    const scheduled: string[] = [];
    await replaceScheduledNotifications(
      {
        getAllScheduledNotificationsAsync: async () => [{ identifier: 'own-old' }],
        cancelScheduledNotificationAsync: async (identifier) => {
          cancelled.push(identifier);
        },
        scheduleNotificationAsync: async () => {
          scheduled.push('nope');
          return 'nope';
        },
      },
      (identifier) => identifier.startsWith('own'),
      [],
    );
    expect(cancelled).toEqual(['own-old']);
    expect(scheduled).toEqual([]);
  });
});
