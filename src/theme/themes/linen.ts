import { defineTheme } from '@/theme/tokens';

/** Текущая светлая тема приложения. */
export const linenTheme = defineTheme({
  id: 'linen',
  name: 'Лён',
  scheme: 'light',
  colors: {
    background: {
      start: '#FCF7DF',
      mid: '#EDE8D5',
      end: '#E4D0B4',
      sheen: {
        start: '#F0E2CC',
        startOpacity: 0.52,
        mid: '#FCF7DF',
        midOpacity: 0,
        end: '#D4BC98',
        endOpacity: 0.42,
      },
    },
    text: {
      primary: '#3E3630',
      secondary: '#A79A8A',
      accent: '#E53935',
      inverse: '#FCF7DF',
    },
    input: {
      border: '#3E3630',
      placeholder: 'rgba(62, 54, 48, 0.4)',
    },
    overlay: {
      border: 'rgba(167, 154, 138, 0.35)',
      fill: 'rgba(255, 255, 255, 0.48)',
      muted: 'rgba(167, 154, 138, 0.35)',
    },
    holiday: {
      cardBackground: 'rgba(232, 168, 152, 0.46)',
      cardBorder: 'rgba(176, 96, 82, 0.38)',
    },
  },
});
