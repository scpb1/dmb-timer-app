import { Alert, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { addDays, startOfDay } from 'date-fns';

import { FEATURES } from '@/constants';
import { DatePicker } from '@/components/common/DatePicker';
import { ServiceDurationPresets } from '@/components/common/ServiceDurationPresets';
import { SettingsDropdown } from '@/components/common/SettingsDropdown';
import { SettingsField } from '@/components/common/SettingsField';
import { SettingsSegmented } from '@/components/common/SettingsSegmented';
import { ThemeSwitch } from '@/components/common/ThemeSwitch';
import { TimerTypeTilePicker } from '@/components/timer/TimerTypeTilePicker';
import type { ColorTokens } from '@/theme';
import {
  timerSettingsShowPercentDecimals,
  timerTypeUsesProgressBarModes,
  type DotGridCellShape,
  type MilestonesLayout,
  type StatCardMode,
  type TimerSettings,
  type TimerType,
  type TimerUpcomingPreviewMode,
} from '@/types/timer';
import type { TimerUpcomingRef } from '@/utils/timerUpcoming';

import { timerSettingsStyles as styles } from '@/screens/home/timerSettingsStyles';

type Theme = ColorTokens;

type Option<T extends string | number> = { value: T; label: string };

export function TimerSettingsNamesSection({
  theme,
  userName,
  partnerName,
  onChangeUserName,
  onChangePartnerName,
  onSave,
}: {
  theme: Theme;
  userName: string;
  partnerName: string;
  onChangeUserName: (value: string) => void;
  onChangePartnerName: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <>
      <SettingsField label="Ваше имя" value={userName} onChangeText={onChangeUserName} />
      <View style={styles.fieldGap} />
      <SettingsField label="Имя любимого" value={partnerName} onChangeText={onChangePartnerName} />
      <Pressable
        style={[styles.saveButton, { backgroundColor: theme.text.primary }]}
        onPress={onSave}
      >
        <Text style={[styles.saveButtonText, { color: theme.text.inverse }]}>Сохранить имена</Text>
      </Pressable>
    </>
  );
}

export function TimerSettingsDatesSection({
  theme,
  enlistmentDate,
  demobilizationDate,
  isSaving,
  onChangeEnlistment,
  onChangeDemobilization,
  onSave,
}: {
  theme: Theme;
  enlistmentDate: Date | null;
  demobilizationDate: Date | null;
  isSaving: boolean;
  onChangeEnlistment: (value: Date) => void;
  onChangeDemobilization: (value: Date) => void;
  onSave: () => void;
}) {
  return (
    <>
      <View style={styles.sectionSpacer}>
        <DatePicker
          appearance="settings"
          label="Дата призыва"
          value={enlistmentDate}
          onChange={onChangeEnlistment}
        />
        <View style={styles.fieldGap} />
        <DatePicker
          appearance="settings"
          label="Дата дембеля"
          value={demobilizationDate}
          onChange={onChangeDemobilization}
          minimumDate={enlistmentDate ?? undefined}
        />
        <ServiceDurationPresets
          style={styles.presetsAfterDates}
          onSelect={(days) => {
            if (!enlistmentDate) {
              Alert.alert('Сначала дата призыва');
              return;
            }
            onChangeDemobilization(addDays(startOfDay(enlistmentDate), days));
          }}
        />
      </View>
      <Pressable
        style={[
          styles.saveButton,
          { backgroundColor: theme.text.primary },
          FEATURES.timerSettingsSaveDatesOverlay && isSaving && styles.saveButtonDisabled,
        ]}
        onPress={onSave}
        disabled={FEATURES.timerSettingsSaveDatesOverlay && isSaving}
      >
        <Text style={[styles.saveButtonText, { color: theme.text.inverse }]}>Сохранить даты</Text>
      </Pressable>
    </>
  );
}

export function TimerSettingsDisplaySection({
  theme,
  settings,
  notificationsEnabled,
  isUpdatingNotifications,
  isDotGridTimer,
  isFrameTimer,
  isMilestonesTimer,
  safeProgressBarMode,
  progressModeOptions,
  statCardMode,
  pinnedRef,
  pinOptions,
  cellShapeOptions,
  milestonesOptions,
  milestonesHints,
  upcomingOptions,
  statCardOptions,
  decimalOptions,
  onToggleNotifications,
  onOpenThemes,
  onOpenPhoto,
  onTimerTypeChange,
  onUpdateSettings,
}: {
  theme: Theme;
  settings: TimerSettings;
  notificationsEnabled: boolean | null;
  isUpdatingNotifications: boolean;
  isDotGridTimer: boolean;
  isFrameTimer: boolean;
  isMilestonesTimer: boolean;
  safeProgressBarMode: TimerSettings['progressBarMode'];
  progressModeOptions: Option<TimerSettings['progressBarMode']>[];
  statCardMode: StatCardMode;
  pinnedRef: TimerUpcomingRef | null;
  pinOptions: Option<TimerUpcomingRef>[];
  cellShapeOptions: Option<DotGridCellShape>[];
  milestonesOptions: Option<MilestonesLayout>[];
  milestonesHints: Record<MilestonesLayout, string>;
  upcomingOptions: Option<TimerUpcomingPreviewMode>[];
  statCardOptions: Option<StatCardMode>[];
  decimalOptions: Option<number>[];
  onToggleNotifications: (value: boolean) => void;
  onOpenThemes: () => void;
  onOpenPhoto: () => void;
  onTimerTypeChange: (timerType: TimerType) => void;
  onUpdateSettings: (patch: Partial<TimerSettings>) => void | Promise<void>;
}) {
  const milestonesValue =
    settings.milestonesLayout === 'chips' && !FEATURES.milestonesChipsLayout
      ? 'spine'
      : settings.milestonesLayout;

  return (
    <>
      <View style={[styles.switchRow, styles.sectionSpacer]}>
        <View style={styles.notificationsLabelWrap}>
          <Text style={[styles.switchLabel, { color: theme.text.primary }]}>
            Уведомления о праздниках и событиях
          </Text>
          <Text style={[styles.notificationsHint, { color: theme.text.secondary }]}>
            Напоминание в полночь в день события
          </Text>
        </View>
        {notificationsEnabled == null ? (
          <View style={styles.switchSlot} />
        ) : (
          <ThemeSwitch
            value={notificationsEnabled}
            onValueChange={onToggleNotifications}
            disabled={isUpdatingNotifications}
            accessibilityLabel="Уведомления о праздниках и событиях"
          />
        )}
      </View>

      <View style={styles.linkRow}>
        <Pressable
          style={[
            styles.themeLink,
            { backgroundColor: theme.overlay.fill, borderColor: theme.overlay.border },
          ]}
          onPress={onOpenThemes}
          accessibilityRole="button"
          accessibilityLabel="Сменить тему приложения"
        >
          <View style={styles.themeLinkText}>
            <Text style={[styles.themeLinkTitle, { color: theme.text.primary }]}>Сменить тему</Text>
            <Text style={[styles.themeLinkHint, { color: theme.text.secondary }]}>
              Фон, плашки и текст
            </Text>
          </View>
          <Feather name="chevron-right" size={22} color={theme.text.secondary} />
        </Pressable>

        <Pressable
          style={[
            styles.themeLink,
            { backgroundColor: theme.overlay.fill, borderColor: theme.overlay.border },
          ]}
          onPress={onOpenPhoto}
          accessibilityRole="button"
          accessibilityLabel="Поставить фото"
        >
          <View style={styles.themeLinkText}>
            <Text style={[styles.themeLinkTitle, { color: theme.text.primary }]}>
              Поставить фото
            </Text>
            <Text style={[styles.themeLinkHint, { color: theme.text.secondary }]}>
              {settings.backgroundImageUri ? 'Фото на таймере' : 'Обычный фон'}
            </Text>
          </View>
          <Feather name="chevron-right" size={22} color={theme.text.secondary} />
        </Pressable>
      </View>

      <TimerTypeTilePicker value={settings.timerType} onChange={onTimerTypeChange} />

      {isDotGridTimer ? (
        <SettingsSegmented
          label="Форма элементов сетки"
          value={settings.dotGridCellShape}
          options={cellShapeOptions}
          onChange={(dotGridCellShape) => onUpdateSettings({ dotGridCellShape })}
          equalWidth
        />
      ) : null}

      {!isFrameTimer && timerTypeUsesProgressBarModes(settings.timerType) ? (
        <SettingsSegmented
          label={isDotGridTimer ? 'Тип сетки' : 'Режим прогресс-бара'}
          value={safeProgressBarMode}
          options={progressModeOptions}
          onChange={(progressBarMode) => onUpdateSettings({ progressBarMode })}
          equalWidth
        />
      ) : null}

      {timerSettingsShowPercentDecimals(settings.timerType, safeProgressBarMode) ? (
        <SettingsSegmented
          label="Знаков после запятой"
          value={settings.percentDecimalPlaces}
          options={decimalOptions}
          onChange={(percentDecimalPlaces) => onUpdateSettings({ percentDecimalPlaces })}
          equalWidth
          compact
        />
      ) : null}

      {isMilestonesTimer ? (
        <SettingsSegmented
          label="Вид ленты событий"
          value={milestonesValue}
          options={milestonesOptions}
          onChange={(milestonesLayout) => onUpdateSettings({ milestonesLayout })}
          equalWidth
          hint={milestonesHints[milestonesValue]}
        />
      ) : null}

      {!isFrameTimer && !isDotGridTimer ? (
        <SettingsSegmented
          label="Режим плашек"
          value={statCardMode}
          options={statCardOptions}
          onChange={(next) => onUpdateSettings({ statCardMode: next })}
          equalWidth
        />
      ) : null}

      <SettingsSegmented
        label="Событие на таймере"
        value={settings.timerUpcomingPreview}
        options={upcomingOptions}
        onChange={(timerUpcomingPreview) => {
          if (timerUpcomingPreview === 'pinned' && !settings.timerUpcomingPinnedRef) {
            const first = pinOptions[0]?.value;
            void onUpdateSettings({
              timerUpcomingPreview,
              timerUpcomingPinnedRef: first ?? null,
            });
            return;
          }
          void onUpdateSettings({ timerUpcomingPreview });
        }}
        equalWidth
      />

      {settings.timerUpcomingPreview === 'pinned' && pinOptions.length > 0 && pinnedRef ? (
        <SettingsDropdown
          label="Закрепить"
          value={pinnedRef}
          options={pinOptions}
          onChange={(timerUpcomingPinnedRef) => void onUpdateSettings({ timerUpcomingPinnedRef })}
        />
      ) : null}
    </>
  );
}

export function TimerSettingsActionsSection({
  theme,
  exportDisabled,
  onExport,
  onDeleteAll,
}: {
  theme: Theme;
  exportDisabled: boolean;
  onExport: () => void;
  onDeleteAll: () => void;
}) {
  return (
    <>
      {FEATURES.widgets ? (
        <View style={styles.widgetCard}>
          <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>
            Виджет на рабочий стол
          </Text>
          <Text style={[styles.widgetText, { color: theme.text.primary }]}>
            Настраивается в «Ещё» → «Виджеты»: тип таймера, праздник, плашки и фото. Там же
            проверка, как он будет выглядеть.
          </Text>
        </View>
      ) : null}

      <View style={styles.exportBlock}>
        <Pressable
          style={[
            styles.exportButton,
            { borderColor: theme.overlay.border, backgroundColor: theme.overlay.fill },
          ]}
          onPress={onExport}
          disabled={exportDisabled}
          accessibilityRole="button"
          accessibilityLabel="Выгрузить плашку"
        >
          <Text style={[styles.exportButtonText, { color: theme.text.primary }]}>
            Выгрузить плашку
          </Text>
        </Pressable>
        <Text style={[styles.exportHint, { color: theme.text.secondary }]}>
          Ты получишь PNG-картинку, которую сможешь вставить в своё видео
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.deleteAllLinkWrap,
          styles.sectionSpacer,
          pressed && styles.deleteAllLinkPressed,
        ]}
        onPress={onDeleteAll}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Удалить все данные"
      >
        <Text style={styles.deleteAllLinkText}>Удалить все данные</Text>
      </Pressable>
    </>
  );
}
