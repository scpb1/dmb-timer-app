import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';

import { UndoSnackbar } from '@/components/events/UndoSnackbar';
import { CallDayPanel } from '@/components/trackers/CallDayPanel';
import { CallEntryDetailModal } from '@/components/trackers/CallEntryDetailModal';
import { MeetingDayPanel } from '@/components/trackers/MeetingDayPanel';
import { MeetingEntryDetailModal } from '@/components/trackers/MeetingEntryDetailModal';
import { SegmentedControl } from '@/components/trackers/SegmentedControl';
import { TrackerCalendar } from '@/components/trackers/TrackerCalendar';
import { TrackerStatGrid } from '@/components/trackers/TrackerStatGrid';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { useCallTracker } from '@/hooks/useCallTracker';
import { useMeetingTracker } from '@/hooks/useMeetingTracker';
import { useTrackerStore } from '@/stores/useTrackerStore';
import type { CallEntry, MeetingEntry } from '@/types/trackers';
import {
  getCallStats,
  getEntryCountsByDate,
  getMeetingStats,
} from '@/utils/trackerCalculations';
import { colors } from '@/theme/colors';

const TAB_OPTIONS = [
  { value: 'calls' as const, label: 'Звонки' },
  { value: 'meetings' as const, label: 'Встречи' },
];

function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function TrackersScreen() {
  const activeTab = useTrackerStore((state) => state.activeTab);
  const setActiveTab = useTrackerStore((state) => state.setActiveTab);

  const {
    isLoading: callsLoading,
    entries: callEntries,
    pendingDeletion: pendingCallDeletion,
    reload: reloadCalls,
    addEntry: addCallEntry,
    updateEntry: updateCallEntry,
    deleteEntry: deleteCallEntry,
    undoDelete: undoCallDelete,
  } = useCallTracker();

  const {
    isLoading: meetingsLoading,
    entries: meetingEntries,
    pendingDeletion: pendingMeetingDeletion,
    reload: reloadMeetings,
    addEntry: addMeetingEntry,
    updateEntry: updateMeetingEntry,
    deleteEntry: deleteMeetingEntry,
    undoDelete: undoMeetingDelete,
  } = useMeetingTracker();

  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [selectedCallEntry, setSelectedCallEntry] = useState<CallEntry | null>(null);
  const [selectedMeetingEntry, setSelectedMeetingEntry] = useState<MeetingEntry | null>(null);
  const [editingCall, setEditingCall] = useState<CallEntry | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<MeetingEntry | null>(null);

  useFocusEffect(
    useCallback(() => {
      reloadCalls();
      reloadMeetings();
    }, [reloadCalls, reloadMeetings]),
  );

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'calls' && selectedDate > todayKey()) {
      setSelectedDate(todayKey());
    }
    setSelectedCallEntry(null);
    setSelectedMeetingEntry(null);
    setEditingCall(null);
    setEditingMeeting(null);
  };

  const callStats = useMemo(() => getCallStats(callEntries), [callEntries]);
  const meetingStats = useMemo(() => getMeetingStats(meetingEntries), [meetingEntries]);
  const callEntryCounts = useMemo(() => getEntryCountsByDate(callEntries), [callEntries]);
  const meetingEntryCounts = useMemo(
    () => getEntryCountsByDate(meetingEntries),
    [meetingEntries],
  );

  const isLoading = activeTab === 'calls' ? callsLoading : meetingsLoading;

  const handleDayPress = (date: Date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'));
    setSelectedCallEntry(null);
    setSelectedMeetingEntry(null);
  };

  const handleAddCall = async (
    date: string,
    input: Parameters<typeof addCallEntry>[1],
  ) => {
    const success = await addCallEntry(date, input);
    if (success) {
      setSelectedDate(date);
    }
    return success;
  };

  const handleUpdateCall = async (
    id: string,
    date: string,
    input: Parameters<typeof updateCallEntry>[2],
  ) => {
    const success = await updateCallEntry(id, date, input);
    if (success) {
      setSelectedDate(date);
    }
    return success;
  };

  const handleAddMeeting = async (
    date: string,
    input: Parameters<typeof addMeetingEntry>[1],
  ) => {
    const success = await addMeetingEntry(date, input);
    if (success) {
      setSelectedDate(date);
    }
    return success;
  };

  const handleUpdateMeeting = async (
    id: string,
    date: string,
    input: Parameters<typeof updateMeetingEntry>[2],
  ) => {
    const success = await updateMeetingEntry(id, date, input);
    if (success) {
      setSelectedDate(date);
    }
    return success;
  };

  return (
    <View style={styles.root}>
      <ScreenBackground />

      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Трекеры" />

        <SegmentedControl options={TAB_OPTIONS} value={activeTab} onChange={handleTabChange} />

        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.light.text.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TrackerStatGrid stats={activeTab === 'calls' ? callStats : meetingStats} />

            <TrackerCalendar
              entryCounts={activeTab === 'calls' ? callEntryCounts : meetingEntryCounts}
              selectedDate={selectedDate}
              onDayPress={handleDayPress}
              onTodayPress={(date) => setSelectedDate(format(date, 'yyyy-MM-dd'))}
              allowFutureDays={activeTab === 'meetings'}
            />

            {activeTab === 'calls' ? (
              <CallDayPanel
                date={selectedDate}
                entries={callEntries}
                editingEntry={editingCall}
                onAdd={handleAddCall}
                onUpdate={handleUpdateCall}
                onEntryPress={setSelectedCallEntry}
                onEditHandled={() => setEditingCall(null)}
              />
            ) : (
              <MeetingDayPanel
                date={selectedDate}
                entries={meetingEntries}
                editingEntry={editingMeeting}
                onAdd={handleAddMeeting}
                onUpdate={handleUpdateMeeting}
                onEntryPress={setSelectedMeetingEntry}
                onEditHandled={() => setEditingMeeting(null)}
              />
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      <UndoSnackbar
        visible={pendingCallDeletion !== null || pendingMeetingDeletion !== null}
        message={pendingMeetingDeletion ? 'Встреча удалена' : 'Звонок удалён'}
        onUndo={() => void (pendingMeetingDeletion ? undoMeetingDelete() : undoCallDelete())}
      />

      <CallEntryDetailModal
        visible={selectedCallEntry !== null}
        entry={selectedCallEntry}
        onClose={() => setSelectedCallEntry(null)}
        onEdit={(entry) => {
          setSelectedDate(entry.date);
          setEditingCall(entry);
        }}
        onDelete={deleteCallEntry}
      />

      <MeetingEntryDetailModal
        visible={selectedMeetingEntry !== null}
        entry={selectedMeetingEntry}
        onClose={() => setSelectedMeetingEntry(null)}
        onEdit={(entry) => {
          setSelectedDate(entry.date);
          setEditingMeeting(entry);
        }}
        onDelete={deleteMeetingEntry}
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
    paddingHorizontal: 20,
    paddingBottom: 96,
    gap: 16,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 24,
  },
});
