import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { parseISO } from 'date-fns';
import { Feather } from '@expo/vector-icons';

import { DatePicker } from '@/components/common/DatePicker';
import { SettingsField } from '@/components/common/SettingsField';
import type { CustomTimerInput } from '@/hooks/useServiceTimer';
import type { CustomTimerRecord } from '@/types/timer';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface ExtraTimerFormModalProps {
  visible: boolean;
  timer: CustomTimerRecord | null;
  onClose: () => void;
  onSave: (input: CustomTimerInput) => Promise<boolean>;
  onDelete?: () => Promise<void>;
}

export function ExtraTimerFormModal({
  visible,
  timer,
  onClose,
  onSave,
  onDelete,
}: ExtraTimerFormModalProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setName(timer?.name ?? '');
    setStartDate(timer ? parseISO(timer.startDate) : null);
    setEndDate(timer ? parseISO(timer.endDate) : null);
    setIsSaving(false);
  }, [timer, visible]);

  const handleSave = async () => {
    if (!name.trim() || !startDate || !endDate) {
      Alert.alert('Заполните поля', 'Нужны название и обе даты');
      return;
    }

    setIsSaving(true);
    const ok = await onSave({ name, startDate, endDate });
    setIsSaving(false);
    if (ok) {
      onClose();
    } else {
      Alert.alert('Ошибка', 'Дата окончания должна быть позже начала');
    }
  };

  const handleDelete = () => {
    if (!onDelete) {
      return;
    }
    Alert.alert('Удалить таймер?', 'Сам таймер службы останется', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          await onDelete();
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.title}>{timer ? 'Таймер' : 'Новый таймер'}</Text>
              <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Закрыть">
                <Feather name="x" size={22} color={colors.light.text.primary} />
              </Pressable>
            </View>

            <SettingsField
              label="Название"
              value={name}
              onChangeText={setName}
              placeholder="Учебка, командировка…"
            />

            <DatePicker label="Начало" value={startDate} onChange={setStartDate} />
            <DatePicker
              label="Окончание"
              value={endDate}
              onChange={setEndDate}
              minimumDate={startDate ?? undefined}
            />

            <Pressable
              style={[styles.saveButton, isSaving && styles.disabled]}
              onPress={() => void handleSave()}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>{isSaving ? 'Сохранение…' : 'Сохранить'}</Text>
            </Pressable>

            {onDelete ? (
              <Pressable style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteText}>Удалить таймер</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.light.background.start,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
  },
  title: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 22,
    color: colors.light.text.primary,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.light.text.primary,
    borderRadius: 4,
    paddingVertical: 14,
  },
  saveButtonText: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
    color: colors.light.background.start,
  },
  disabled: {
    opacity: 0.6,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  deleteText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    color: colors.light.text.accent,
  },
});
