import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MoodIcon } from '@/components/trackers/MoodIcon';
import { TRACKER_MOODS, type TrackerMood } from '@/types/trackers';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface MoodPickerProps {
  value: TrackerMood[];
  onChange: (moods: TrackerMood[]) => void;
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  const toggleMood = (moodId: TrackerMood) => {
    if (value.includes(moodId)) {
      onChange(value.filter((item) => item !== moodId));
      return;
    }
    onChange([...value, moodId]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Настроение</Text>
      <View style={styles.grid}>
        {TRACKER_MOODS.map((mood) => {
          const isSelected = value.includes(mood.id);

          return (
            <Pressable
              key={mood.id}
              style={[
                styles.chip,
                {
                  borderColor: isSelected ? mood.color : 'rgba(167, 154, 138, 0.3)',
                  backgroundColor: isSelected ? mood.bgColor : 'rgba(255, 255, 255, 0.5)',
                },
                isSelected && styles.chipSelected,
              ]}
              onPress={() => toggleMood(mood.id)}
            >
              <MoodIcon moodId={mood.id} size={15} />
              <Text
                style={[
                  styles.chipText,
                  isSelected && { color: mood.color, fontFamily: typography.fontFamily.sansBold },
                ]}
              >
                {mood.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.secondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipSelected: {
    borderWidth: 1.5,
  },
  chipText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    color: colors.light.text.primary,
  },
});
