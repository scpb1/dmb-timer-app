import { defineTheme } from '@/theme/tokens';

export const plumTheme = defineTheme({
  id: 'plum',
  name: 'Слива',
  scheme: 'dark',
  colors: {
    background: {
      start: '#16121C',
      mid: '#201828',
      end: '#2A2036',
      sheen: {
        start: '#4A3860',
        startOpacity: 0.42,
        mid: '#16121C',
        midOpacity: 0,
        end: '#382848',
        endOpacity: 0.35,
      },
    },
    text: {
      primary: '#F5EEF8',
      secondary: 'rgba(245, 238, 248, 0.68)',
      accent: '#B06AD4',
      inverse: '#16121C',
    },
    input: {
      border: 'rgba(240, 232, 245, 0.5)',
      placeholder: 'rgba(240, 232, 245, 0.35)',
    },
    overlay: {
      border: 'rgba(245, 238, 248, 0.2)',
      fill: '#322640',
      muted: '#3C2E4A',
    },
    holiday: {
      cardBackground: 'rgba(160, 96, 196, 0.3)',
      cardBorder: 'rgba(176, 106, 212, 0.45)',
    },
  },
});
