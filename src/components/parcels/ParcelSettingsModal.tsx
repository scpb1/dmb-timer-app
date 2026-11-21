import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { SettingsSegmented } from '@/components/common/SettingsSegmented';
import {
  PARCEL_REMINDER_INTERVALS,
  type ParcelReminderInterval,
  type ParcelSettings,
} from '@/types/parcels';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import { readNotificationsEnabled } from '@/services/holidayNotifications';
import { requestParcelNotificationPermission } from '@/utils/parcelNotifications';
import { reminderIntervalLabel } from '@/utils/parcelCalculations';

interface ParcelSettingsModalProps {
  visible: boolean;
  settings: ParcelSettings;
  onClose: () => void;
  onSave: (settings: ParcelSettings) => Promise<boolean>;
}

const INTERVAL_OPTIONS = PARCEL_REMINDER_INTERVALS.map((value) => ({
  value,
  label: reminderIntervalLabel(value),
}));

export function ParcelSettingsModal({
  visible,
  settings,
  onClose,
  onSave,
}: ParcelSettingsModalProps) {
  const theme = useAppTheme();
  const [reminderEnabled, setReminderEnabled] = useState(settings.reminderEnabled);
  const [interval, setInterval] = useState<ParcelReminderInterval>(settings.reminderIntervalDays);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setReminderEnabled(settings.reminderEnabled);
      setInterval(settings.reminderIntervalDays);
      setIsSaving(false);
    }
  }, [visible, settings]);

  const handleToggle = async (next: boolean) => {
    try {
      if (next) {
        const appEnabled = await readNotificationsEnabled();
        if (!appEnabled) {
          Alert.alert(
            'Нужны уведомления',
            'Сначала включите уведомления в настройках таймера. Без них напоминание о посылке не придёт.',
          );
          return;
        }
        const permission = await requestParcelNotificationPermission();
        if (permission === 'denied') {
          Alert.alert(
            'Нет разрешения',
            'Телефон не дал присылать уведомления. Разрешите их в настройках системы, если хотите напоминание.',
          );
          return;
        }
        if (permission === 'unavailable') {
          Alert.alert('Недоступно', 'На этом устройстве локальные уведомления не работают.');
          return;
        }
      }
      setReminderEnabled(next);
    } catch {
      Alert.alert('Ошибка', 'Не удалось проверить уведомления');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onSave({
      reminderEnabled,
      reminderIntervalDays: interval,
    });
    setIsSaving(false);
    if (success) {
      onClose();
    } else {
      Alert.alert('Ошибка', 'Не удалось сохранить настройки');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.background.start }]}>
          <View style={[styles.header, { borderBottomColor: theme.overlay.border }]}>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Закрыть">
              <Text style={[styles.headerAction, { color: theme.text.secondary }]}>Закрыть</Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Напоминание</Text>
            <Pressable onPress={() => void handleSave()} hitSlop={8} disabled={isSaving}>
              <Text style={[styles.headerAction, styles.headerConfirm, { color: theme.text.primary }]}>
                {isSaving ? '...' : 'Готово'}
              </Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={[styles.hint, { color: theme.text.secondary }]}>
              Одно тихое утреннее напоминание, если с последней отправки или передачки прошло больше
              выбранного срока. Без трек-номеров и без ежедневных писем — только «давно ничего не
              уходило». Нужны ещё и уведомления приложения.
            </Text>

            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text style={[styles.switchLabel, { color: theme.text.primary }]}>
                  Напоминать, если давно не отправляла
                </Text>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={(value) => void handleToggle(value)}
                trackColor={{ false: theme.overlay.border, true: theme.text.accent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {reminderEnabled ? (
              <SettingsSegmented
                label="Срок тишины"
                value={interval}
                options={INTERVAL_OPTIONS}
                onChange={setInterval}
                wrap
                hint="Считается от дня, когда последний раз отправили посылку или отнесли передачку. Если ещё ничего не уходило — от дня призыва."
              />
            ) : null}
          </ScrollView>
        </View>
      </View>
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
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
  },
  headerAction: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    minWidth: 72,
  },
  headerConfirm: {
    fontWeight: '600',
    textAlign: 'right',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 18,
  },
  hint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchText: {
    flex: 1,
  },
  switchLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
  },
});
