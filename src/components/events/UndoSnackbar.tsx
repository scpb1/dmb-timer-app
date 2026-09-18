import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface UndoSnackbarProps {
  visible: boolean;
  message?: string;
  onUndo: () => void;
}

export function UndoSnackbar({
  visible,
  message = 'Событие удалено',
  onUndo,
}: UndoSnackbarProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.snackbar}>
        <Text style={styles.message}>{message}</Text>
        <Pressable onPress={onUndo} hitSlop={8} accessibilityRole="button">
          <Text style={styles.action}>Отменить удаление</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 108,
    zIndex: 10,
  },
  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.light.text.primary,
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  message: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: '#FCF7DF',
    flex: 1,
    marginRight: 12,
  },
  action: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
    color: '#FCF7DF',
    textDecorationLine: 'underline',
  },
});
