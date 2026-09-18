export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  TimerSettings: undefined;
};

export type MainTabParamList = {
  Shop: undefined;
  Events: undefined;
  Home: undefined;
  Diary: undefined;
  Trackers: undefined;
};

export type DiaryStackParamList = {
  DiaryHome: undefined;
  PersonalDiary: { date?: string };
  LetterTheme: { date?: string };
  LetterEditor: {
    date: string;
    themeId: string;
    startFresh?: boolean;
  };
};
