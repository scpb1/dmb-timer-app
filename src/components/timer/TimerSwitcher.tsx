import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { SERVICE_TIMER_ID, type ActiveTimer, type CustomTimerRecord } from '@/types/timer';
import { isTimerNotificationEnabled } from '@/utils/timerRecords';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

const TOAST_MS = 2200;

interface TimerSwitcherProps {
  activeTimer: ActiveTimer | null;
  serviceTimerName: string;
  customTimers: CustomTimerRecord[];
  notificationDisabledIds: string[];
  photoBackground?: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (timer: CustomTimerRecord) => void;
  onToggleNotifications: (id: string, enabled: boolean) => void;
}

export function TimerSwitcher({
  activeTimer,
  serviceTimerName,
  customTimers,
  notificationDisabledIds,
  photoBackground = false,
  onSelect,
  onAdd,
  onEdit,
  onToggleNotifications,
}: TimerSwitcherProps) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textColor = photoBackground ? '#F2F0EC' : theme.text.primary;
  const title = activeTimer?.kind === 'custom' ? activeTimer.name : serviceTimerName;

  const close = () => {
    setOpen(false);
    setToast(null);
  };

  useEffect(
    () => () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    },
    [],
  );

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, TOAST_MS);
  };

  const toggleNotifications = (id: string, name: string) => {
    const nextEnabled = !isTimerNotificationEnabled(id, notificationDisabledIds);
    onToggleNotifications(id, nextEnabled);
    showToast(
      nextEnabled
        ? `Уведомления в таймере "${name}" включены`
        : `Уведомления в таймере "${name}" выключены`,
    );
  };

  const renderBell = (id: string, name: string) => {
    const enabled = isTimerNotificationEnabled(id, notificationDisabledIds);
    return (
      <Pressable
        onPress={() => toggleNotifications(id, name)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={
          enabled ? `Выключить уведомления таймера ${name}` : `Включить уведомления таймера ${name}`
        }
        style={styles.bellButton}
      >
        <MaterialCommunityIcons
          name={enabled ? 'bell' : 'bell-off'}
          size={20}
          color={enabled ? theme.text.primary : theme.text.secondary}
        />
      </Pressable>
    );
  };

  return (
    <>
      <Pressable
        style={styles.trigger}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Таймер ${title}`}
        accessibilityHint="Открывает список таймеров"
      >
        <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
          {title}
        </Text>
        <MaterialCommunityIcons
          name="menu-down"
          size={26}
          color={textColor}
          style={styles.caret}
        />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          <View
            style={[
              styles.menu,
              {
                backgroundColor: theme.background.start,
                borderColor: theme.overlay.border,
              },
            ]}
          >
            <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
              <Pressable
                style={[styles.menuItem, { borderBottomColor: theme.overlay.border }]}
                onPress={() => {
                  close();
                  onAdd();
                }}
                accessibilityRole="button"
                accessibilityLabel="Добавить таймер"
              >
                <MaterialCommunityIcons name="plus" size={18} color={theme.text.primary} />
                <Text style={[styles.menuItemText, { color: theme.text.primary }]}>
                  Добавить таймер
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.menuItem,
                  { borderBottomColor: theme.overlay.border },
                  activeTimer?.id === SERVICE_TIMER_ID && {
                    backgroundColor: theme.overlay.muted,
                  },
                ]}
                onPress={() => {
                  close();
                  onSelect(SERVICE_TIMER_ID);
                }}
              >
                <Text
                  style={[
                    styles.menuItemText,
                    { color: theme.text.primary },
                    activeTimer?.id === SERVICE_TIMER_ID && {
                      fontFamily: typography.fontFamily.sansBold,
                      color: theme.text.accent,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {serviceTimerName}
                </Text>
                {renderBell(SERVICE_TIMER_ID, serviceTimerName)}
              </Pressable>

              {customTimers.map((timer) => (
                <Pressable
                  key={timer.id}
                  style={[
                    styles.menuItem,
                    { borderBottomColor: theme.overlay.border },
                    activeTimer?.id === timer.id && { backgroundColor: theme.overlay.muted },
                  ]}
                  onPress={() => {
                    close();
                    onSelect(timer.id);
                  }}
                  onLongPress={() => {
                    close();
                    onEdit(timer);
                  }}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      { color: theme.text.primary },
                      activeTimer?.id === timer.id && {
                        fontFamily: typography.fontFamily.sansBold,
                        color: theme.text.accent,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {timer.name}
                  </Text>
                  {renderBell(timer.id, timer.name)}
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {toast ? (
            <View pointerEvents="none" style={styles.toastWrap}>
              <View style={styles.toast}>
                <Text style={styles.toastText}>{toast}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 168,
    paddingHorizontal: 8,
    minHeight: 44,
  },
  title: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 20,
    textAlign: 'center',
    flexShrink: 1,
  },
  caret: {
    marginLeft: -2,
    marginTop: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingTop: 88,
    alignItems: 'center',
  },
  menu: {
    width: '78%',
    maxWidth: 340,
    maxHeight: '72%',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemText: {
    flex: 1,
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
  },
  bellButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  toastWrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 48,
    alignItems: 'center',
  },
  toast: {
    maxWidth: 340,
    borderRadius: 4,
    backgroundColor: 'rgba(28, 24, 20, 0.72)',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  toastText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
    color: '#F2F0EC',
    textAlign: 'center',
  },
});
