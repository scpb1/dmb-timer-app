import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';

import { CallDayPanel } from '@/components/trackers/CallDayPanel';
import { CallEntryDetailModal } from '@/components/trackers/CallEntryDetailModal';
import { MeetingDayPanel } from '@/components/trackers/MeetingDayPanel';
import { MeetingEntryDetailModal } from '@/components/trackers/MeetingEntryDetailModal';
import { SegmentedControl } from '@/components/trackers/SegmentedControl';
import { TrackerCalendar } from '@/components/trackers/TrackerCalendar';
import { TrackerStatGrid } from '@/components/trackers/TrackerStatGrid';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { useCallTracker } from '@/hooks/useCallTracker';
import { useMeetingTracker } from '@/hooks/useMeetingTracker';
import { useTrackerStore } from '@/stores/useTrackerStore';
import type { CallEntry, MeetingEntry } from '@/types/trackers';
import {
  getCallStats,
  getDatesWithEntries,
  getMeetingStats,
} from '@/utils/trackerCalculations';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

const TAB_OPTIONS = [
  { value: 'calls' as const, label: 'Звонки' },
  { value: 'meetings' as const, label: 'Встречи' },
];

export function TrackersScreen() {
  const activeTab = useTrackerStore((state) => state.activeTab);
  const setActiveTab = useTrackerStore((state) => state.setActiveTab);

  const {
    isLoading: callsLoading,
    entries: callEntries,
    reload: reloadCalls,
    addEntry: addCallEntry,
    deleteEntry: deleteCallEntry,
  } = useCallTracker();

  const {
    isLoading: meetingsLoading,
    entries: meetingEntries,
    reload: reloadMeetings,
    addEntry: addMeetingEntry,
    deleteEntry: deleteMeetingEntry,
  } = useMeetingTracker();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedCallEntry, setSelectedCallEntry] = useState<CallEntry | null>(null);
  const [selectedMeetingEntry, setSelectedMeetingEntry] = useState<MeetingEntry | null>(null);

  useFocusEffect(
    useCallback(() => {
      reloadCalls();
      reloadMeetings();
    }, [reloadCalls, reloadMeetings]),
  );

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSelectedDate(null);
    setSelectedCallEntry(null);
    setSelectedMeetingEntry(null);
  };

  const callStats = useMemo(() => getCallStats(callEntries), [callEntries]);
  const meetingStats = useMemo(() => getMeetingStats(meetingEntries), [meetingEntries]);
  const callMarkedDates = useMemo(() => getDatesWithEntries(callEntries), [callEntries]);
  const meetingMarkedDates = useMemo(
    () => getDatesWithEntries(meetingEntries),
    [meetingEntries],
  );

  const isLoading = activeTab === 'calls' ? callsLoading : meetingsLoading;

  const handleDayPress = (date: Date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'));
    setSelectedCallEntry(null);
    setSelectedMeetingEntry(null);
  };

  return (
    <View style={styles.root}>
      <ScreenBackground themeMode="light" />

      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Трекеры</Text>
        </View>

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
              markedDates={activeTab === 'calls' ? callMarkedDates : meetingMarkedDates}
              selectedDate={selectedDate}
              onDayPress={handleDayPress}
              allowFutureDays={activeTab === 'meetings'}
            />

            {selectedDate && activeTab === 'calls' ? (
              <CallDayPanel
                date={selectedDate}
                entries={callEntries}
                onAdd={addCallEntry}
                onEntryPress={setSelectedCallEntry}
              />
            ) : null}

            {selectedDate && activeTab === 'meetings' ? (
              <MeetingDayPanel
                date={selectedDate}
                entries={meetingEntries}
                onAdd={addMeetingEntry}
                onEntryPress={setSelectedMeetingEntry}
              />
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>

      <CallEntryDetailModal
        visible={selectedCallEntry !== null}
        entry={selectedCallEntry}
        onClose={() => setSelectedCallEntry(null)}
        onDelete={deleteCallEntry}
      />

      <MeetingEntryDetailModal
        visible={selectedMeetingEntry !== null}
        entry={selectedMeetingEntry}
        onClose={() => setSelectedMeetingEntry(null)}
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
  header: {
    paddingTop: 12,
  },
  title: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 24,
    color: colors.light.text.primary,
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
