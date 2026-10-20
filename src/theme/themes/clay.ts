import { defineTheme } from '@/theme/tokens';

export const clayTheme = defineTheme({
  id: 'clay',
  name: 'Глина',
  scheme: 'light',
  colors: {
    background: {
      start: '#F8EEE6',
      mid: '#E8D0BE',
      end: '#D0A888',
      sheen: {
        start: '#E0BCA0',
        startOpacity: 0.5,
        mid: '#F8EEE6',
        midOpacity: 0,
        end: '#B88868',
        endOpacity: 0.4,
      },
    },
    text: {
      primary: '#3E2A1F',
      secondary: '#A07A62',
      accent: '#C45A32',
      inverse: '#F8EEE6',
    },
    input: {
      border: '#3E2A1F',
      placeholder: 'rgba(62, 42, 31, 0.4)',
    },
    overlay: {
      border: 'rgba(160, 122, 98, 0.38)',
      fill: 'rgba(255, 248, 240, 0.5)',
      muted: 'rgba(160, 122, 98, 0.35)',
    },
    holiday: {
      cardBackground: 'rgba(220, 148, 112, 0.44)',
      cardBorder: 'rgba(176, 88, 52, 0.4)',
    },
  },
});
