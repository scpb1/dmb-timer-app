/** Временные флаги UI. Логику за ними не удаляем. */
export const FEATURES = {
  widgets: false,
  biometrics: false,
  /** Показать вкладку «Магазин» в нижней панели */
  showShopTab: false,
  /** Показать вкладку «Трекеры» в нижней панели */
  showTrackersTab: false,
  /** Вместо дневника — заглушка «в разработке» */
  diaryPlaceholder: true,
} as const;
