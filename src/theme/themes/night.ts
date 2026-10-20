import { defineTheme } from '@/theme/tokens';

export const nightTheme = defineTheme({
  id: 'night',
  name: 'Ночь',
  scheme: 'dark',
  colors: {
    background: {
      start: '#121826',
      mid: '#1A2438',
      end: '#243044',
      sheen: {
        start: '#3A4A64',
        startOpacity: 0.45,
        mid: '#121826',
        midOpacity: 0,
        end: '#2A3A52',
        endOpacity: 0.35,
      },
    },
    text: {
      primary: '#EEF3FA',
      secondary: 'rgba(238, 243, 250, 0.68)',
      accent: '#6BA3D4',
      inverse: '#121826',
    },
    input: {
      border: 'rgba(232, 238, 245, 0.5)',
      placeholder: 'rgba(232, 238, 245, 0.35)',
    },
    overlay: {
      border: 'rgba(238, 243, 250, 0.2)',
      fill: '#2A384E',
      muted: '#344658',
    },
    holiday: {
      cardBackground: 'rgba(90, 140, 188, 0.32)',
      cardBorder: 'rgba(107, 163, 212, 0.45)',
    },
  },
});
