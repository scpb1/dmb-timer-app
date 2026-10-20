import { defineTheme } from '@/theme/tokens';

export const seaTheme = defineTheme({
  id: 'sea',
  name: 'Море',
  scheme: 'light',
  colors: {
    background: {
      start: '#EEF6F6',
      mid: '#D2E6E6',
      end: '#A8CDD0',
      sheen: {
        start: '#B8D8DC',
        startOpacity: 0.55,
        mid: '#EEF6F6',
        midOpacity: 0,
        end: '#88B4B8',
        endOpacity: 0.42,
      },
    },
    text: {
      primary: '#1E3536',
      secondary: '#6E8A8C',
      accent: '#2A7A80',
      inverse: '#EEF6F6',
    },
    input: {
      border: '#1E3536',
      placeholder: 'rgba(30, 53, 54, 0.4)',
    },
    overlay: {
      border: 'rgba(110, 138, 140, 0.38)',
      fill: 'rgba(255, 255, 255, 0.5)',
      muted: 'rgba(110, 138, 140, 0.35)',
    },
    holiday: {
      cardBackground: 'rgba(140, 196, 196, 0.44)',
      cardBorder: 'rgba(48, 120, 124, 0.4)',
    },
  },
});
