export const SUPPORT_CARD_CATEGORIES = ['term', 'bond', 'self'] as const;

export type SupportCardCategory = (typeof SUPPORT_CARD_CATEGORIES)[number];

export type SupportCardFilter = 'all' | SupportCardCategory;

export interface SupportCardSection {
  heading: string;
  body: string;
}

export interface SupportCard {
  id: string;
  title: string;
  category: SupportCardCategory;
  teaser: string;
  sections: SupportCardSection[];
}
