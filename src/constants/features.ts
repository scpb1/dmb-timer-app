/** Временные флаги UI. Логику за ними не удаляем. */
export const FEATURES = {
  /** Обновление виджета Android. Включать только после политики «один писатель» для SQLite. */
  widgets: false,
  biometrics: false,
  /** Показать вкладку «Магазин» в нижней панели */
  showShopTab: false,
  /** Показать вкладку «Трекеры» в нижней панели */
  showTrackersTab: false,
  /** Вместо дневника — заглушка «в разработке» */
  diaryPlaceholder: false,
  /** Переключатели окантовки «Событие» / «Таймер» на фото-фоне */
  showPhotoElementBorderSwitches: false,
  /** Горизонтальные «Плитки» в ленте событий */
  milestonesChipsLayout: false,
  /** Push-напоминания «написать письмо» */
  letterNotifications: false,
  /** Карточка «Книга писем» на экране дневника */
  letterBookHomeEntry: false,
  /** Старые блоки статистики в итогах службы */
  legacySummaryStats: false,
  /** Overlay «Сохранение…» при сохранении дат службы в настройках таймера */
  timerSettingsSaveDatesOverlay: false,
} as const;
