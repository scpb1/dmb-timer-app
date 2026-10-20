import type { LetterTheme } from '@/types/diary';

/** Фильтр каталога тем по подстроке. Пустой запрос возвращает весь список. */
export function filterLetterThemes(themes: LetterTheme[], query: string): LetterTheme[] {
  const needle = query.replace(/\s+/g, ' ').trim().toLocaleLowerCase('ru');
  if (!needle) {
    return themes;
  }

  return themes.filter((theme) => theme.title.toLocaleLowerCase('ru').includes(needle));
}

/** Свободные темы выше уже использованных, порядок внутри групп как в каталоге. */
export function sortLetterThemesForPicker(
  themes: LetterTheme[],
  usedThemeIds: string[],
): LetterTheme[] {
  const used = new Set(usedThemeIds);
  const unused: LetterTheme[] = [];
  const spent: LetterTheme[] = [];
  for (const theme of themes) {
    if (used.has(theme.id)) {
      spent.push(theme);
    } else {
      unused.push(theme);
    }
  }
  return [...unused, ...spent];
}
