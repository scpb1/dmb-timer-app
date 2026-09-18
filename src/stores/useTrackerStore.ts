import { create } from 'zustand';

import type { TrackerTab } from '@/types/trackers';

interface TrackerStore {
  activeTab: TrackerTab;
  setActiveTab: (tab: TrackerTab) => void;
}

export const useTrackerStore = create<TrackerStore>((set) => ({
  activeTab: 'calls',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
