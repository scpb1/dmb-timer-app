import { defineTheme } from '@/theme/tokens';

export const snowTheme = defineTheme({
  id: 'snow',
  name: 'Снег',
  scheme: 'light',
  colors: {
    background: {
      start: '#F7F9FC',
      mid: '#E4EAF2',
      end: '#C5D0DE',
      sheen: {
        start: '#D0DAE8',
        startOpacity: 0.55,
        mid: '#F7F9FC',
        midOpacity: 0,
        end: '#A8B8CC',
        endOpacity: 0.4,
      },
    },
    text: {
      primary: '#2A3140',
      secondary: '#7A8494',
      accent: '#3D5A8A',
      inverse: '#F7F9FC',
    },
    input: {
      border: '#2A3140',
      placeholder: 'rgba(42, 49, 64, 0.4)',
    },
    overlay: {
      border: 'rgba(122, 132, 148, 0.38)',
      fill: 'rgba(255, 255, 255, 0.52)',
      muted: 'rgba(122, 132, 148, 0.35)',
    },
    holiday: {
      cardBackground: 'rgba(164, 184, 212, 0.42)',
      cardBorder: 'rgba(72, 100, 144, 0.4)',
    },
  },
});
