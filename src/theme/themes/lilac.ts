import { defineTheme } from '@/theme/tokens';

export const lilacTheme = defineTheme({
  id: 'lilac',
  name: 'Сирень',
  scheme: 'light',
  colors: {
    background: {
      start: '#F6F1F8',
      mid: '#E4D5EA',
      end: '#C8B3D4',
      sheen: {
        start: '#D4C0E0',
        startOpacity: 0.5,
        mid: '#F6F1F8',
        midOpacity: 0,
        end: '#B090C4',
        endOpacity: 0.4,
      },
    },
    text: {
      primary: '#3A2E42',
      secondary: '#8F7A9A',
      accent: '#7A4E9A',
      inverse: '#F6F1F8',
    },
    input: {
      border: '#3A2E42',
      placeholder: 'rgba(58, 46, 66, 0.4)',
    },
    overlay: {
      border: 'rgba(143, 122, 154, 0.38)',
      fill: 'rgba(255, 255, 255, 0.5)',
      muted: 'rgba(143, 122, 154, 0.35)',
    },
    holiday: {
      cardBackground: 'rgba(196, 168, 212, 0.44)',
      cardBorder: 'rgba(122, 78, 154, 0.38)',
    },
  },
});
