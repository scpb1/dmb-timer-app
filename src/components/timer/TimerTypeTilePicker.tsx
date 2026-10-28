import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { TIMER_TYPE_LABELS, type TimerType } from '@/types/timer';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

const TIMER_TYPES: TimerType[] = ['circular', 'linear', 'frame', 'dotGrid', 'milestones'];

const DOT_GRID_PREVIEW_COLUMNS = 6;
const DOT_GRID_PREVIEW_ROWS = 3;
const DOT_GRID_PREVIEW_FILLED = 7;

const PREVIEW_RING_SIZE = 52;
const PREVIEW_RING_STROKE = 5;

function CircularTimerPreview({ trackColor, fillColor }: { trackColor: string; fillColor: string }) {
  const radius = (PREVIEW_RING_SIZE - PREVIEW_RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const filledLength = circumference / 3;
  const center = PREVIEW_RING_SIZE / 2;

  return (
    <Svg width={PREVIEW_RING_SIZE} height={PREVIEW_RING_SIZE}>
      <G rotation={-90} origin={`${center}, ${center}`}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={PREVIEW_RING_STROKE}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={fillColor}
          strokeWidth={PREVIEW_RING_STROKE}
          fill="none"
          strokeDasharray={`${filledLength} ${circumference - filledLength}`}
          strokeLinecap="butt"
        />
      </G>
    </Svg>
  );
}

interface TimerTypeTilePickerProps {
  value: TimerType;
  onChange: (value: TimerType) => void;
}

function TimerTypePreview({
  type,
  trackColor,
  fillColor,
  textColor,
}: {
  type: TimerType;
  trackColor: string;
  fillColor: string;
  textColor: string;
}) {
  switch (type) {
    case 'circular':
      return <CircularTimerPreview trackColor={trackColor} fillColor={fillColor} />;
    case 'linear':
      return (
        <View style={[styles.previewBarTrack, { backgroundColor: trackColor }]}>
          <View style={[styles.previewBarFill, { backgroundColor: fillColor }]} />
        </View>
      );
    case 'frame':
      return (
        <View style={[styles.previewFrame, { borderColor: textColor }]}>
          <Text style={[styles.previewFrameText, { color: textColor }]}>287</Text>
        </View>
      );
    case 'dotGrid': {
      const total = DOT_GRID_PREVIEW_COLUMNS * DOT_GRID_PREVIEW_ROWS;
      return (
        <View style={styles.previewDotsGrid}>
          {Array.from({ length: total }, (_, index) => {
            const filled = index < DOT_GRID_PREVIEW_FILLED;
            return (
              <View
                key={index}
                style={[
                  styles.previewDotCell,
                  filled
                    ? { backgroundColor: fillColor }
                    : { borderColor: trackColor, backgroundColor: 'transparent' },
                ]}
              />
            );
          })}
        </View>
      );
    }
    case 'milestones':
      return (
        <View style={styles.previewMilestones}>
          <View style={[styles.previewMilestonesSpine, { backgroundColor: trackColor }]} />
          {([true, true, false] as const).map((filled, index) => (
            <View
              key={index}
              style={[styles.previewMilestoneRow, { top: 6 + index * 17 }]}
            >
              <View
                style={[
                  styles.previewMilestoneDot,
                  filled
                    ? { backgroundColor: fillColor }
                    : {
                        borderColor: fillColor,
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                      },
                ]}
              />
              <View style={[styles.previewMilestoneTick, { backgroundColor: trackColor }]} />
            </View>
          ))}
        </View>
      );
    default:
      return null;
  }
}

export function TimerTypeTilePicker({ value, onChange }: TimerTypeTilePickerProps) {
  const theme = useAppTheme();
  const trackColor = theme.overlay.border;
  const fillColor = theme.text.primary;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.text.secondary }]}>Тип таймера</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TIMER_TYPES.map((type) => {
          const isSelected = type === value;
          const title = TIMER_TYPE_LABELS[type];
          return (
            <Pressable
              key={type}
              style={[
                styles.tile,
                {
                  borderColor: theme.overlay.border,
                  backgroundColor: theme.overlay.fill,
                },
                isSelected && {
                  borderColor: theme.text.primary,
                  backgroundColor: theme.overlay.muted,
                },
              ]}
              onPress={() => onChange(type)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={title}
            >
              <View style={[styles.previewBox, { backgroundColor: theme.overlay.muted }]}>
                <TimerTypePreview
                  type={type}
                  trackColor={trackColor}
                  fillColor={fillColor}
                  textColor={theme.text.primary}
                />
              </View>
              <Text style={[styles.tileTitle, { color: theme.text.primary }]} numberOfLines={2}>
                {title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 20,
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    marginBottom: 8,
  },
  scrollContent: {
    gap: 10,
    paddingRight: 4,
  },
  tile: {
    width: 118,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 12,
    alignItems: 'center',
  },
  previewBox: {
    width: '100%',
    height: 72,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tileTitle: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
  },
  previewBarTrack: {
    width: 72,
    height: 8,
    borderRadius: 99,
    overflow: 'hidden',
  },
  previewBarFill: {
    width: '35%',
    height: '100%',
    borderRadius: 99,
  },
  previewFrame: {
    borderWidth: 2,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  previewFrameText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 18,
    fontWeight: '300',
  },
  previewDotsGrid: {
    width: DOT_GRID_PREVIEW_COLUMNS * 7 + (DOT_GRID_PREVIEW_COLUMNS - 1) * 3,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
  },
  previewDotCell: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1,
  },
  previewMilestones: {
    width: 48,
    height: 52,
    position: 'relative',
  },
  previewMilestonesSpine: {
    position: 'absolute',
    left: 10,
    top: 4,
    bottom: 4,
    width: 3,
    borderRadius: 2,
  },
  previewMilestoneRow: {
    position: 'absolute',
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    height: 14,
  },
  previewMilestoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 7,
  },
  previewMilestoneTick: {
    width: 22,
    height: 2,
    borderRadius: 1,
    marginLeft: 6,
  },
});
