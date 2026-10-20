import { defineTheme } from '@/theme/tokens';

export const fogTheme = defineTheme({
  id: 'fog',
  name: 'Туман',
  scheme: 'light',
  colors: {
    background: {
      start: '#F3F5F7',
      mid: '#DCE3E8',
      end: '#B8C5CF',
      sheen: {
        start: '#C8D4DE',
        startOpacity: 0.55,
        mid: '#F3F5F7',
        midOpacity: 0,
        end: '#9AADBA',
        endOpacity: 0.42,
      },
    },
    text: {
      primary: '#2C343A',
      secondary: '#7C8A94',
      accent: '#4A6F8A',
      inverse: '#F3F5F7',
    },
    input: {
      border: '#2C343A',
      placeholder: 'rgba(44, 52, 58, 0.4)',
    },
    overlay: {
      border: 'rgba(124, 138, 148, 0.38)',
      fill: 'rgba(255, 255, 255, 0.5)',
      muted: 'rgba(124, 138, 148, 0.35)',
    },
    holiday: {
      cardBackground: 'rgba(156, 180, 196, 0.42)',
      cardBorder: 'rgba(80, 112, 136, 0.4)',
    },
  },
});
