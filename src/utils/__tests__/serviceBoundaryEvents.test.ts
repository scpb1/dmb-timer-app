import { PREDEFINED_EVENT_IDS } from '@/types/events';
import {
  DEMOBILIZATION_ACCENT,
  ENLISTMENT_ACCENT,
  resolveServiceBoundaryCardStyle,
  resolveServiceBoundaryColor,
  resolveServiceBoundaryFormColor,
} from '@/utils/serviceBoundaryEvents';

describe('serviceBoundaryEvents', () => {
  const enlist = {
    id: PREDEFINED_EVENT_IDS.ENLISTMENT,
    iconColor: undefined as string | undefined,
    boundaryIconThemeDefault: undefined as boolean | undefined,
  };

  it('пресет призыва #BB322E подставляется в форму и в отображение', () => {
    expect(resolveServiceBoundaryFormColor(enlist)).toBe(ENLISTMENT_ACCENT);
    expect(resolveServiceBoundaryColor(enlist)).toBe(ENLISTMENT_ACCENT);
  });

  it('после сброса — цвет темы (нет значения)', () => {
    expect(
      resolveServiceBoundaryColor({ ...enlist, boundaryIconThemeDefault: true }),
    ).toBeUndefined();
    expect(
      resolveServiceBoundaryFormColor({ ...enlist, boundaryIconThemeDefault: true }),
    ).toBeUndefined();
  });

  it('режим строки: заливка карточки, белая иконка', () => {
    expect(resolveServiceBoundaryCardStyle({ ...enlist, boundaryDisplay: 'row' })).toEqual({
      rowAccent: ENLISTMENT_ACCENT,
      badgeFill: ENLISTMENT_ACCENT,
      glyphOnFill: true,
    });
  });

  it('режим «только иконка»: обычная строка, цвет на иконке', () => {
    expect(
      resolveServiceBoundaryCardStyle({
        id: PREDEFINED_EVENT_IDS.DEMOBILIZATION,
        boundaryDisplay: 'icon',
      }),
    ).toEqual({
      rowAccent: null,
      badgeFill: undefined,
      glyphOnFill: false,
      glyphColor: DEMOBILIZATION_ACCENT,
    });
  });

  it('режим строки после сброса заливает цветом иконки по умолчанию', () => {
    expect(
      resolveServiceBoundaryCardStyle(
        {
          ...enlist,
          boundaryDisplay: 'row',
          boundaryIconThemeDefault: true,
        },
        '#3E3630',
      ),
    ).toEqual({
      rowAccent: '#3E3630',
      badgeFill: '#3E3630',
      glyphOnFill: true,
    });
  });

  it('режим «только иконка» после сброса — как обычное событие', () => {
    expect(
      resolveServiceBoundaryCardStyle({
        ...enlist,
        boundaryDisplay: 'icon',
        boundaryIconThemeDefault: true,
      }),
    ).toEqual({
      rowAccent: null,
      badgeFill: undefined,
      glyphOnFill: false,
    });
  });
});
