import { filterLetterThemes, sortLetterThemesForPicker } from '@/utils/letterThemes';
import type { LetterTheme } from '@/types/diary';

function theme(id: string, title: string): LetterTheme {
  return { id, title, sortOrder: 1 };
}

describe('letterThemes', () => {
  const catalog = [
    theme('a', 'Я горжусь тобой'),
    theme('b', 'Хочу встречать закаты вместе'),
    theme('c', 'Наша первая встреча'),
  ];

  it('пустой запрос не фильтрует', () => {
    expect(filterLetterThemes(catalog, '   ')).toEqual(catalog);
  });

  it('ищет без учёта регистра и лишних пробелов', () => {
    expect(filterLetterThemes(catalog, '  ГОРЖУСЬ  ').map((item) => item.id)).toEqual(['a']);
  });

  it('ставит свободные темы выше использованных', () => {
    const sorted = sortLetterThemesForPicker(catalog, ['b']);
    expect(sorted.map((item) => item.id)).toEqual(['a', 'c', 'b']);
  });
});
