import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget';

import { typography } from '@/theme/typography';
import type { WidgetTimerKind } from '@/types/widgets';
import type { NativeWidgetColors } from '@/utils/widgetStudio';

export interface NativeTimerWidgetProps {
  kind: WidgetTimerKind;
  primary: string;
  label: string;
  secondary: string | null;
  graphicSvg: string;
  background: NativeWidgetColors['background'];
  text: NativeWidgetColors['text'];
  muted: NativeWidgetColors['muted'];
  accent: NativeWidgetColors['accent'];
  overlayFill: NativeWidgetColors['overlayFill'];
  overlayBorder: NativeWidgetColors['overlayBorder'];
  overlayMuted: NativeWidgetColors['overlayMuted'];
}

export function TimerWidget({
  kind,
  primary,
  label,
  secondary,
  graphicSvg,
  background,
  text,
  muted,
  overlayBorder,
}: NativeTimerWidgetProps) {
  if (kind === 'circular') {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: background,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 8,
        }}
      >
        {graphicSvg ? (
          <SvgWidget svg={graphicSvg} style={{ width: 180, height: 180 }} />
        ) : null}
      </FlexWidget>
    );
  }

  if (kind === 'linear') {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: background,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
      >
        {graphicSvg ? (
          <SvgWidget svg={graphicSvg} style={{ width: 280, height: 24 }} />
        ) : null}
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 12,
          }}
        >
          <TextWidget
            text={primary}
            style={{
              fontSize: 28,
              color: text,
              fontFamily: typography.fontFamily.display,
            }}
          />
          {label && !primary.includes('%') ? (
            <TextWidget
              text={label}
              style={{
                fontSize: 16,
                color: muted,
                fontFamily: typography.fontFamily.sans,
                marginLeft: 6,
              }}
            />
          ) : null}
        </FlexWidget>
      </FlexWidget>
    );
  }

  if (kind === 'dotGrid') {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: background,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 12,
        }}
      >
        <TextWidget
          text={primary}
          style={{
            fontSize: 28,
            color: text,
            fontFamily: typography.fontFamily.display,
          }}
        />
        <TextWidget
          text={label}
          style={{
            fontSize: 13,
            color: muted,
            fontFamily: typography.fontFamily.sans,
            marginTop: 2,
            marginBottom: 8,
          }}
        />
        {graphicSvg ? (
          <SvgWidget svg={graphicSvg} style={{ width: 180, height: 90 }} />
        ) : null}
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: background,
        padding: 12,
      }}
    >
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          borderColor: overlayBorder,
          borderWidth: 1.5,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
      >
        {secondary ? (
          <TextWidget
            text={secondary}
            style={{
              fontSize: 13,
              color: muted,
              fontFamily: typography.fontFamily.sans,
            }}
          />
        ) : null}
        <TextWidget
          text={primary}
          style={{
            fontSize: 42,
            color: text,
            fontFamily: typography.fontFamily.display,
            marginTop: 4,
          }}
        />
        <TextWidget
          text={label}
          style={{
            fontSize: 16,
            color: muted,
            fontFamily: typography.fontFamily.sans,
            marginTop: 4,
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
