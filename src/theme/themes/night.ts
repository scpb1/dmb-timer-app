import { defineTheme } from '@/theme/tokens';

/** Почти чёрная ночь с холодным лунным акцентом, без синевы «Чернил». */
export const nightTheme = defineTheme({
  id: 'night',
  name: 'Ночь',
  scheme: 'dark',
  colors: {
    background: {
      start: '#0C0E12',
      mid: '#141820',
      end: '#1C2430',
      sheen: {
        start: '#3A4454',
        startOpacity: 0.4,
        mid: '#0C0E12',
        midOpacity: 0,
        end: '#2A3444',
        endOpacity: 0.32,
      },
    },
    text: {
      primary: '#F4F6FA',
      secondary: 'rgba(244, 246, 250, 0.68)',
      accent: '#A8B8D8',
      inverse: '#0C0E12',
    },
    input: {
      border: 'rgba(232, 236, 242, 0.5)',
      placeholder: 'rgba(232, 236, 242, 0.35)',
    },
    overlay: {
      border: 'rgba(244, 246, 250, 0.2)',
      fill: '#242C38',
      muted: '#2E3848',
    },
    holiday: {
      cardBackground: 'rgba(140, 160, 196, 0.28)',
      cardBorder: 'rgba(168, 184, 216, 0.42)',
    },
  },
});
