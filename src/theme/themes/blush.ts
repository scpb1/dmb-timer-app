import { defineTheme } from '@/theme/tokens';

export const blushTheme = defineTheme({
  id: 'blush',
  name: 'Румяна',
  scheme: 'light',
  colors: {
    background: {
      start: '#FBF0EE',
      mid: '#F3D9D6',
      end: '#E4B7B4',
      sheen: {
        start: '#F0C8C8',
        startOpacity: 0.5,
        mid: '#FBF0EE',
        midOpacity: 0,
        end: '#D49A9A',
        endOpacity: 0.4,
      },
    },
    text: {
      primary: '#4A2F32',
      secondary: '#B0898C',
      accent: '#C43B4A',
      inverse: '#FBF0EE',
    },
    input: {
      border: '#4A2F32',
      placeholder: 'rgba(74, 47, 50, 0.4)',
    },
    overlay: {
      border: 'rgba(176, 137, 140, 0.38)',
      fill: 'rgba(255, 255, 255, 0.5)',
      muted: 'rgba(176, 137, 140, 0.35)',
    },
    holiday: {
      cardBackground: 'rgba(228, 140, 148, 0.44)',
      cardBorder: 'rgba(176, 72, 84, 0.4)',
    },
  },
});
