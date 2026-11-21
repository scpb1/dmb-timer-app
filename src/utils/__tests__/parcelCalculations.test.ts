import { addDays, format, subDays } from 'date-fns';

import {
  DEFAULT_PARCEL_SETTINGS,
  type ParcelEntry,
  type ParcelFormData,
} from '@/types/parcels';
import {
  applyParcelStatusAdvance,
  compareParcels,
  filterParcels,
  formatParcelDate,
  formatParcelDateShort,
  getParcelReminderPlan,
  getParcelStats,
  lastDispatchedDate,
  parcelCardDateLine,
  parcelCardTitle,
  parcelEmptyMessage,
  parcelEntryFromForm,
  parcelKindLabel,
  parcelReminderBannerText,
  parcelReminderNotificationCopy,
  parcelStatusLabel,
  parseParcelsStorage,
  restoreParcelEntry,
  toParcelDateKey,
  validateParcelForm,
} from '@/utils/parcelCalculations';

function at(iso: string, hour = 12): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day, hour, 0, 0, 0);
}

function entry(
  partial: Partial<ParcelEntry> & Pick<ParcelEntry, 'id' | 'kind' | 'status' | 'contents' | 'packingDate'>,
): ParcelEntry {
  return {
    createdAt: `${partial.packingDate}T12:00:00.000Z`,
    updatedAt: `${partial.packingDate}T12:00:00.000Z`,
    ...partial,
  };
}

function packingForm(overrides: Partial<ParcelFormData> = {}): ParcelFormData {
  return {
    kind: 'parcel',
    status: 'packing',
    title: '',
    contents: 'Носки и письмо',
    packingDate: at('2026-03-01'),
    sentDate: null,
    receivedDate: null,
    note: '',
    ...overrides,
  };
}

describe('parseParcelsStorage', () => {
  it('пустую строку читает как пустой список и напоминание раз в 21 день', () => {
    const storage = parseParcelsStorage(null);

    expect(storage.entries).toEqual([]);
    expect(storage.settings).toEqual(DEFAULT_PARCEL_SETTINGS);
  });

  it('отбрасывает битый JSON и записи без содержимого', () => {
    expect(parseParcelsStorage('{').entries).toEqual([]);
    const storage = parseParcelsStorage(
      JSON.stringify({
        entries: [
          { id: 'ok', kind: 'parcel', status: 'packing', contents: 'Чай', packingDate: '2026-01-02' },
          { id: 'empty', kind: 'parcel', status: 'packing', contents: '  ', packingDate: '2026-01-02' },
          { id: 'bad-kind', kind: 'box', status: 'packing', contents: 'Чай', packingDate: '2026-01-02' },
        ],
        settings: { reminderEnabled: false, reminderIntervalDays: 99 },
      }),
    );

    expect(storage.entries).toHaveLength(1);
    expect(storage.entries[0]?.id).toBe('ok');
    expect(storage.settings.reminderEnabled).toBe(false);
    expect(storage.settings.reminderIntervalDays).toBe(21);
  });

  it('подхватывает старое поле date как дату сбора', () => {
    const storage = parseParcelsStorage(
      JSON.stringify({
        entries: [{ id: 'legacy', kind: 'handover', status: 'packing', contents: 'Печенье', date: '2026-02-10' }],
      }),
    );

    expect(storage.entries[0]?.packingDate).toBe('2026-02-10');
    expect(storage.settings.reminderEnabled).toBe(true);
  });
});

describe('validateParcelForm', () => {
  const today = at('2026-04-10');

  it('просит написать, что внутри', () => {
    expect(validateParcelForm(packingForm({ contents: '  ' }), today)).toBe(
      'Напишите, что внутри — коротко, своими словами',
    );
  });

  it('не даёт отправить раньше сбора и в будущем', () => {
    expect(
      validateParcelForm(
        packingForm({
          status: 'sent',
          packingDate: at('2026-04-08'),
          sentDate: at('2026-04-07'),
        }),
        today,
      ),
    ).toBe('Нельзя отправить раньше, чем начали собирать');

    expect(
      validateParcelForm(
        packingForm({
          status: 'sent',
          sentDate: at('2026-04-11'),
        }),
        today,
      ),
    ).toBe('Дата отправки не может быть в будущем');
  });

  it('для передачки требует дату, когда отнесли и когда принял', () => {
    expect(
      validateParcelForm(
        packingForm({
          kind: 'handover',
          status: 'sent',
          sentDate: null,
        }),
        today,
      ),
    ).toBe('Укажите, когда отнесли');

    expect(
      validateParcelForm(
        packingForm({
          kind: 'handover',
          status: 'received',
          sentDate: at('2026-04-02'),
          receivedDate: at('2026-04-01'),
        }),
        today,
      ),
    ).toBe('Нельзя принять раньше, чем отнесли');
  });

  it('пропускает сбор без дат отправки', () => {
    expect(validateParcelForm(packingForm(), today)).toBeNull();
  });
});

