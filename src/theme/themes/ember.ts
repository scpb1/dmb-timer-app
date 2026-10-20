import { defineTheme } from '@/theme/tokens';

export const emberTheme = defineTheme({
  id: 'ember',
  name: 'Уголь',
  scheme: 'dark',
  colors: {
    background: {
      start: '#1A1612',
      mid: '#262018',
      end: '#32281C',
      sheen: {
        start: '#5A4030',
        startOpacity: 0.42,
        mid: '#1A1612',
        midOpacity: 0,
        end: '#443224',
        endOpacity: 0.35,
      },
    },
    text: {
      primary: '#FAF2E6',
      secondary: 'rgba(250, 242, 230, 0.68)',
      accent: '#E08A3A',
      inverse: '#1A1612',
    },
    input: {
      border: 'rgba(245, 237, 224, 0.5)',
      placeholder: 'rgba(245, 237, 224, 0.35)',
    },
    overlay: {
      border: 'rgba(250, 242, 230, 0.2)',
      fill: '#3A3024',
      muted: '#463A2C',
    },
    holiday: {
      cardBackground: 'rgba(208, 128, 56, 0.3)',
      cardBorder: 'rgba(224, 138, 58, 0.45)',
    },
  },
});
