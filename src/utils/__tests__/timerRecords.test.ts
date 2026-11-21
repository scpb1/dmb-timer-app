import { SERVICE_TIMER_ID } from '@/types/timer';
import {
  buildTimerList,
  isTimerNotificationEnabled,
  parseCustomTimersStorage,
  pruneNotificationDisabledIds,
  resolveActiveTimer,
  withTimerNotificationEnabled,
} from '@/utils/timerRecords';

jest.mock('@/services/database', () => ({
  getConfig: jest.fn(),
  setConfig: jest.fn(),
}));

describe('timerRecords', () => {
  it('читает отключённые уведомления из хранилища', () => {
    const storage = parseCustomTimersStorage(
      JSON.stringify({
        timers: [
          {
            id: 'custom-1',
            name: 'Учебка',
            startDate: '2025-01-01T00:00:00.000Z',
            endDate: '2025-06-01T00:00:00.000Z',
          },
        ],
        notificationDisabledIds: ['custom-1', SERVICE_TIMER_ID],
      }),
    );

    expect(storage.timers).toHaveLength(1);
    expect(storage.notificationDisabledIds).toEqual(['custom-1', SERVICE_TIMER_ID]);
    expect(isTimerNotificationEnabled('custom-1', storage.notificationDisabledIds)).toBe(false);
    expect(isTimerNotificationEnabled('other', storage.notificationDisabledIds)).toBe(true);
  });

  it('переключает и подчищает id уведомлений', () => {
    const disabled = withTimerNotificationEnabled([], 'custom-1', false);
    expect(disabled).toEqual(['custom-1']);
    expect(withTimerNotificationEnabled(disabled, 'custom-1', true)).toEqual([]);
    expect(pruneNotificationDisabledIds(['custom-1', 'gone'], ['custom-1'])).toEqual(['custom-1']);
  });

  it('собирает основной и дополнительные таймеры', () => {
    const timers = buildTimerList(
      new Date(2025, 0, 1),
      new Date(2026, 0, 1),
      [
        {
          id: 'custom-1',
          name: 'Учебка',
          startDate: '2025-03-01T00:00:00.000Z',
          endDate: '2025-09-01T00:00:00.000Z',
        },
      ],
      'Петя',
    );

    expect(timers.map((timer) => timer.id)).toEqual([SERVICE_TIMER_ID, 'custom-1']);
    expect(timers[0]?.name).toBe('Петя');
  });

  it('выбирает активный дополнительный таймер', () => {
    const active = resolveActiveTimer(
      'custom-1',
      new Date(2025, 0, 1),
      new Date(2026, 0, 1),
      [
        {
          id: 'custom-1',
          name: 'Учебка',
          startDate: '2025-03-01T00:00:00.000Z',
          endDate: '2025-09-01T00:00:00.000Z',
        },
      ],
      'Петя',
    );

    expect(active?.id).toBe('custom-1');
    expect(active?.kind).toBe('custom');
  });
});
