import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme';
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
  const theme = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.background.start }]}>
          <Text style={[styles.title, { color: theme.text.primary }]}>Что добавить?</Text>
          <Pressable
            style={[
              styles.option,
              {
                backgroundColor: theme.overlay.fill,
                borderColor: theme.overlay.border,
              },
            ]}
            onPress={onChooseEvent}
            accessibilityRole="button"
            accessibilityLabel="Добавить событие"
          >
            <Text style={[styles.optionTitle, { color: theme.text.primary }]}>Событие</Text>
            <Text style={[styles.optionHint, { color: theme.text.secondary }]}>Один раз за службу</Text>
          </Pressable>
          <Pressable
            style={[
              styles.option,
              {
                backgroundColor: theme.holiday.cardBackground,
                borderColor: theme.holiday.cardBorder,
              },
            ]}
            onPress={onChooseHoliday}
            accessibilityRole="button"
            accessibilityLabel="Добавить праздник"
          >
            <Text style={[styles.optionTitle, { color: theme.text.primary }]}>Праздник</Text>
            <Text style={[styles.optionHint, { color: theme.text.secondary }]}>Каждый год</Text>
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
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    gap: 10,
    zIndex: 1,
  },
  title: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 18,
    marginBottom: 6,
  },
  option: {
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  optionTitle: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
    marginBottom: 4,
  },
  optionHint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
  },
});
