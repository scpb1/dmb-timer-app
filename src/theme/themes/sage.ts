import { defineTheme } from '@/theme/tokens';

export const sageTheme = defineTheme({
  id: 'sage',
  name: 'Шалфей',
  scheme: 'light',
  colors: {
    background: {
      start: '#F3F4E8',
      mid: '#DDE3D0',
      end: '#B7C4B0',
      sheen: {
        start: '#C8D6C4',
        startOpacity: 0.55,
        mid: '#F3F4E8',
        midOpacity: 0,
        end: '#9AAD96',
        endOpacity: 0.42,
      },
    },
    text: {
      primary: '#2F3A32',
      secondary: '#7E8B7A',
      accent: '#4F7A5A',
      inverse: '#F3F4E8',
    },
    input: {
      border: '#2F3A32',
      placeholder: 'rgba(47, 58, 50, 0.4)',
    },
    overlay: {
      border: 'rgba(126, 139, 122, 0.38)',
      fill: 'rgba(255, 255, 255, 0.48)',
      muted: 'rgba(126, 139, 122, 0.35)',
    },
    holiday: {
      cardBackground: 'rgba(168, 188, 148, 0.44)',
      cardBorder: 'rgba(88, 124, 88, 0.4)',
    },
  },
});
