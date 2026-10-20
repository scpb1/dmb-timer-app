import { defineTheme } from '@/theme/tokens';

export const milkTheme = defineTheme({
  id: 'milk',
  name: 'Молоко',
  scheme: 'light',
  colors: {
    background: {
      start: '#FFFAF5',
      mid: '#F0E8DE',
      end: '#D4C8BA',
      sheen: {
        start: '#E8DCD0',
        startOpacity: 0.55,
        mid: '#FFFAF5',
        midOpacity: 0,
        end: '#C0B2A2',
        endOpacity: 0.4,
      },
    },
    text: {
      primary: '#3A342E',
      secondary: '#9A9086',
      accent: '#B85C4A',
      inverse: '#FFFAF5',
    },
    input: {
      border: '#3A342E',
      placeholder: 'rgba(58, 52, 46, 0.4)',
    },
    overlay: {
      border: 'rgba(154, 144, 134, 0.38)',
      fill: 'rgba(255, 255, 255, 0.52)',
      muted: 'rgba(154, 144, 134, 0.35)',
    },
    holiday: {
      cardBackground: 'rgba(216, 168, 152, 0.42)',
      cardBorder: 'rgba(168, 96, 80, 0.38)',
    },
  },
});
