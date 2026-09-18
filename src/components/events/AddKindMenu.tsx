import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface AddKindMenuProps {
  visible: boolean;
  onClose: () => void;
  onChooseEvent: () => void;
  onChooseHoliday: () => void;
}

export function AddKindMenu({
  visible,
  onClose,
  onChooseEvent,
  onChooseHoliday,
}: AddKindMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Что добавить?</Text>
          <Pressable
            style={styles.option}
            onPress={onChooseEvent}
            accessibilityRole="button"
            accessibilityLabel="Добавить событие"
          >
            <Text style={styles.optionTitle}>Событие</Text>
            <Text style={styles.optionHint}>День службы: ддд или точная дата</Text>
          </Pressable>
          <Pressable
            style={[styles.option, styles.optionHoliday]}
            onPress={onChooseHoliday}
            accessibilityRole="button"
            accessibilityLabel="Добавить праздник"
          >
            <Text style={styles.optionTitle}>Праздник</Text>
            <Text style={styles.optionHint}>Появится на все годы службы и даёт тему письма в этот день</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FCF7DF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    gap: 10,
    zIndex: 1,
  },
  title: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 18,
    color: colors.light.text.primary,
    marginBottom: 6,
  },
  option: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
  },
  optionHoliday: {
    backgroundColor: colors.light.holiday.cardBackground,
    borderColor: colors.light.holiday.cardBorder,
  },
  optionTitle: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
    color: colors.light.text.primary,
    marginBottom: 4,
  },
  optionHint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    color: colors.light.text.secondary,
    lineHeight: 18,
  },
});
