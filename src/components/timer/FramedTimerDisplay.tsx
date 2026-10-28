import { StyleSheet, Text, View } from 'react-native';

import { EventGlyphBadge } from '@/components/events/EventGlyphBadge';
import { timerEventGlyphColorOverride } from '@/components/timer/timerEventGlyphColor';
import { CenterDisplayToggle } from '@/components/timer/CenterDisplayToggle';
import type { TimerCenterDisplay } from '@/types/timer';
import { timerPhotoTextStyles } from '@/components/timer/timerPhotoStyles';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import type { EventGlyph } from '@/utils/eventGlyphs';
import {
  formatTimerUpcomingCountdown,
  timerUpcomingDisplayName,
  type TimerUpcomingItem,
} from '@/utils/timerUpcoming';

interface FramedTimerDisplayProps {
  primaryValue: string;
  unitLabel: string;
  upcoming: TimerUpcomingItem | null;
  glyph: EventGlyph | null;
  photoBackground?: boolean;
  centerDisplay?: TimerCenterDisplay;
  onCenterDisplayChange?: (display: TimerCenterDisplay) => void;
  omitDemobilizationCountdown?: boolean;
}

export function FramedTimerDisplay({
  primaryValue,
  unitLabel,
  upcoming,
  glyph,
  photoBackground = false,
  centerDisplay = 'remaining',
  onCenterDisplayChange,
  omitDemobilizationCountdown = false,
}: FramedTimerDisplayProps) {
  const theme = useAppTheme();
  const textPrimary = photoBackground ? '#F2F0EC' : theme.text.primary;
  const textSecondary = photoBackground ? '#F2F0EC' : theme.text.secondary;
  const borderColor = photoBackground ? 'rgba(242, 240, 236, 0.92)' : theme.text.primary;

  const showUpcomingSubtitle = upcoming
    ? formatTimerUpcomingCountdown(upcoming, new Date(), omitDemobilizationCountdown)
    : null;

  return (
    <View style={styles.root}>
      {onCenterDisplayChange ? (
        <View style={styles.toggleRow}>
          <CenterDisplayToggle
            value={centerDisplay}
            onChange={onCenterDisplayChange}
            photoBackground={photoBackground}
          />
        </View>
      ) : null}

      <View style={[styles.frame, { borderColor }]}>
        <View style={styles.topSection}>
          <Text
            style={[
              styles.primaryValue,
              { color: textPrimary },
              photoBackground && timerPhotoTextStyles.heroNumber,
            ]}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {primaryValue}
          </Text>
          <Text
            style={[styles.unitLabel, { color: textSecondary }, photoBackground && styles.photoText]}
          >
            {unitLabel}
          </Text>
        </View>

        {upcoming && glyph ? (
          <>
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
              <View style={styles.iconWrap}>
                <EventGlyphBadge
                  glyph={glyph}
                  compact
                  color={timerEventGlyphColorOverride(glyph, photoBackground)}
                />
              </View>
              <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
            </View>

            <View style={styles.bottomSection}>
              <Text
                style={[
                  styles.upcomingName,
                  { color: textPrimary },
                  photoBackground && styles.photoText,
                ]}
                numberOfLines={2}
              >
                {timerUpcomingDisplayName(upcoming)}
              </Text>
              {showUpcomingSubtitle ? (
                <Text
                  style={[
                    styles.upcomingSubtitle,
                    { color: textSecondary },
                    photoBackground && styles.photoText,
                  ]}
                >
                  {showUpcomingSubtitle}
                </Text>
              ) : null}
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  toggleRow: {
    width: '100%',
    marginBottom: 8,
  },
  frame: {
    width: '100%',
    maxWidth: 320,
    minHeight: 280,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    paddingVertical: 28,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    paddingBottom: 12,
  },
  primaryValue: {
    fontFamily: typography.fontFamily.display,
    fontSize: 72,
    lineHeight: 76,
    textAlign: 'center',
  },
  unitLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 18,
    marginTop: 4,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth * 2,
    opacity: 0.85,
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  bottomSection: {
    alignItems: 'center',
    paddingTop: 8,
    gap: 4,
  },
  upcomingName: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 17,
    textAlign: 'center',
  },
  upcomingSubtitle: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.9,
  },
  photoText: {
    textShadowColor: 'rgba(0, 0, 0, 0.48)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
