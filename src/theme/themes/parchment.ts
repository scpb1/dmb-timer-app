import { defineTheme } from '@/theme/tokens';

export const parchmentTheme = defineTheme({
  id: 'parchment',
  name: 'Пергамент',
  scheme: 'light',
  colors: {
    background: {
      start: '#F6EBD4',
      mid: '#E8D5B5',
      end: '#C4A882',
      sheen: {
        start: '#EED9B0',
        startOpacity: 0.55,
        mid: '#F6EBD4',
        midOpacity: 0,
        end: '#B89468',
        endOpacity: 0.42,
      },
    },
    text: {
      primary: '#3F3224',
      secondary: '#9A8468',
      accent: '#C45C2A',
      inverse: '#F6EBD4',
    },
    input: {
      border: '#3F3224',
      placeholder: 'rgba(63, 50, 36, 0.4)',
    },
    overlay: {
      border: 'rgba(154, 132, 104, 0.38)',
      fill: 'rgba(255, 248, 236, 0.5)',
      muted: 'rgba(154, 132, 104, 0.35)',
    },
    holiday: {
      cardBackground: 'rgba(212, 148, 96, 0.42)',
      cardBorder: 'rgba(168, 96, 48, 0.4)',
    },
  },
});
