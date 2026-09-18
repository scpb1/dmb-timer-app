import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { AddKindMenu } from '@/components/events/AddKindMenu';
import { EventCard } from '@/components/events/EventCard';
import { EventFormModal } from '@/components/events/EventFormModal';
import { HolidayFormModal } from '@/components/events/HolidayFormModal';
import { UndoSnackbar } from '@/components/events/UndoSnackbar';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { useEvents } from '@/hooks/useEvents';
import { useHolidays } from '@/hooks/useHolidays';
import type { DisplayEvent } from '@/types/events';
import type { DisplayHoliday } from '@/types/holidays';
import { formatDaysUntilDate, formatEventDate } from '@/utils/eventCalculations';
import { getEventGlyph, getHolidayGlyph } from '@/utils/eventGlyphs';
import { formatHolidayDate, formatHolidayName } from '@/utils/holidayCalculations';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

type ListItem =
  | { kind: 'event'; date: Date; event: DisplayEvent }
  | { kind: 'holiday'; date: Date; holiday: DisplayHoliday };

export function EventsScreen() {
  const {
    isLoading: eventsLoading,
    events,
    pendingDeletion: pendingEventDeletion,
    addEvent,
    updateEvent,
    deleteEvent,
    undoDelete: undoEventDelete,
    reload: reloadEvents,
  } = useEvents();

  const {
    isLoading: holidaysLoading,
    holidays,
    pendingDeletion: pendingHolidayDeletion,
    addHoliday,
    updateHoliday,
    deleteHoliday,
    undoDelete: undoHolidayDelete,
    reload: reloadHolidays,
  } = useHolidays();

  const [kindMenuVisible, setKindMenuVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [eventModalMode, setEventModalMode] = useState<'add' | 'edit'>('add');
  const [editingEvent, setEditingEvent] = useState<DisplayEvent | null>(null);
  const [holidayModalVisible, setHolidayModalVisible] = useState(false);
  const [holidayModalMode, setHolidayModalMode] = useState<'add' | 'edit'>('add');
  const [editingHoliday, setEditingHoliday] = useState<DisplayHoliday | null>(null);

  useFocusEffect(
    useCallback(() => {
      void reloadEvents();
      void reloadHolidays();
    }, [reloadEvents, reloadHolidays]),
  );

  const items = useMemo<ListItem[]>(() => {
    const next: ListItem[] = [
      ...events.map((event) => ({ kind: 'event' as const, date: event.date, event })),
      ...holidays.map((holiday) => ({ kind: 'holiday' as const, date: holiday.date, holiday })),
    ];
    return next.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, holidays]);

  const openAddMenu = () => setKindMenuVisible(true);

  const openAddEvent = () => {
    setKindMenuVisible(false);
    setEventModalMode('add');
    setEditingEvent(null);
    setEventModalVisible(true);
  };

  const openAddHoliday = () => {
    setKindMenuVisible(false);
    setHolidayModalMode('add');
    setEditingHoliday(null);
    setHolidayModalVisible(true);
  };

  const openEditEvent = (event: DisplayEvent) => {
    setEventModalMode('edit');
    setEditingEvent(event);
    setEventModalVisible(true);
  };

  const openEditHoliday = (holiday: DisplayHoliday) => {
    setHolidayModalMode('edit');
    setEditingHoliday(holiday);
    setHolidayModalVisible(true);
  };

  const handleSaveEvent = async (form: Parameters<typeof addEvent>[0]) => {
    if (eventModalMode === 'add') {
      return addEvent(form);
    }
    if (!editingEvent) {
      return false;
    }
    return updateEvent(editingEvent.id, form, editingEvent.isCustom);
  };

  const handleSaveHoliday = async (form: Parameters<typeof addHoliday>[0]) => {
    if (holidayModalMode === 'add') {
      return addHoliday(form);
    }
    if (!editingHoliday) {
      return false;
    }
    return updateHoliday(editingHoliday.id, form, editingHoliday.isCustom);
  };

  const pendingHoliday = pendingHolidayDeletion !== null;
  const isLoading = eventsLoading || holidaysLoading;
  const theme = colors.light;

  return (
    <View style={styles.root}>
      <ScreenBackground themeMode="light" />

      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>События</Text>
          <Pressable
            style={styles.addButton}
            onPress={openAddMenu}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Добавить событие или праздник"
          >
            <Feather name="plus" size={24} color={theme.text.primary} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={theme.text.primary} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Нет событий и праздников. Нажмите «+», чтобы добавить.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item) =>
              item.kind === 'event' ? (
                <EventCard
                  key={`event-${item.event.id}`}
                  kind="event"
                  name={item.event.name}
                  dateText={formatEventDate(item.event.date)}
                  subtitle={formatDaysUntilDate(item.event.date)}
                  isPast={item.event.isPast}
                  glyph={getEventGlyph(item.event)}
                  onEdit={() => openEditEvent(item.event)}
                  onDelete={() => void deleteEvent(item.event)}
                />
              ) : (
                <EventCard
                  key={`holiday-${item.holiday.id}-${item.holiday.date.getFullYear()}`}
                  kind="holiday"
                  name={formatHolidayName(item.holiday)}
                  dateText={formatHolidayDate(item.holiday)}
                  subtitle={formatDaysUntilDate(item.holiday.date)}
                  isPast={item.holiday.isPast}
                  glyph={getHolidayGlyph(item.holiday)}
                  onEdit={() => openEditHoliday(item.holiday)}
                  onDelete={() => void deleteHoliday(item.holiday)}
                />
              ),
            )}
          </ScrollView>
        )}

        <UndoSnackbar
          visible={pendingEventDeletion !== null || pendingHoliday}
          message={pendingHoliday ? 'Праздник удалён' : 'Событие удалено'}
          onUndo={() => void (pendingHoliday ? undoHolidayDelete() : undoEventDelete())}
        />
      </SafeAreaView>

      <AddKindMenu
        visible={kindMenuVisible}
        onClose={() => setKindMenuVisible(false)}
        onChooseEvent={openAddEvent}
        onChooseHoliday={openAddHoliday}
      />

      <EventFormModal
        visible={eventModalVisible}
        mode={eventModalMode}
        event={editingEvent}
        onClose={() => setEventModalVisible(false)}
        onSave={handleSaveEvent}
      />

      <HolidayFormModal
        visible={holidayModalVisible}
        mode={holidayModalMode}
        holiday={editingHoliday}
        onClose={() => setHolidayModalVisible(false)}
        onSave={handleSaveHoliday}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingBottom: 96,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 24,
    color: colors.light.text.primary,
  },
  addButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    color: colors.light.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 10,
  },
});
