import { defineTheme } from '@/theme/tokens';

export const inkTheme = defineTheme({
  id: 'ink',
  name: 'Чернила',
  scheme: 'dark',
  colors: {
    background: {
      start: '#0E141C',
      mid: '#161E2A',
      end: '#1E2A3A',
      sheen: {
        start: '#2A3E58',
        startOpacity: 0.45,
        mid: '#0E141C',
        midOpacity: 0,
        end: '#24364C',
        endOpacity: 0.35,
      },
    },
    text: {
      primary: '#ECF2FA',
      secondary: 'rgba(236, 242, 250, 0.68)',
      accent: '#4A8AD4',
      inverse: '#0E141C',
    },
    input: {
      border: 'rgba(230, 238, 246, 0.5)',
      placeholder: 'rgba(230, 238, 246, 0.35)',
    },
    overlay: {
      border: 'rgba(236, 242, 250, 0.2)',
      fill: '#243246',
      muted: '#2E3C52',
    },
    holiday: {
      cardBackground: 'rgba(64, 120, 188, 0.3)',
      cardBorder: 'rgba(74, 138, 212, 0.45)',
    },
  },
});
