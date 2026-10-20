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
  it('для долей службы показывает 1/4, 1/2, 3/4, 1/3 и 2/3', () => {
    expect(getEventGlyph(event({ id: PREDEFINED_EVENT_IDS.QUARTER_PASSED }))).toEqual({
      type: 'label',
      text: '1/4',
    });
    expect(getEventGlyph(event({ id: PREDEFINED_EVENT_IDS.EQUATOR }))).toEqual({
      type: 'label',
      text: '1/2',
    });
    expect(getEventGlyph(event({ id: PREDEFINED_EVENT_IDS.QUARTER_REMAINING }))).toEqual({
      type: 'label',
      text: '3/4',
    });
    expect(getEventGlyph(event({ id: PREDEFINED_EVENT_IDS.THIRD_PASSED }))).toEqual({
      type: 'label',
      text: '1/3',
    });
    expect(getEventGlyph(event({ id: PREDEFINED_EVENT_IDS.THIRD_REMAINING }))).toEqual({
      type: 'label',
      text: '2/3',
    });
  });

  it('призыв рисует ровным флагом Feather, не квадратным material', () => {
    expect(getEventGlyph(event({ id: PREDEFINED_EVENT_IDS.ENLISTMENT }))).toEqual({
      type: 'icon',
      name: 'flag',
      set: 'feather',
      size: 22,
    });
  });

  it('месяцы и 100/200/300 дней рисует звездой, а не дробью или числом', () => {
    expect(getEventGlyph(event({ id: monthEventId(1) }))).toEqual({ type: 'icon', name: 'star' });
    expect(getEventGlyph(event({ id: monthEventId(13) }))).toEqual({ type: 'icon', name: 'star' });
    expect(getEventGlyph(event({ id: dppMilestoneEventId(100) }))).toEqual({
      type: 'icon',
      name: 'star',
    });
    expect(getEventGlyph(event({ id: dddMilestoneEventId(300) }))).toEqual({
      type: 'icon',
      name: 'star',
    });
  });

  it('пользовательская иконка перекрывает автоматический глиф', () => {
    expect(
      getEventGlyph(event({ id: PREDEFINED_EVENT_IDS.EQUATOR, icon: 'heart' })),
    ).toEqual({ type: 'icon', name: 'heart' });
    expect(getAutomaticEventGlyph(event({ id: PREDEFINED_EVENT_IDS.EQUATOR, icon: 'heart' }))).toEqual({
      type: 'label',
      text: '1/2',
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
