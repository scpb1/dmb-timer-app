export const typography = {
  fontFamily: {
    sans: 'dmb-timer-sans',
    sansLight: 'dmb-timer-sans-Light',
    sansBold: 'dmb-timer-sans-Bold',
    display: 'BlackOpsOne-Regular',
    /** @deprecated используй sans */
    primary: 'dmb-timer-sans',
  },
  animation: {
    textAppearMs: 600,
    textLineDelayMs: 1500,
    themeTransitionMs: 1200,
    stepFadeOutMs: 400,
    stepPauseMs: 300,
    highlightDelayMs: 700,
    overlayDelayMs: 2000,
    pulseDurationMs: 1800,
  },
} as const;
