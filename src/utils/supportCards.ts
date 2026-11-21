import { SUPPORT_CARDS } from '@/data/supportCards';
import type { SupportCard, SupportCardFilter } from '@/types/support';

export function getSupportCardById(id: string): SupportCard | undefined {
  return SUPPORT_CARDS.find((card) => card.id === id);
}

export function filterSupportCards(
  cards: readonly SupportCard[],
  category: SupportCardFilter,
): SupportCard[] {
  if (category === 'all') {
    return [...cards];
  }
  return cards.filter((card) => card.category === category);
}