describe('подписи', () => {
  it('называет виды и статусы по-разному для посылки и передачки', () => {
    expect(parcelKindLabel('parcel')).toBe('Посылка');
    expect(parcelKindLabel('handover')).toBe('Передачка');
    expect(parcelStatusLabel('parcel', 'sent')).toBe('Отправила');
    expect(parcelStatusLabel('handover', 'sent')).toBe('Отнесла');
    expect(parcelStatusLabel('parcel', 'received')).toBe('Дошла');
    expect(parcelStatusLabel('handover', 'received')).toBe('Принял');
  });

  it('на карточке показывает название или содержимое и дату шага', () => {
    const named = entry({
      id: '1',
      kind: 'parcel',
      status: 'sent',
      title: 'Мартовская',
      contents: 'Носки, чай, письмо',
      packingDate: '2026-03-01',
      sentDate: '2026-03-04',
    });
    expect(parcelCardTitle(named)).toBe('Мартовская');
    expect(parcelCardDateLine(named)).toBe(`Отправила ${formatParcelDate('2026-03-04')}`);

    const untitled = entry({
      id: '2',
      kind: 'handover',
      status: 'received',
      contents: 'Печенье',
      packingDate: '2026-03-01',
      sentDate: '2026-03-02',
      receivedDate: '2026-03-03',
    });
    expect(parcelCardTitle(untitled)).toBe('Печенье');
    expect(parcelCardDateLine(untitled)).toBe(`Принял ${formatParcelDate('2026-03-03')}`);
  });
});

describe('filterParcels и порядок', () => {
  const packing = entry({
    id: 'pack',
    kind: 'parcel',
    status: 'packing',
    contents: 'Чай',
    packingDate: '2026-03-10',
  });
  const sent = entry({
    id: 'sent',
    kind: 'handover',
    status: 'sent',
    contents: 'Носки',
    packingDate: '2026-03-01',
    sentDate: '2026-03-08',
  });
  const received = entry({
    id: 'got',
    kind: 'parcel',
    status: 'received',
    contents: 'Письмо',
    packingDate: '2026-02-01',
    sentDate: '2026-02-03',
    receivedDate: '2026-02-20',
  });

  it('держит сбор сверху, потом путь, потом дошедшие', () => {
    expect([received, sent, packing].sort(compareParcels).map((item) => item.id)).toEqual([
      'pack',
      'sent',
      'got',
    ]);
  });

  it('фильтрует по виду и статусу', () => {
    expect(filterParcels([packing, sent, received], 'parcel', 'all').map((item) => item.id)).toEqual([
      'pack',
      'got',
    ]);
    expect(filterParcels([packing, sent, received], 'all', 'sent').map((item) => item.id)).toEqual([
      'sent',
    ]);
  });
});

describe('getParcelStats', () => {
  const now = at('2026-04-10');

  it('на пустом списке ставит прочерки', () => {
    const stats = getParcelStats([], { start: null, end: null }, now);
    expect(stats[0]?.value).toBe('0');
    expect(stats[1]?.value).toBe('0');
    expect(stats[2]?.value).toBe('0');
    expect(stats[3]?.value).toBe('—');
  });

  it('считает ушедшее за срок службы и не берёт сбор', () => {
    const stats = getParcelStats(
      [
        entry({
          id: 'before',
          kind: 'parcel',
          status: 'sent',
          contents: 'До призыва',
          packingDate: '2025-12-01',
          sentDate: '2025-12-20',
        }),
        entry({
          id: 'pack',
          kind: 'parcel',
          status: 'packing',
          contents: 'Ещё дома',
          packingDate: '2026-03-01',
        }),
        entry({
          id: 'mail',
          kind: 'parcel',
          status: 'received',
          contents: 'Носки',
          packingDate: '2026-02-01',
          sentDate: '2026-02-10',
          receivedDate: '2026-02-20',
        }),
        entry({
          id: 'visit',
          kind: 'handover',
          status: 'sent',
          contents: 'Печенье',
          packingDate: '2026-03-01',
          sentDate: '2026-03-08',
        }),
      ],
      { start: at('2026-01-01'), end: at('2026-12-31') },
      now,
    );

    expect(stats[0]?.value).toBe('2');
    expect(stats[0]?.subValue).toBe('1 посылка · 1 передачка');
    expect(stats[1]?.value).toBe('1');
    expect(stats[2]?.value).toBe('2');
    expect(stats[3]?.value).toContain('2026');
    expect(stats[3]?.subValue).toBe('33 дня назад');
  });

  it('последнюю дату берёт из того же срока службы, что и «ушло»', () => {
    const stats = getParcelStats(
      [
        entry({
          id: 'in',
          kind: 'parcel',
          status: 'received',
          contents: 'Носки',
          packingDate: '2026-02-01',
          sentDate: '2026-02-10',
          receivedDate: '2026-02-20',
        }),
        entry({
          id: 'after',
          kind: 'parcel',
          status: 'sent',
          contents: 'После дембеля',
          packingDate: '2026-03-10',
          sentDate: '2026-03-20',
        }),
      ],
      { start: at('2026-01-01'), end: at('2026-03-01') },
      now,
    );

    expect(stats[0]?.value).toBe('1');
    expect(stats[3]?.value).toBe(formatParcelDateShort('2026-02-10'));
    expect(stats[3]?.subValue).toBe('59 дней назад');
  });
});

