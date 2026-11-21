import { FlexWidget, TextWidget } from 'react-native-android-widget';

import { typography } from '@/theme/typography';
import type { NativeWidgetColors } from '@/utils/widgetStudio';

export interface NativeStatsWidgetProps {
  elapsedValue: string;
  elapsedLabel: string;
  remainingValue: string;
  remainingLabel: string;
  background: NativeWidgetColors['background'];
  text: NativeWidgetColors['text'];
  muted: NativeWidgetColors['muted'];
  accent?: NativeWidgetColors['accent'];
  overlayFill: NativeWidgetColors['overlayFill'];
  overlayBorder: NativeWidgetColors['overlayBorder'];
  overlayMuted: NativeWidgetColors['overlayMuted'];
}

function StatColumn({
  title,
  value,
  unit,
  text,
  muted,
}: {
  title: string;
  value: string;
  unit: string;
  text: NativeWidgetColors['text'];
  muted: NativeWidgetColors['muted'];
}) {
  return (
    <FlexWidget style={{ flex: 1, alignItems: 'center', padding: 8 }}>
      <TextWidget
        text={title}
        style={{ fontSize: 14, color: muted, fontFamily: typography.fontFamily.sans }}
      />
      <TextWidget
        text={value}
        style={{
          fontSize: 32,
          color: text,
          fontFamily: typography.fontFamily.display,
          marginTop: 4,
        }}
      />
      <TextWidget
        text={unit}
        style={{
          fontSize: 14,
          color: muted,
          fontFamily: typography.fontFamily.sans,
          marginTop: 2,
        }}
      />
    </FlexWidget>
  );
}

export function StatsWidget({
  elapsedValue,
  elapsedLabel,
  remainingValue,
  remainingLabel,
  background,
  text,
  muted,
  overlayFill,
  overlayBorder,
}: NativeStatsWidgetProps) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: background,
        justifyContent: 'center',
        padding: 12,
      }}
    >
      <FlexWidget
        style={{
          width: 'match_parent',
          backgroundColor: overlayFill,
          borderColor: overlayBorder,
          borderWidth: 1,
          borderRadius: 4,
          flexDirection: 'row',
          alignItems: 'center',
          padding: 8,
        }}
      >
        <StatColumn title="прошло" value={elapsedValue} unit={elapsedLabel} text={text} muted={muted} />
        <FlexWidget
          style={{
            width: 1,
            height: 72,
            backgroundColor: overlayBorder,
          }}
        />
        <StatColumn
          title="осталось"
          value={remainingValue}
          unit={remainingLabel}
          text={text}
          muted={muted}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
