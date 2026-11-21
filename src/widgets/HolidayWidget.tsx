import { FlexWidget, TextWidget } from 'react-native-android-widget';

import { typography } from '@/theme/typography';
import type { NativeWidgetColors } from '@/utils/widgetStudio';

export interface NativeHolidayWidgetProps {
  name: string;
  daysUntil: string;
  dateLabel: string;
  background: NativeWidgetColors['background'];
  text: NativeWidgetColors['text'];
  muted: NativeWidgetColors['muted'];
  accent: NativeWidgetColors['accent'];
  overlayFill: NativeWidgetColors['overlayFill'];
  overlayBorder: NativeWidgetColors['overlayBorder'];
  overlayMuted: NativeWidgetColors['overlayMuted'];
}

export function HolidayWidget({
  name,
  daysUntil,
  dateLabel,
  background,
  text,
  muted,
  overlayFill,
  overlayBorder,
}: NativeHolidayWidgetProps) {
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
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 14,
        }}
      >
        <TextWidget
          text={name}
          style={{
            fontSize: 16,
            color: text,
            fontFamily: typography.fontFamily.sans,
          }}
        />
        {dateLabel ? (
          <TextWidget
            text={dateLabel}
            style={{
              fontSize: 14,
              color: muted,
              fontFamily: typography.fontFamily.sans,
              marginTop: 4,
            }}
          />
        ) : null}
        {daysUntil ? (
          <TextWidget
            text={daysUntil}
            style={{
              fontSize: 14,
              color: muted,
              fontFamily: typography.fontFamily.sans,
              marginTop: 2,
            }}
          />
        ) : null}
      </FlexWidget>
    </FlexWidget>
  );
}