describe('напоминание', () => {
  const settings = { reminderEnabled: true, reminderIntervalDays: 21 as const };

  it('без отправок и без призыва не ставит пуш', () => {
    const plan = getParcelReminderPlan([], settings, null, at('2026-04-10'));
    expect(plan.fireAt).toBeNull();
    expect(plan.overdue).toBe(false);
    expect(parcelReminderBannerText(plan)).toBeNull();
  });

  it('отсчитывает 21 день от последней отправки', () => {
    const entries = [
      entry({
        id: 'mail',
        kind: 'parcel',
        status: 'sent',
        contents: 'Чай',
        packingDate: '2026-03-01',
        sentDate: '2026-03-01',
      }),
    ];
    const before = getParcelReminderPlan(entries, settings, null, at('2026-03-20', 9));
    expect(before.overdue).toBe(false);
    expect(before.fireAt).toEqual(at('2026-03-22', 10));

    const morning = getParcelReminderPlan(entries, settings, null, at('2026-03-22', 9));
    expect(morning.overdue).toBe(true);
    expect(morning.fireAt).toEqual(at('2026-03-22', 10));
    expect(parcelReminderBannerText(morning)).toBe('Уже 21 день без посылки или передачки');

    const evening = getParcelReminderPlan(entries, settings, null, at('2026-03-22', 11));
    expect(evening.overdue).toBe(true);
    expect(evening.fireAt).toEqual(at('2026-03-23', 10));

    const scheduledEarly = getParcelReminderPlan(entries, settings, null, at('2026-03-01', 15));
    expect(scheduledEarly.daysSinceDispatch).toBe(0);
    expect(scheduledEarly.fireAt).toEqual(at('2026-03-22', 10));
    expect(parcelReminderNotificationCopy(scheduledEarly).body).toContain('21 день');
  });

  it('не ставит пуш на следующий день, если по этому молчанию он уже был', () => {
    const entries = [
      entry({
        id: 'mail',
        kind: 'parcel',
        status: 'sent',
        contents: 'Чай',
        packingDate: '2026-03-01',
        sentDate: '2026-03-01',
      }),
    ];
    const plan = getParcelReminderPlan(
      entries,
      settings,
      null,
      at('2026-03-23', 11),
      null,
      '2026-03-01:21',
    );

    expect(plan.overdue).toBe(true);
    expect(plan.fireAt).toBeNull();
    expect(parcelReminderBannerText(plan)).toBe('Уже 22 дня без посылки или передачки');
  });

  it('после дембеля молчит, в сам день дембеля ещё напоминает', () => {
    const entries = [
      entry({
        id: 'mail',
        kind: 'parcel',
        status: 'sent',
        contents: 'Чай',
        packingDate: '2026-01-01',
        sentDate: '2026-01-01',
      }),
    ];
    const onDemobDay = getParcelReminderPlan(
      entries,
      settings,
      at('2026-01-01'),
      at('2026-04-01', 12),
      at('2026-04-01'),
    );
    expect(onDemobDay.overdue).toBe(true);
    expect(onDemobDay.fireAt).not.toBeNull();

    const after = getParcelReminderPlan(
      entries,
      settings,
      at('2026-01-01'),
      at('2026-04-10'),
      at('2026-04-01'),
    );
    expect(after.overdue).toBe(false);
    expect(after.fireAt).toBeNull();
    expect(parcelReminderBannerText(after)).toBeNull();
  });

  it('если ещё ничего не уходило, считает от призыва', () => {
    const plan = getParcelReminderPlan([], settings, at('2026-01-01'), at('2026-02-01', 12));
    expect(plan.overdue).toBe(true);
    expect(plan.lastDispatchedDate).toBeNull();
    expect(parcelReminderNotificationCopy(plan).body).toContain('первую посылку');
  });

  it('выключенное напоминание не горит баннером', () => {
    const plan = getParcelReminderPlan(
      [
        entry({
          id: 'old',
          kind: 'parcel',
          status: 'sent',
          contents: 'Чай',
          packingDate: '2026-01-01',
          sentDate: '2026-01-01',
        }),
      ],
      { reminderEnabled: false, reminderIntervalDays: 14 },
      null,
      at('2026-04-10'),
    );
    expect(plan.overdue).toBe(false);
    expect(plan.fireAt).toBeNull();
  });
});

