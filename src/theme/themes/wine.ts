import { defineTheme } from '@/theme/tokens';

export const wineTheme = defineTheme({
  id: 'wine',
  name: 'Вино',
  scheme: 'dark',
  colors: {
    background: {
      start: '#1C1216',
      mid: '#2A181E',
      end: '#3A2028',
      sheen: {
        start: '#5A3038',
        startOpacity: 0.42,
        mid: '#1C1216',
        midOpacity: 0,
        end: '#4A2830',
        endOpacity: 0.35,
      },
    },
    text: {
      primary: '#FAEEF0',
      secondary: 'rgba(250, 238, 240, 0.68)',
      accent: '#E05A6A',
      inverse: '#1C1216',
    },
    input: {
      border: 'rgba(245, 232, 234, 0.5)',
      placeholder: 'rgba(245, 232, 234, 0.35)',
    },
    overlay: {
      border: 'rgba(250, 238, 240, 0.2)',
      fill: '#422830',
      muted: '#4E323A',
    },
    holiday: {
      cardBackground: 'rgba(200, 88, 104, 0.3)',
      cardBorder: 'rgba(224, 90, 106, 0.45)',
    },
  },
});
