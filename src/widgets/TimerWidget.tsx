import { FlexWidget, TextWidget } from 'react-native-android-widget';

import type { TimerWidgetPayload } from '@/utils/timerWidget';

export function TimerWidget({ name, primary, label, percent }: TimerWidgetPayload) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#FCF7DF',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
      }}
    >
      <TextWidget
        text={name}
        style={{
          fontSize: 13,
          color: '#A79A8A',
        }}
      />
      <TextWidget
        text={primary}
        style={{
          fontSize: 42,
          color: '#3E3630',
          fontWeight: 'bold',
          marginTop: 4,
        }}
      />
      <TextWidget
        text={label}
        style={{
          fontSize: 14,
          color: '#A79A8A',
          marginTop: 2,
        }}
      />
      {percent ? (
        <TextWidget
          text={percent}
          style={{
            fontSize: 13,
            color: '#e53935',
            marginTop: 6,
          }}
        />
      ) : null}
    </FlexWidget>
  );
}