describe('смена статуса', () => {
  it('из сбора ставит дату отправки', () => {
    const packing = entry({
      id: '1',
      kind: 'parcel',
      status: 'packing',
      contents: 'Чай',
      packingDate: '2026-03-01',
    });
    const result = applyParcelStatusAdvance(packing, 'sent', at('2026-03-04'), at('2026-03-10'));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.entry.status).toBe('sent');
      expect(result.entry.sentDate).toBe('2026-03-04');
    }
  });

  it('не прыгает из сбора сразу в «дошла»', () => {
    const packing = entry({
      id: '1',
      kind: 'parcel',
      status: 'packing',
      contents: 'Чай',
      packingDate: '2026-03-01',
    });
    const result = applyParcelStatusAdvance(packing, 'received', at('2026-03-04'), at('2026-03-10'));
    expect(result.ok).toBe(false);
  });
});

describe('прочее', () => {
  it('lastDispatchedDate берёт самую позднюю отправку', () => {
    expect(
      lastDispatchedDate([
        entry({
          id: 'a',
          kind: 'parcel',
          status: 'received',
          contents: 'A',
          packingDate: '2026-01-01',
          sentDate: '2026-01-10',
          receivedDate: '2026-02-01',
        }),
        entry({
          id: 'b',
          kind: 'handover',
          status: 'sent',
          contents: 'B',
          packingDate: '2026-01-01',
          sentDate: '2026-01-20',
        }),
        entry({
          id: 'c',
          kind: 'parcel',
          status: 'packing',
          contents: 'C',
          packingDate: '2026-03-01',
        }),
      ]),
    ).toBe('2026-01-20');
  });

  it('пустые фильтры говорят, чего нет', () => {
    expect(parcelEmptyMessage('all', 'all')).toContain('первую посылку или передачку');
    expect(parcelEmptyMessage('handover', 'sent')).toContain('отнесли');
  });

  it('возврат удаления добавляет только эту запись', () => {
    const kept = entry({
      id: 'keep',
      kind: 'parcel',
      status: 'packing',
      contents: 'Чай',
      packingDate: '2026-03-01',
    });
    const removed = entry({
      id: 'gone',
      kind: 'handover',
      status: 'sent',
      contents: 'Печенье',
      packingDate: '2026-03-02',
      sentDate: '2026-03-03',
    });
    const storage = {
      entries: [kept],
      settings: { reminderEnabled: false, reminderIntervalDays: 14 as const },
    };

    const restored = restoreParcelEntry(storage, removed);

    expect(restored.entries.map((item) => item.id)).toEqual(['keep', 'gone']);
    expect(restored.settings).toBe(storage.settings);
    expect(restoreParcelEntry(restored, removed)).toBe(restored);
  });

  it('form → entry обрезает пробелы и снимает лишние даты у сбора', () => {
    const built = parcelEntryFromForm(
      packingForm({
        title: '  Мартовская  ',
        contents: '  Чай  ',
        sentDate: at('2026-03-04'),
        receivedDate: at('2026-03-10'),
      }),
      { id: 'x', createdAt: '2026-03-01T00:00:00.000Z' },
      '2026-03-11T00:00:00.000Z',
    );
    expect(built.title).toBe('Мартовская');
    expect(built.contents).toBe('Чай');
    expect(built.sentDate).toBeUndefined();
    expect(built.receivedDate).toBeUndefined();
    expect(built.packingDate).toBe(toParcelDateKey(at('2026-03-01')));
  });
});

describe('даты ключей', () => {
  it('toParcelDateKey не зависит от часов', () => {
    expect(toParcelDateKey(at('2026-03-05', 23))).toBe('2026-03-05');
    expect(toParcelDateKey(subDays(at('2026-03-05'), 0))).toBe('2026-03-05');
    expect(toParcelDateKey(addDays(at('2026-03-05'), 1))).toBe('2026-03-06');
    expect(format(at('2026-03-05'), 'yyyy-MM-dd')).toBe('2026-03-05');
  });
});
