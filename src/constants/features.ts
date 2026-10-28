/** Временные флаги UI. Логику за ними не удаляем. */
export const FEATURES = {
  /** Обновление и регистрация виджета Android */
  widgets: false,
  biometrics: false,
  /** Показать вкладку «Магазин» в нижней панели */
  showShopTab: false,
  /** Показать вкладку «Трекеры» в нижней панели */
  showTrackersTab: false,
  /** Вместо дневника — заглушка «в разработке» */
  diaryPlaceholder: true,
  /** Переключатели окантовки «Событие» / «Таймер» на фото-фоне */
  showPhotoElementBorderSwitches: false,
  /** Горизонтальные «Плитки» в ленте событий */
  milestonesChipsLayout: false,
  /** Push-напоминания «написать письмо» */
  letterNotifications: false,
  /** Overlay «Сохранение…» при сохранении дат службы в настройках таймера */
  timerSettingsSaveDatesOverlay: false,
} as const;
