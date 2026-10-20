import { defineTheme } from '@/theme/tokens';

export const honeyTheme = defineTheme({
  id: 'honey',
  name: 'Мёд',
  scheme: 'light',
  colors: {
    background: {
      start: '#FFF6E3',
      mid: '#F3E0B5',
      end: '#E0C07A',
      sheen: {
        start: '#F0D48A',
        startOpacity: 0.5,
        mid: '#FFF6E3',
        midOpacity: 0,
        end: '#C8A050',
        endOpacity: 0.4,
      },
    },
    text: {
      primary: '#3D2E16',
      secondary: '#A88B4E',
      accent: '#D4891A',
      inverse: '#FFF6E3',
    },
    input: {
      border: '#3D2E16',
      placeholder: 'rgba(61, 46, 22, 0.4)',
    },
    overlay: {
      border: 'rgba(168, 139, 78, 0.38)',
      fill: 'rgba(255, 252, 240, 0.5)',
      muted: 'rgba(168, 139, 78, 0.35)',
    },
    holiday: {
      cardBackground: 'rgba(228, 176, 88, 0.44)',
      cardBorder: 'rgba(184, 120, 32, 0.4)',
    },
  },
});
