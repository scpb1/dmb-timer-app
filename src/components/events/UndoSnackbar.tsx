import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme';
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
  const theme = useAppTheme();

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.snackbar, { backgroundColor: theme.text.primary }]}>
        <Text style={[styles.message, { color: theme.text.inverse }]}>{message}</Text>
        <Pressable
          onPress={onUndo}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Отменить удаление"
        >
          <Text style={[styles.action, { color: theme.text.inverse }]}>Отменить удаление</Text>
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
    borderRadius: 4,
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
    flex: 1,
    marginRight: 12,
  },
  action: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
