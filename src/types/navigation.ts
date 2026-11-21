export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  TimerSettings: undefined;
  TimerPhoto: undefined;
  ColorThemes: undefined;
};

export type MainTabParamList = {
  Shop: undefined;
  Events: undefined;
  Home: undefined;
  Diary: undefined;
  Trackers: undefined;
  Widgets: undefined;
  Parcels: undefined;
  Support: undefined;
};

export type DiaryStackParamList = {
  DiaryHome: undefined;
  Settings: undefined;
  PersonalDiary: { date?: string };
  LetterTheme: { date?: string };
  LetterEditor: {
    date: string;
    themeId: string;
    startFresh?: boolean;
  };
};
