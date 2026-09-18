import { StyleSheet, Text, TextInput, View } from 'react-native';

import { parseDurationPart } from '@/utils/durationFormat';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface MeetingDurationInputProps {
  hours: number;
  minutes: number;
  onChangeHours: (value: number) => void;
  onChangeMinutes: (value: number) => void;
}

export function MeetingDurationInput({
  hours,
  minutes,
  onChangeHours,
  onChangeMinutes,
}: MeetingDurationInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Длительность</Text>
      <View style={styles.row}>
        <View style={styles.field}>
          <TextInput
            style={styles.input}
            value={String(hours)}
            onChangeText={(text) => onChangeHours(parseDurationPart(text, 99))}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={styles.unit}>ч</Text>
        </View>
        <View style={styles.field}>
          <TextInput
            style={styles.input}
            value={String(minutes)}
            onChangeText={(text) => onChangeMinutes(parseDurationPart(text, 59))}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={styles.unit}>мин</Text>
        </View>
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    width: 64,
    height: 44,
    borderWidth: 1,
    borderColor: colors.light.input.border,
    borderRadius: 6,
    textAlign: 'center',
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 18,
    color: colors.light.text.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  unit: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.secondary,
  },
});
