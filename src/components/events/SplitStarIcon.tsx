import { useId, useMemo } from 'react';
import Svg, { ClipPath, Defs, Path, Rect } from 'react-native-svg';

import { SPLIT_STAR_ICON_ID } from '@/utils/eventGlyphs';

const VIEW = 24;

const OUTER_STAR_PATH =
  'M 12.000 2.000 L 14.361 9.265 L 22.000 9.265 L 15.820 13.756 L 18.180 21.021 L 12.000 16.531 L 5.820 21.021 L 8.180 13.756 L 2.000 9.265 L 9.639 9.265 Z';

const HOLLOW_STAR_PATH = `${OUTER_STAR_PATH} M 10.820 10.890 L 7.000 10.890 L 10.090 13.135 L 8.910 16.768 L 12.000 14.523 L 15.090 16.768 L 13.910 13.135 L 17.000 10.890 L 13.180 10.890 L 12.000 7.257 Z`;

/** Граница горизонтального зазора, как у исходной третьей иконки. */
const GAP_TOP = 10.88;
const GAP_BOTTOM = 12.65;

export type StarIconVariant = 'filled' | 'hollow' | 'split';

export function starIconVariantForName(name: string): StarIconVariant | undefined {
  if (name === 'star') {
    return 'filled';
  }
  if (name === 'star-outline') {
    return 'hollow';
  }
  if (name === SPLIT_STAR_ICON_ID) {
    return 'split';
  }
  return undefined;
}

interface SplitStarIconProps {
  size: number;
  color: string;
  variant?: StarIconVariant;
}

export function SplitStarIcon({ size, color, variant = 'hollow' }: SplitStarIconProps) {
  const uid = useId().replace(/:/g, '');
  const topClip = useMemo(() => `splitStarTop-${uid}`, [uid]);
  const bottomClip = useMemo(() => `splitStarBottom-${uid}`, [uid]);

  if (variant === 'filled') {
    return (
      <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
        <Path d={OUTER_STAR_PATH} fill={color} />
      </Svg>
    );
  }

  if (variant === 'hollow') {
    return (
      <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
        <Path d={HOLLOW_STAR_PATH} fill={color} fillRule="evenodd" clipRule="evenodd" />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
      <Defs>
        <ClipPath id={topClip}>
          <Rect x={0} y={0} width={VIEW} height={GAP_TOP} />
        </ClipPath>
        <ClipPath id={bottomClip}>
          <Rect x={0} y={GAP_BOTTOM} width={VIEW} height={VIEW - GAP_BOTTOM} />
        </ClipPath>
      </Defs>
      <Path d={HOLLOW_STAR_PATH} fill={color} fillRule="evenodd" clipPath={`url(#${topClip})`} />
      <Path d={HOLLOW_STAR_PATH} fill={color} fillRule="evenodd" clipPath={`url(#${bottomClip})`} />
    </Svg>
  );
}
