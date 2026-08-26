import { useCallback, useState } from 'react';
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

import { EventCard } from '@/components/events/EventCard';
import { EventFormModal } from '@/components/events/EventFormModal';
import { UndoSnackbar } from '@/components/events/UndoSnackbar';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { useEvents } from '@/hooks/useEvents';
import type { DisplayEvent } from '@/types/events';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

export function EventsScreen() {
  const {
    isLoading,
    events,
    pendingDeletion,
    addEvent,
    updateEvent,
    deleteEvent,
    undoDelete,
    reload,
  } = useEvents();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingEvent, setEditingEvent] = useState<DisplayEvent | null>(null);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const openAddModal = () => {
    setModalMode('add');
    setEditingEvent(null);
    setModalVisible(true);
  };

  const openEditModal = (event: DisplayEvent) => {
    setModalMode('edit');
    setEditingEvent(event);
    setModalVisible(true);
  };

  const handleSave = async (form: Parameters<typeof addEvent>[0]) => {
    if (modalMode === 'add') {
      return addEvent(form);
    }

    if (!editingEvent) {
      return false;
    }

    return updateEvent(editingEvent.id, form, editingEvent.isCustom);
  };

  const theme = colors.light;

  return (
    <View style={styles.root}>
      <ScreenBackground themeMode="light" />

      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>События</Text>
          <Pressable
            style={styles.addButton}
            onPress={openAddModal}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Добавить событие"
          >
            <Feather name="plus" size={24} color={theme.text.primary} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={theme.text.primary} />
          </View>
        ) : events.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Нет событий. Нажмите «+», чтобы добавить своё.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={openEditModal}
                onDelete={deleteEvent}
              />
            ))}
          </ScrollView>
        )}

        <UndoSnackbar visible={pendingDeletion !== null} onUndo={undoDelete} />
      </SafeAreaView>

      <EventFormModal
        visible={modalVisible}
        mode={modalMode}
        event={editingEvent}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
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
    borderRadius: 22,
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
