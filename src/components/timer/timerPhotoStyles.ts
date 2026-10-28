import { StyleSheet } from 'react-native';

/** Текст на фото-фоне (подписи, мелкий текст) */
export const timerPhotoTextStyles = StyleSheet.create({
  text: {
    color: '#F2F0EC',
    textShadowColor: 'rgba(0, 0, 0, 0.48)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  textMuted: {
    color: 'rgba(242, 240, 236, 0.78)',
    textShadowColor: 'rgba(0, 0, 0, 0.42)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  /** Крупные цифры (display) — без тени */
  heroNumber: {
    color: '#F2F0EC',
  },
});
