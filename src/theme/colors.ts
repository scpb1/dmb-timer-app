export const colors = {
  dark: {
    background: {
      start: '#1a1a1c',
      end: '#2d2d30',
    },
    text: {
      primary: '#F5F2EB',
      secondary: 'rgba(255, 255, 255, 0.5)',
      accent: '#e53935',
    },
    input: {
      border: 'rgba(245, 242, 235, 0.5)',
      placeholder: 'rgba(245, 242, 235, 0.35)',
    },
  },
  light: {
    background: {
      start: '#FCF7DF',
      end: '#C7D3DB',
    },
    text: {
      primary: '#3E3630',
      secondary: '#A79A8A',
      accent: '#e53935',
    },
    input: {
      border: '#3E3630',
      placeholder: 'rgba(62, 54, 48, 0.4)',
    },
  },
} as const;

export type ThemeColors = typeof colors;
