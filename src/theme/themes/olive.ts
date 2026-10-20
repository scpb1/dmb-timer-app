import { defineTheme } from '@/theme/tokens';

export const oliveTheme = defineTheme({
  id: 'olive',
  name: 'Олива',
  scheme: 'dark',
  colors: {
    background: {
      start: '#161610',
      mid: '#202018',
      end: '#2A2A1C',
      sheen: {
        start: '#4A4A30',
        startOpacity: 0.42,
        mid: '#161610',
        midOpacity: 0,
        end: '#383824',
        endOpacity: 0.35,
      },
    },
    text: {
      primary: '#F4F0DC',
      secondary: 'rgba(244, 240, 220, 0.68)',
      accent: '#A8A03A',
      inverse: '#161610',
    },
    input: {
      border: 'rgba(238, 234, 212, 0.5)',
      placeholder: 'rgba(238, 234, 212, 0.35)',
    },
    overlay: {
      border: 'rgba(244, 240, 220, 0.2)',
      fill: '#323024',
      muted: '#3C3A2C',
    },
    holiday: {
      cardBackground: 'rgba(168, 160, 64, 0.3)',
      cardBorder: 'rgba(168, 160, 58, 0.45)',
    },
  },
});
