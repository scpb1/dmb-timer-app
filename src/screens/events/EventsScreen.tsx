import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
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
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { SegmentedControl } from '@/components/trackers/SegmentedControl';
import { useEvents } from '@/hooks/useEvents';
import { useHolidays } from '@/hooks/useHolidays';
import type { DisplayEvent } from '@/types/events';
import type { DisplayHoliday } from '@/types/holidays';
import {
  formatDaysUntilDate,
  formatEventDate,
  formatEventDaysUntilCaption,
  isCalendarToday,
} from '@/utils/eventCalculations';
import { getEventGlyph, getHolidayGlyph } from '@/utils/eventGlyphs';
import { formatHolidayDate, formatHolidayName } from '@/utils/holidayCalculations';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

type ListFilter = 'all' | 'events' | 'holidays';

type ListItem =
  | { kind: 'event'; date: Date; event: DisplayEvent }
  | { kind: 'holiday'; date: Date; holiday: DisplayHoliday };

type ListRow =
  | { type: 'year'; key: string; year: number }
  | { type: 'item'; key: string; item: ListItem };

const FILTER_OPTIONS: Array<{ value: ListFilter; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'events', label: 'События' },
  { value: 'holidays', label: 'Праздники' },
];

const YEAR_ROW_HEIGHT = 30;
const ITEM_ROW_HEIGHT = 96;

function isItemPast(item: ListItem): boolean {
  return item.kind === 'event' ? item.event.isPast : item.holiday.isPast;
}

function emptyMessage(filter: ListFilter): string {
  switch (filter) {
    case 'events':
      return 'Нет событий. Нажмите «+», чтобы добавить веху службы.';
    case 'holidays':
      return 'Нет праздников. Нажмите «+», чтобы добавить день рождения или годовщину.';
    default:
      return 'Нет событий и праздников. Нажмите «+», чтобы добавить.';
  }
}

function rowHeight(row: ListRow): number {
  return row.type === 'year' ? YEAR_ROW_HEIGHT : ITEM_ROW_HEIGHT;
}

