export type LetterBookVariantId = 'classic' | 'journal' | 'album';

export interface LetterBookVariant {
  id: LetterBookVariantId;
  title: string;
  subtitle: string;
  hint: string;
  icon: 'book-open' | 'calendar' | 'layers';
}

export const LETTER_BOOK_VARIANTS: LetterBookVariant[] = [
  {
    id: 'classic',
    title: 'Том писем',
    subtitle: 'Классическая книга',
    hint: 'Титульный лист, содержание, письма главами и послесловие с итогами',
    icon: 'book-open',
  },
  {
    id: 'journal',
    title: 'Календарь ожидания',
    subtitle: 'Дневник по месяцам',
    hint: 'Сначала цифры ожидания, затем письма, собранные по месяцам',
    icon: 'calendar',
  },
  {
    id: 'album',
    title: 'Мы ждали',
    subtitle: 'Альбом с итогами',
    hint: 'Крупные числа, карточки статистики и письма как открытки',
    icon: 'layers',
  },
];

export function getLetterBookVariant(id: LetterBookVariantId): LetterBookVariant {
  return LETTER_BOOK_VARIANTS.find((item) => item.id === id) ?? LETTER_BOOK_VARIANTS[0];
}
