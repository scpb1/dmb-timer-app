import { useCallback, useMemo, useState } from 'react';
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

import { ScreenHeader } from '@/components/common/ScreenHeader';
import { UndoSnackbar } from '@/components/events/UndoSnackbar';
import { ParcelCard } from '@/components/parcels/ParcelCard';
import { ParcelDetailModal } from '@/components/parcels/ParcelDetailModal';
import { ParcelFormModal } from '@/components/parcels/ParcelFormModal';
import { ParcelKindMenu } from '@/components/parcels/ParcelKindMenu';
import { ParcelSettingsModal } from '@/components/parcels/ParcelSettingsModal';
import { ParcelStatGrid } from '@/components/parcels/ParcelStatGrid';
import { SegmentedControl } from '@/components/trackers/SegmentedControl';
import { useParcels } from '@/hooks/useParcels';
import type {
  ParcelEntry,
  ParcelFormData,
  ParcelKind,
  ParcelKindFilter,
  ParcelStatus,
  ParcelStatusFilter,
} from '@/types/parcels';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import {
  filterParcels,
  getParcelStats,
  parcelEmptyMessage,
  parcelReminderBannerText,
} from '@/utils/parcelCalculations';

const KIND_FILTERS: { value: ParcelKindFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'parcel', label: 'Посылки' },
  { value: 'handover', label: 'Передачки' },
];

const STATUS_FILTERS: { value: ParcelStatusFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'packing', label: 'Собираю' },
  { value: 'sent', label: 'В пути' },
  { value: 'received', label: 'Дошли' },
];

export function ParcelsScreen() {
  const theme = useAppTheme();
  const {
    isLoading,
    entries,
    settings,
    pendingDeletion,
    serviceRange,
    reminderPlan,
    reload,
    saveEntry,
    advanceStatus,
    updateSettings,
    deleteEntry,
    undoDelete,
  } = useParcels();

  const [kindFilter, setKindFilter] = useState<ParcelKindFilter>('all');
  const [statusFilter, setStatusFilter] = useState<ParcelStatusFilter>('all');
  const [kindMenuVisible, setKindMenuVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formKind, setFormKind] = useState<ParcelKind>('parcel');
  const [editingEntry, setEditingEntry] = useState<ParcelEntry | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const visibleEntries = useMemo(
    () => filterParcels(entries, kindFilter, statusFilter),
    [entries, kindFilter, statusFilter],
  );
  const stats = useMemo(
    () => getParcelStats(entries, serviceRange),
    [entries, serviceRange],
  );
  const selectedEntry = selectedId
    ? (entries.find((item) => item.id === selectedId) ?? null)
    : null;
  const banner = parcelReminderBannerText(reminderPlan);
  const undoMessage =
    pendingDeletion?.entry.kind === 'handover' ? 'Передачка удалена' : 'Посылка удалена';

  const openAdd = (kind: ParcelKind) => {
    setKindMenuVisible(false);
    setFormMode('add');
    setFormKind(kind);
    setEditingEntry(null);
    setFormVisible(true);
  };

  const openEdit = (entry: ParcelEntry) => {
    setFormMode('edit');
    setFormKind(entry.kind);
    setEditingEntry(entry);
    setFormVisible(true);
  };

  const handleSave = async (form: ParcelFormData) => {
    return saveEntry(form, editingEntry?.id);
  };

  const handleAdvance = async (id: string, nextStatus: ParcelStatus, date: Date) => {
    return advanceStatus(id, nextStatus, date);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <ScreenHeader
            title="Посылки"
            right={
              <View style={styles.headerActions}>
                <Pressable
                  style={styles.headerButton}
                  onPress={() => setSettingsVisible(true)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Напоминание"
                >
                  <Feather name="bell" size={22} color={theme.text.primary} />
                </Pressable>
                <Pressable
                  style={styles.headerButton}
                  onPress={() => setKindMenuVisible(true)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Добавить посылку или передачку"
                >
                  <Feather name="plus" size={24} color={theme.text.primary} />
                </Pressable>
              </View>
            }
          />
        </View>

        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={theme.text.primary} />
          </View>
        ) : (
          <FlatList
            data={visibleEntries}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                {banner ? (
                  <Pressable
                    onPress={() => setSettingsVisible(true)}
                    style={[
                      styles.banner,
                      {
                        backgroundColor: theme.overlay.fill,
                        borderColor: theme.overlay.border,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={banner}
                  >
                    <Feather name="clock" size={16} color={theme.text.accent} />
                    <Text style={[styles.bannerText, { color: theme.text.primary }]}>{banner}</Text>
                  </Pressable>
                ) : null}

                <ParcelStatGrid stats={stats} />

                <View style={styles.filterWrap}>
                  <SegmentedControl options={KIND_FILTERS} value={kindFilter} onChange={setKindFilter} />
                </View>
                <View style={styles.filterWrap}>
                  <SegmentedControl
                    options={STATUS_FILTERS}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    compact
                  />
                </View>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
                  {parcelEmptyMessage(kindFilter, statusFilter)}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <ParcelCard
                entry={item}
                onPress={() => setSelectedId(item.id)}
                onEdit={() => openEdit(item)}
                onDelete={() => void deleteEntry(item.id)}
              />
            )}
          />
        )}

        <UndoSnackbar
          visible={pendingDeletion !== null}
          message={undoMessage}
          onUndo={() => void undoDelete()}
        />
      </SafeAreaView>

      <ParcelKindMenu
        visible={kindMenuVisible}
        onClose={() => setKindMenuVisible(false)}
        onChoose={openAdd}
      />
      <ParcelFormModal
        visible={formVisible}
        mode={formMode}
        kind={formKind}
        entry={editingEntry}
        onClose={() => setFormVisible(false)}
        onSave={handleSave}
      />
      <ParcelDetailModal
        visible={selectedEntry !== null}
        entry={selectedEntry}
        onClose={() => setSelectedId(null)}
        onEdit={openEdit}
        onDelete={deleteEntry}
        onAdvance={handleAdvance}
      />
      <ParcelSettingsModal
        visible={settingsVisible}
        settings={settings}
        onClose={() => setSettingsVisible(false)}
        onSave={updateSettings}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 10,
    flexGrow: 1,
  },
  listHeader: {
    gap: 12,
    paddingBottom: 6,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 4,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  bannerText: {
    flex: 1,
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  filterWrap: {
    marginTop: 2,
  },
  empty: {
    paddingVertical: 48,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
