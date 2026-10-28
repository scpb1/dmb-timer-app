import { Image, StyleSheet, Text, View } from 'react-native';

import { ScreenBackground } from '@/components/common/ScreenBackground';
import { ArmyEventsChecklistColumns } from '@/components/timer/milestones/ArmyEventsChecklistColumns';
import { useAppTheme } from '@/theme';
import type { TimerSettings } from '@/types/timer';
import type { EventsTimelineItem } from '@/utils/eventsTimeline';
import { getBackgroundScrimColor } from '@/utils/timerBackground';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface ArmyEventsChecklistShareCardProps {
  width: number;
  height: number;
  settings: Pick<TimerSettings, 'backgroundImageUri' | 'backgroundDim'>;
  items: EventsTimelineItem[];
  showEventDates?: boolean;
}

/** Постер: только чеклист армейских событий на фоне таймера */
export function ArmyEventsChecklistShareCard({
  width,
  height,
  settings,
  items,
  showEventDates = false,
}: ArmyEventsChecklistShareCardProps) {
  const theme = useAppTheme();
  const hasPhotoBackground = Boolean(settings.backgroundImageUri);
  const titleColor = hasPhotoBackground ? '#F2F0EC' : theme.text.primary;

  return (
    <View style={[styles.card, { width, height }]} collapsable={false}>
      {settings.backgroundImageUri ? (
        <>
          <Image
            source={{ uri: settings.backgroundImageUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: getBackgroundScrimColor(settings.backgroundDim) },
            ]}
          />
        </>
      ) : (
        <ScreenBackground />
      )}

      <View style={styles.content}>
        <Text
          style={[
            styles.heading,
            { color: titleColor },
            hasPhotoBackground && styles.headingPhoto,
          ]}
        >
          Армейский год
        </Text>
        <ArmyEventsChecklistColumns
          items={items}
          photoBackground={hasPhotoBackground}
          compact
          showEventDates={showEventDates}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: colors.light.background.start,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 36,
    gap: 18,
  },
  heading: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  headingPhoto: {
    textShadowColor: 'rgba(0, 0, 0, 0.48)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
