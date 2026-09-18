import { StyleSheet, Text, View } from 'react-native';

import { MoodIcon } from '@/components/trackers/MoodIcon';
import { getMoodMeta, type TrackerMood } from '@/types/trackers';
import { typography } from '@/theme/typography';

interface MoodTagsProps {
  moods?: TrackerMood[];
  compact?: boolean;
}

export function MoodTags({ moods, compact = false }: MoodTagsProps) {
  if (!moods || moods.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {moods.map((moodId) => {
        const meta = getMoodMeta(moodId);
        if (!meta) {
          return null;
        }

        return (
          <View
            key={moodId}
            style={[
              styles.tag,
              { backgroundColor: meta.bgColor, borderColor: `${meta.color}55` },
              compact && styles.tagCompact,
            ]}
          >
            <MoodIcon moodId={moodId} size={compact ? 12 : 14} />
            <Text style={[styles.label, { color: meta.color }, compact && styles.labelCompact]}>
              {meta.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagCompact: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
  },
  labelCompact: {
    fontSize: 11,
  },
});
