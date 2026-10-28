import {
  dddMilestoneEventId,
  dppMilestoneEventId,
  monthEventId,
  PREDEFINED_EVENT_IDS,
  type DisplayEvent,
} from '@/types/events';
import { PREDEFINED_HOLIDAY_IDS, type DisplayHoliday } from '@/types/holidays';
import {
  getAutomaticEventGlyph,
  getEventFormIconDefaults,
  getEventGlyph,
  getHolidayGlyph,
} from '@/utils/eventGlyphs';

function event(partial: Partial<DisplayEvent> & Pick<DisplayEvent, 'id'>): DisplayEvent {
  return {
    name: 'Событие',
    date: new Date(2026, 0, 1),
    dateFormat: 'date',
    isCustom: false,
    isPast: false,
    ...partial,
  };
}

function holiday(partial: Partial<DisplayHoliday> & Pick<DisplayHoliday, 'id'>): DisplayHoliday {
  return {
    name: 'Праздник',
    month: 1,
    day: 1,
    date: new Date(2026, 0, 1),
    isCustom: false,
    isPast: false,
    ...partial,
  };
}

describe('eventGlyphs', () => {
  it('для долей службы показывает звезду-штамп вместо дроби', () => {
    const stamp = { type: 'custom' as const, id: 'split-star' as const };
    expect(getEventGlyph(event({ id: PREDEFINED_EVENT_IDS.QUARTER_PASSED }))).toEqual(stamp);
    expect(getEventGlyph(event({ id: PREDEFINED_EVENT_IDS.EQUATOR }))).toEqual(stamp);
    expect(getEventGlyph(event({ id: PREDEFINED_EVENT_IDS.QUARTER_REMAINING }))).toEqual(stamp);
    expect(getEventGlyph(event({ id: PREDEFINED_EVENT_IDS.THIRD_PASSED }))).toEqual(stamp);
    expect(getEventGlyph(event({ id: PREDEFINED_EVENT_IDS.THIRD_REMAINING }))).toEqual(stamp);
  });

  it('призыв рисует флагом из каталога иконок', () => {
    expect(getEventGlyph(event({ id: PREDEFINED_EVENT_IDS.ENLISTMENT }))).toEqual({
      type: 'icon',
      name: 'flag-variant',
    });
  });

  it('месяцы и 100/200/300 дней рисует звездой-штампом, а не дробью или числом', () => {
    const stamp = { type: 'custom' as const, id: 'split-star' as const };
    expect(getEventGlyph(event({ id: monthEventId(1) }))).toEqual(stamp);
    expect(getEventGlyph(event({ id: monthEventId(13) }))).toEqual(stamp);
    expect(getEventGlyph(event({ id: dppMilestoneEventId(100) }))).toEqual(stamp);
    expect(getEventGlyph(event({ id: dddMilestoneEventId(300) }))).toEqual(stamp);
  });

  it('форма светофора подставляет круг и цвет из пресета', () => {
    expect(getEventFormIconDefaults(event({ id: PREDEFINED_EVENT_IDS.TRAFFIC_RED }))).toEqual({
      icon: 'circle',
      iconColor: '#C44536',
    });
    expect(getEventFormIconDefaults(event({ id: PREDEFINED_EVENT_IDS.TRAFFIC_YELLOW }))).toEqual({
      icon: 'circle',
      iconColor: '#E0A106',
    });
    expect(getEventFormIconDefaults(event({ id: PREDEFINED_EVENT_IDS.TRAFFIC_GREEN }))).toEqual({
      icon: 'circle',
      iconColor: '#4C8C4A',
    });
  });

  it('пользовательская иконка и цвет перекрывают автоматический глиф', () => {
    expect(
      getEventGlyph(event({ id: PREDEFINED_EVENT_IDS.EQUATOR, icon: 'heart', iconColor: '#AABBCC' })),
    ).toEqual({ type: 'icon', name: 'heart', color: '#AABBCC' });
    expect(getAutomaticEventGlyph(event({ id: PREDEFINED_EVENT_IDS.EQUATOR, icon: 'heart' }))).toEqual({
      type: 'custom',
      id: 'split-star',
    });
  });

  it('legacy auto-fix мапится на split-star', () => {
    expect(getEventGlyph(event({ id: 'custom', isCustom: true, icon: 'auto-fix' }))).toEqual({
      type: 'custom',
      id: 'split-star',
    });
  });

  it('у праздников берёт пресет или выбранную иконку', () => {
    expect(getHolidayGlyph(holiday({ id: PREDEFINED_HOLIDAY_IDS.NEW_YEAR }))).toEqual({
      type: 'icon',
      name: 'pine-tree',
    });
    expect(getHolidayGlyph(holiday({ id: PREDEFINED_HOLIDAY_IDS.SPRING }))).toEqual({
      type: 'icon',
      name: 'sprout',
    });
    expect(getHolidayGlyph(holiday({ id: PREDEFINED_HOLIDAY_IDS.WOMENS_DAY }))).toEqual({
      type: 'icon',
      name: 'flower-tulip',
    });
    expect(getHolidayGlyph(holiday({ id: PREDEFINED_HOLIDAY_IDS.VALENTINE }))).toEqual({
      type: 'icon',
      name: 'emoticon-kiss-outline',
    });
    expect(getHolidayGlyph(holiday({ id: PREDEFINED_HOLIDAY_IDS.DEFENDER_DAY }))).toEqual({
      type: 'icon',
      name: 'shield-star',
    });
    expect(getHolidayGlyph(holiday({ id: PREDEFINED_HOLIDAY_IDS.SUMMER }))).toEqual({
      type: 'icon',
      name: 'weather-sunny',
      size: 34,
    });
    expect(
      getHolidayGlyph(holiday({ id: PREDEFINED_HOLIDAY_IDS.NEW_YEAR, icon: 'balloon' })),
    ).toEqual({ type: 'icon', name: 'balloon' });
    expect(getHolidayGlyph(holiday({ id: 'custom-1', isCustom: true }))).toEqual({
      type: 'icon',
      name: 'star-outline',
    });
  });
});
