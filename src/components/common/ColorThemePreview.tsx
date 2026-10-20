import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { DotGridLegendMark } from '@/components/timer/DotGridCell';
import { layout, useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import type { ColorTokens } from '@/theme/tokens';

function PreviewGradient({
  tokens,
  width,
  height,
}: {
  tokens: ColorTokens;
  width: number;
  height: number;
}) {
  if (width <= 0) {
    return null;
  }

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="previewBase" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={tokens.background.start} />
          <Stop offset="45%" stopColor={tokens.background.mid} />
          <Stop offset="100%" stopColor={tokens.background.end} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill="url(#previewBase)" />
    </Svg>
  );
}

/** Уменьшенный фрагмент главного экрана для предпросмотра темы */
export function ColorThemePreview() {
  const theme = useAppTheme();
  const accent = theme.text.accent;
  const emptyBorder = theme.overlay.border;
  const [skySize, setSkySize] = useState({ width: 0, height: 72 });

  return (
    <View style={[styles.shell, { borderColor: theme.overlay.border }]}>
      <View
        style={[styles.sky, { backgroundColor: theme.background.start }]}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setSkySize((current) =>
            current.width === width && current.height === height ? current : { width, height },
          );
        }}
      >
        <PreviewGradient tokens={theme} width={skySize.width} height={skySize.height} />
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.overlay.fill,
            borderColor: theme.overlay.border,
          },
        ]}
      >
        <Text style={[styles.headline, { color: theme.text.secondary }]} numberOfLines={1}>
          Новый год · через 12 дней
        </Text>
        <View style={styles.heroRow}>
          <Text style={[styles.hero, { color: theme.text.primary }]}>
            303
            <Text style={[styles.heroUnit, { color: theme.text.secondary }]}> ддд</Text>
          </Text>
          <View style={styles.meta}>
            <Text style={[styles.metaStrong, { color: theme.text.primary }]}>62%</Text>
            <Text style={[styles.metaMuted, { color: theme.text.secondary }]}>1 янв 2027</Text>
          </View>
        </View>
        <View style={[styles.barTrack, { backgroundColor: theme.overlay.muted }]}>
          <View style={[styles.barFill, { width: '62%', backgroundColor: accent }]} />
        </View>
      </View>

      <View style={styles.dotsRow}>
        {[true, true, true, false, false].map((filled, index) => (
          <DotGridLegendMark
            key={index}
            shape="circle"
            kind={index === 4 ? 'final' : filled ? 'filled' : 'empty'}
            accent={accent}
            emptyBorder={emptyBorder}
            size={9}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: layout.cardBorderRadius,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 12,
  },
  sky: {
    height: 72,
    width: '100%',
  },
  card: {
    marginHorizontal: 12,
    marginTop: -28,
    borderRadius: layout.cardBorderRadius,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headline: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 4,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hero: {
    fontFamily: typography.fontFamily.display,
    fontSize: 28,
    lineHeight: 30,
  },
  heroUnit: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
  },
  meta: {
    alignItems: 'flex-end',
  },
  metaStrong: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 12,
  },
  metaMuted: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 11,
    marginTop: 2,
  },
  barTrack: {
    marginTop: 8,
    height: 4,
    borderRadius: 99,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 99,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 12,
  },
});
