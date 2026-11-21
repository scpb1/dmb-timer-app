import { defineTheme } from '@/theme/tokens';

/** Тёмная бирюза: северное сияние, отдельно от синих «Чернил» и зелёного «Леса». */
export const northTheme = defineTheme({
  id: 'north',
  name: 'Север',
  scheme: 'dark',
  colors: {
    background: {
      start: '#0A1614',
      mid: '#102420',
      end: '#16342E',
      sheen: {
        start: '#2A5850',
        startOpacity: 0.44,
        mid: '#0A1614',
        midOpacity: 0,
        end: '#1E4840',
        endOpacity: 0.36,
      },
    },
    text: {
      primary: '#E8F6F2',
      secondary: 'rgba(232, 246, 242, 0.68)',
      accent: '#2EC4B6',
      inverse: '#0A1614',
    },
    input: {
      border: 'rgba(220, 240, 234, 0.5)',
      placeholder: 'rgba(220, 240, 234, 0.35)',
    },
    overlay: {
      border: 'rgba(232, 246, 242, 0.2)',
      fill: '#1A3832',
      muted: '#244840',
    },
    holiday: {
      cardBackground: 'rgba(36, 168, 152, 0.3)',
      cardBorder: 'rgba(46, 196, 182, 0.46)',
    },
  },
});
