import { defineTheme } from '@/theme/tokens';

export const forestTheme = defineTheme({
  id: 'forest',
  name: 'Лес',
  scheme: 'dark',
  colors: {
    background: {
      start: '#121814',
      mid: '#1A2420',
      end: '#24302A',
      sheen: {
        start: '#3A4A40',
        startOpacity: 0.42,
        mid: '#121814',
        midOpacity: 0,
        end: '#2E3E36',
        endOpacity: 0.35,
      },
    },
    text: {
      primary: '#EEF4F0',
      secondary: 'rgba(238, 244, 240, 0.68)',
      accent: '#6BB07A',
      inverse: '#121814',
    },
    input: {
      border: 'rgba(232, 240, 234, 0.5)',
      placeholder: 'rgba(232, 240, 234, 0.35)',
    },
    overlay: {
      border: 'rgba(238, 244, 240, 0.2)',
      fill: '#2A3630',
      muted: '#344238',
    },
    holiday: {
      cardBackground: 'rgba(88, 152, 104, 0.3)',
      cardBorder: 'rgba(107, 176, 122, 0.45)',
    },
  },
});
