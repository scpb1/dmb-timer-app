export type OnboardingStep =
  | 'welcome'
  | 'service_question'
  | 'reasons'
  | 'help_text'
  | 'value_text'
  | 'name_input'
  | 'partner_name_input'
  | 'dates_input';

export type ThemeMode = 'dark' | 'light';

export interface OnboardingFormData {
  userName: string;
  partnerName: string;
  enlistmentDate: Date | null;
  demobilizationDate: Date | null;
}
