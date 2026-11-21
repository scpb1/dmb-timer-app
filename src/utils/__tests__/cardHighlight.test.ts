import {
  resolveAccentCardStyle,
  resolveCustomEventCardStyle,
  resolveHolidayCardStyle,
} from '@/utils/cardHighlight';

describe('cardHighlight', () => {
  it('заливает строку выбранным цветом', () => {
    expect(resolveAccentCardStyle('row', '#BB322E')).toEqual({
      rowAccent: '#BB322E',
      badgeFill: '#BB322E',
      glyphOnFill: true,
    });
  });

  it('в режиме «только иконка» красит глиф, строку не трогает', () => {
    expect(resolveAccentCardStyle('icon', '#3D7A44')).toEqual({
      rowAccent: null,
      badgeFill: undefined,
      glyphOnFill: false,
      glyphColor: '#3D7A44',
    });
  });

  it('для праздника без highlightMode оставляет обычную карточку', () => {
    expect(resolveHolidayCardStyle({ iconColor: '#C45C58' })).toEqual({
      rowAccent: null,
      badgeFill: undefined,
      glyphOnFill: false,
      glyphColor: '#C45C58',
    });
  });

  it('для праздника с выделением строки заливает карточку', () => {
    expect(resolveHolidayCardStyle({ iconColor: '#C45C58', highlightMode: 'row' })).toEqual({
      rowAccent: '#C45C58',
      badgeFill: '#C45C58',
      glyphOnFill: true,
    });
  });

  it('для события с выделением строки без цвета берёт дефолт иконки', () => {
    expect(resolveCustomEventCardStyle({ highlightMode: 'row' }, '#3E3630')).toEqual({
      rowAccent: '#3E3630',
      badgeFill: '#3E3630',
      glyphOnFill: true,
    });
    expect(
      resolveCustomEventCardStyle({ iconColor: '#BB322E', highlightMode: 'row' }, '#3E3630'),
    ).toEqual({
      rowAccent: '#BB322E',
      badgeFill: '#BB322E',
      glyphOnFill: true,
    });
  });

  it('без своего цвета заливает цветом иконки по умолчанию', () => {
    expect(resolveAccentCardStyle('row', undefined, '#3E3630')).toEqual({
      rowAccent: '#3E3630',
      badgeFill: '#3E3630',
      glyphOnFill: true,
    });
    expect(resolveHolidayCardStyle({ highlightMode: 'row' }, '#3E3630')).toEqual({
      rowAccent: '#3E3630',
      badgeFill: '#3E3630',
      glyphOnFill: true,
    });
  });
});
