import { useAppTheme } from '@/theme';

export function useMilestoneVizColors(photoBackground: boolean) {
  const theme = useAppTheme();
  return {
    accent: photoBackground ? '#F2F0EC' : theme.text.accent,
    muted: photoBackground ? 'rgba(242, 240, 236, 0.78)' : theme.text.secondary,
    nodeBorder: photoBackground ? 'rgba(242, 240, 236, 0.55)' : theme.text.secondary,
    primary: theme.text.primary,
    cardFill: photoBackground ? 'transparent' : theme.overlay.fill,
    cardBorder: photoBackground ? 'rgba(242, 240, 236, 0.38)' : theme.overlay.border,
    hereBg: photoBackground ? 'rgba(242, 240, 236, 0.12)' : 'rgba(229, 57, 53, 0.07)',
    photoText: photoBackground,
  };
}
