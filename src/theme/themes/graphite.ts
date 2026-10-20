import { defineTheme } from '@/theme/tokens';

/** Текущая тёмная тема приложения. */
export const graphiteTheme = defineTheme({
  id: 'graphite',
  name: 'Графит',
  scheme: 'dark',
  colors: {
    background: {
      start: '#1A1A1C',
      mid: '#242427',
      end: '#2D2D30',
      sheen: {
        start: '#45454B',
        startOpacity: 0.45,
        mid: '#1A1A1C',
        midOpacity: 0,
        end: '#35353A',
        endOpacity: 0.35,
      },
    },
    text: {
      primary: '#F8F5F0',
      secondary: 'rgba(248, 245, 240, 0.68)',
      accent: '#E53935',
      inverse: '#1A1A1C',
    },
    input: {
      border: 'rgba(245, 242, 235, 0.5)',
      placeholder: 'rgba(245, 242, 235, 0.35)',
    },
    overlay: {
      border: 'rgba(248, 245, 240, 0.2)',
      fill: '#333338',
      muted: '#3C3C44',
    },
    holiday: {
      cardBackground: 'rgba(232, 168, 152, 0.28)',
      cardBorder: 'rgba(224, 140, 128, 0.42)',
    },
  },
});