function buildRows(items: ListItem[]): ListRow[] {
  const uniqueYears = new Set(items.map((item) => item.date.getFullYear()));
  const showYears = uniqueYears.size > 1;
  const rows: ListRow[] = [];
  let lastYear: number | null = null;

  for (const item of items) {
    const year = item.date.getFullYear();
    if (showYears && year !== lastYear) {
      rows.push({ type: 'year', key: `year-${year}`, year });
      lastYear = year;
    }

    const key =
      item.kind === 'event'
        ? `event-${item.event.id}`
        : `holiday-${item.holiday.id}-${item.holiday.date.getFullYear()}`;
    rows.push({ type: 'item', key, item });
  }

  return rows;
}

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

  const [filter, setFilter] = useState<ListFilter>('all');
  const listRef = useRef<FlatList<ListRow>>(null);
  const pendingScrollKey = useRef<string | null>(null);
  const [kindMenuVisible, setKindMenuVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [eventModalMode, setEventModalMode] = useState<'add' | 'edit'>('add');
  const [editingEvent, setEditingEvent] = useState<DisplayEvent | null>(null);
  const [holidayModalVisible, setHolidayModalVisible] = useState(false);
  const [holidayModalMode, setHolidayModalMode] = useState<'add' | 'edit'>('add');
  const [editingHoliday, setEditingHoliday] = useState<DisplayHoliday | null>(null);

  useFocusEffect(
    useCallback(() => {
      pendingScrollKey.current = null;
      void reloadEvents();
      void reloadHolidays();
    }, [reloadEvents, reloadHolidays]),
  );

  const items = useMemo<ListItem[]>(() => {
    const next: ListItem[] = [
      ...events.map((event) => ({ kind: 'event' as const, date: event.date, event })),
      ...holidays.map((holiday) => ({ kind: 'holiday' as const, date: holiday.date, holiday })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    return next.filter((item) => {
      if (filter === 'events') {
        return item.kind === 'event';
      }
      if (filter === 'holidays') {
        return item.kind === 'holiday';
      }
      return true;
    });
  }, [events, filter, holidays]);

  const rows = useMemo(() => buildRows(items), [items]);
  const rowLayouts = useMemo(() => {
    const layouts: Array<{ length: number; offset: number }> = [];
    let offset = 0;
    for (const row of rows) {
      const length = rowHeight(row);
      layouts.push({ length, offset });
      offset += length;
    }
    return layouts;
  }, [rows]);

  const upcomingIndex = useMemo(
    () => rows.findIndex((row) => row.type === 'item' && !isItemPast(row.item)),
    [rows],
  );

  const scrollToUpcoming = useCallback(() => {
    if (upcomingIndex < 0) {
      return;
    }

    listRef.current?.scrollToIndex({
      index: upcomingIndex,
      viewPosition: 0.08,
      animated: false,
    });
  }, [upcomingIndex]);

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
  const theme = useAppTheme();

  useEffect(() => {
    if (isLoading || upcomingIndex < 0) {
      return;
    }

    const key = `${filter}:${upcomingIndex}:${rows.length}`;
    if (pendingScrollKey.current === key) {
      return;
    }
    pendingScrollKey.current = key;

    const timer = setTimeout(scrollToUpcoming, 60);
    return () => clearTimeout(timer);
  }, [filter, isLoading, rows.length, scrollToUpcoming, upcomingIndex]);

  const renderRow = ({ item: row }: { item: ListRow }) => {
    if (row.type === 'year') {
      return <Text style={[styles.yearHeader, { color: theme.text.secondary }]}>{row.year}</Text>;
    }

    const { item } = row;
    if (item.kind === 'event') {
      return (
        <EventCard
          kind="event"
          name={item.event.name}
          dateText={formatEventDate(item.event.date)}
          subtitle={formatEventDaysUntilCaption(item.event)}
          isPast={item.event.isPast}
          isToday={isCalendarToday(item.event.date)}
          glyph={getEventGlyph(item.event)}
          onEdit={() => openEditEvent(item.event)}
          onDelete={() => void deleteEvent(item.event)}
        />
      );
    }

    return (
      <EventCard
        kind="holiday"
        name={formatHolidayName(item.holiday)}
        dateText={formatHolidayDate(item.holiday)}
        subtitle={formatDaysUntilDate(item.holiday.date)}
        isPast={item.holiday.isPast}
        isToday={isCalendarToday(item.holiday.date)}
        glyph={getHolidayGlyph(item.holiday)}
        onEdit={() => openEditHoliday(item.holiday)}
        onDelete={() => void deleteHoliday(item.holiday)}
      />
    );
  };

  return (
    <View style={styles.root}>
      <ScreenBackground />

      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <ScreenHeader
            title="События"
            right={
              <Pressable
                style={[
                  styles.addButton,
                  {
                    backgroundColor: theme.overlay.fill,
                    borderColor: theme.overlay.border,
                  },
                ]}
                onPress={openAddMenu}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Добавить событие или праздник"
              >
                <Feather name="plus" size={24} color={theme.text.primary} />
              </Pressable>
            }
          />
          <View style={styles.filterWrap}>
            <SegmentedControl options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={theme.text.primary} />
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.text.secondary }]}>{emptyMessage(filter)}</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={rows}
            keyExtractor={(row) => row.key}
            renderItem={renderRow}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={Math.max(16, upcomingIndex + 6)}
            getItemLayout={(_data, index) => {
              const layout = rowLayouts[index];
              return {
                length: layout?.length ?? ITEM_ROW_HEIGHT,
                offset: layout?.offset ?? 0,
                index,
              };
            }}
            onScrollToIndexFailed={(info) => {
              listRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: false,
              });
              setTimeout(scrollToUpcoming, 80);
            }}
          />
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
    paddingHorizontal: 20,
  },
  filterWrap: {
    marginTop: 4,
    marginBottom: 12,
  },
  addButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    borderWidth: 1,
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
  yearHeader: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 6,
    marginLeft: 2,
  },
});
