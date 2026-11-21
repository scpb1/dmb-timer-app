import { SUPPORT_CARDS } from '@/data/supportCards';
import { filterSupportCards, getSupportCardById } from '@/utils/supportCards';

const SECTION_HEADINGS = [
  'Что происходит',
  'Что в теле',
  'Почему такие мысли',
  'Что с этим делать',
  'Практика',
];

describe('supportCards', () => {
  it('в каталоге 40 карточек с уникальными id и названиями', () => {
    expect(SUPPORT_CARDS).toHaveLength(40);
    expect(new Set(SUPPORT_CARDS.map((card) => card.id)).size).toBe(40);
    expect(new Set(SUPPORT_CARDS.map((card) => card.title)).size).toBe(40);
  });

  it('у каждой карточки есть описание и пять абзацев', () => {
    for (const item of SUPPORT_CARDS) {
      expect(item.teaser.length).toBeGreaterThan(20);
      expect(item.sections.map((section) => section.heading)).toEqual(SECTION_HEADINGS);
      for (const section of item.sections) {
        expect(section.body.length).toBeGreaterThan(40);
      }
    }
  });

  it('в текстах нет двоеточий и длинного тире', () => {
    for (const item of SUPPORT_CARDS) {
      const chunks = [item.title, item.teaser, ...item.sections.map((section) => section.body)];
      for (const chunk of chunks) {
        expect(chunk).not.toMatch(/:/);
        expect(chunk).not.toMatch(/—/);
      }
    }
  });

  it('ищет карточку по id и фильтрует по категории', () => {
    const first = SUPPORT_CARDS[0];
    expect(getSupportCardById(first.id)).toEqual(first);
    expect(getSupportCardById('missing')).toBeUndefined();

    const bond = filterSupportCards(SUPPORT_CARDS, 'bond');
    expect(bond.length).toBeGreaterThan(0);
    expect(bond.every((card) => card.category === 'bond')).toBe(true);
    expect(filterSupportCards(SUPPORT_CARDS, 'all')).toHaveLength(40);
  });
});
