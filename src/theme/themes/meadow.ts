import { defineTheme } from '@/theme/tokens';

export const meadowTheme = defineTheme({
  id: 'meadow',
  name: 'Луг',
  scheme: 'light',
  colors: {
    background: {
      start: '#F5F6E6',
      mid: '#E2E6C4',
      end: '#C5D08A',
      sheen: {
        start: '#D4DC9A',
        startOpacity: 0.5,
        mid: '#F5F6E6',
        midOpacity: 0,
        end: '#A8B45C',
        endOpacity: 0.4,
      },
    },
    text: {
      primary: '#2F361C',
      secondary: '#7E8658',
      accent: '#6B8A1E',
      inverse: '#F5F6E6',
    },
    input: {
      border: '#2F361C',
      placeholder: 'rgba(47, 54, 28, 0.4)',
    },
    overlay: {
      border: 'rgba(126, 134, 88, 0.38)',
      fill: 'rgba(255, 255, 250, 0.5)',
      muted: 'rgba(126, 134, 88, 0.35)',
    },
    holiday: {
      cardBackground: 'rgba(188, 204, 120, 0.44)',
      cardBorder: 'rgba(112, 140, 40, 0.4)',
    },
  },
});
