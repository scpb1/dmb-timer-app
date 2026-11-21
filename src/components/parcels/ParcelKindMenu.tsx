import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ParcelKind } from '@/types/parcels';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import { parcelKindHint, parcelKindLabel } from '@/utils/parcelCalculations';

interface ParcelKindMenuProps {
  visible: boolean;
  onClose: () => void;
  onChoose: (kind: ParcelKind) => void;
}

const OPTIONS: ParcelKind[] = ['parcel', 'handover'];

export function ParcelKindMenu({ visible, onClose, onChoose }: ParcelKindMenuProps) {
  const theme = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.background.start }]}>
          <Text style={[styles.title, { color: theme.text.primary }]}>Что записать?</Text>
          {OPTIONS.map((kind) => (
            <Pressable
              key={kind}
              style={[
                styles.option,
                {
                  backgroundColor: theme.overlay.fill,
                  borderColor: theme.overlay.border,
                },
              ]}
              onPress={() => onChoose(kind)}
              accessibilityRole="button"
              accessibilityLabel={parcelKindLabel(kind)}
            >
              <Text style={[styles.optionTitle, { color: theme.text.primary }]}>
                {parcelKindLabel(kind)}
              </Text>
              <Text style={[styles.optionHint, { color: theme.text.secondary }]}>
                {parcelKindHint(kind)}
              </Text>
            </Pressable>
          ))}
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
    marginBottom: 4,
  },
  option: {
    borderRadius: 4,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionTitle: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
    marginBottom: 4,
  },
  optionHint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
  },
});
