import { defineTheme } from '@/theme/tokens';

/** Насыщенный синий, как чернила: темнее и синее, чем «Ночь». */
export const inkTheme = defineTheme({
  id: 'ink',
  name: 'Чернила',
  scheme: 'dark',
  colors: {
    background: {
      start: '#07101C',
      mid: '#0E1C34',
      end: '#16304C',
      sheen: {
        start: '#245080',
        startOpacity: 0.48,
        mid: '#07101C',
        midOpacity: 0,
        end: '#1A4068',
        endOpacity: 0.38,
      },
    },
    text: {
      primary: '#E7F1FC',
      secondary: 'rgba(231, 241, 252, 0.68)',
      accent: '#3B82F0',
      inverse: '#07101C',
    },
    input: {
      border: 'rgba(220, 234, 250, 0.5)',
      placeholder: 'rgba(220, 234, 250, 0.35)',
    },
    overlay: {
      border: 'rgba(231, 241, 252, 0.2)',
      fill: '#16304C',
      muted: '#1E3C60',
    },
    holiday: {
      cardBackground: 'rgba(40, 100, 200, 0.32)',
      cardBorder: 'rgba(59, 130, 240, 0.48)',
    },
  },
});
