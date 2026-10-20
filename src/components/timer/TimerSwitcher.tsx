import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { SERVICE_TIMER_ID, type ActiveTimer, type CustomTimerRecord } from '@/types/timer';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface TimerSwitcherProps {
  activeTimer: ActiveTimer | null;
  serviceTimerName: string;
  customTimers: CustomTimerRecord[];
  photoBackground?: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (timer: CustomTimerRecord) => void;
}

export function TimerSwitcher({
  activeTimer,
  serviceTimerName,
  customTimers,
  photoBackground = false,
  onSelect,
  onAdd,
  onEdit,
}: TimerSwitcherProps) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const textColor = photoBackground ? '#F2F0EC' : theme.text.primary;
  const title = activeTimer?.kind === 'custom' ? activeTimer.name : serviceTimerName;

  const close = () => setOpen(false);

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
              </Pressable>
            ))}
          </View>
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
});
