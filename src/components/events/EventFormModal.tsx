import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DatePicker } from '@/components/common/DatePicker';
import { FORM_FIELD_HEIGHT } from '@/components/events/formFieldStyles';
import { IconColorPicker } from '@/components/events/IconColorPicker';
import { IconPicker } from '@/components/events/IconPicker';
import type { DisplayEvent } from '@/types/events';
import {
  EVENT_NAME_MAX_LENGTH,
  type EventDateFormat,
  type ServiceBoundaryDisplayMode,
} from '@/types/events';
import type { EventFormData } from '@/hooks/useEvents';
import {
  DEFAULT_EVENT_ICON,
  eventFormUsesAutoIconOption,
  getAutomaticEventGlyph,
  getEventFormIconDefaults,
} from '@/utils/eventGlyphs';
import { formatEventDate } from '@/utils/eventCalculations';
import { isServiceBoundaryEvent } from '@/utils/serviceBoundaryEvents';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface EventFormModalProps {
  visible: boolean;
  mode: 'add' | 'edit';
  event: DisplayEvent | null;
  onClose: () => void;
  onSave: (form: EventFormData) => Promise<boolean>;
}

const DATE_FORMAT_OPTIONS: Array<{ value: EventDateFormat; label: string }> = [
  { value: 'ddd', label: 'ддд' },
  { value: 'dpp', label: 'дпп' },
  { value: 'date', label: 'Дата' },
];

const BOUNDARY_DISPLAY_OPTIONS: Array<{ value: ServiceBoundaryDisplayMode; label: string }> = [
  { value: 'row', label: 'Выделение строки' },
  { value: 'icon', label: 'По умолчанию' },
];

function buildInitialForm(event: DisplayEvent | null): EventFormData {
  if (!event) {
    return {
      name: '',
      dateFormat: 'ddd',
      dddValue: '',
      dppValue: '',
      dateValue: null,
      icon: DEFAULT_EVENT_ICON,
      iconColor: undefined,
    };
  }

  const { icon, iconColor } = getEventFormIconDefaults(event);

  return {
    name: event.name,
    dateFormat: event.dateFormat,
    dddValue: event.dddValue !== undefined ? String(event.dddValue) : '',
    dppValue: event.dppValue !== undefined ? String(event.dppValue) : '',
    dateValue: event.dateValue ? new Date(event.dateValue) : event.date,
    icon,
    iconColor,
    boundaryDisplay: event.boundaryDisplay === 'icon' ? 'icon' : 'row',
    boundaryIconThemeDefault: event.boundaryIconThemeDefault ?? false,
  };
}

export function EventFormModal({ visible, mode, event, onClose, onSave }: EventFormModalProps) {
  const [name, setName] = useState('');
  const [dateFormat, setDateFormat] = useState<EventDateFormat>('ddd');
  const [dddValue, setDddValue] = useState('');
  const [dppValue, setDppValue] = useState('');
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [icon, setIcon] = useState<string | undefined>(DEFAULT_EVENT_ICON);
  const [iconColor, setIconColor] = useState<string | undefined>(undefined);
  const [boundaryDisplay, setBoundaryDisplay] = useState<ServiceBoundaryDisplayMode>('row');
  const [boundaryIconThemeDefault, setBoundaryIconThemeDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const theme = useAppTheme();

  useEffect(() => {
    if (visible) {
      const initial = buildInitialForm(event);
      setName(initial.name);
      setDateFormat(initial.dateFormat);
      setDddValue(initial.dddValue);
      setDppValue(initial.dppValue);
      setDateValue(initial.dateValue);
      setIcon(initial.icon);
      setIconColor(initial.iconColor);
      setBoundaryDisplay(initial.boundaryDisplay ?? 'row');
      setBoundaryIconThemeDefault(initial.boundaryIconThemeDefault ?? false);
      setError(null);
      setIsSaving(false);
    }
  }, [visible, event]);

  const isBoundary = event != null && isServiceBoundaryEvent(event.id);
  const boundaryRowMode = isBoundary && boundaryDisplay === 'row';
  const previewOnFill = boundaryRowMode && !boundaryIconThemeDefault && iconColor != null;
  const fillPreviewColor = previewOnFill ? iconColor : undefined;
  const iconPickerPreviewColor =
    isBoundary && !boundaryIconThemeDefault ? iconColor : iconColor;

  const handleSave = async () => {
    const form: EventFormData = isBoundary
      ? {
          name,
          dateFormat: event!.dateFormat,
          dddValue: event!.dddValue !== undefined ? String(event.dddValue) : '',
          dppValue: event!.dppValue !== undefined ? String(event!.dppValue) : '',
          dateValue: event!.dateValue ? new Date(event!.dateValue) : event!.date,
          icon,
          iconColor,
          boundaryDisplay,
          boundaryIconThemeDefault,
        }
      : { name, dateFormat, dddValue, dppValue, dateValue, icon, iconColor };

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Введите название');
      return;
    }
    if (trimmedName.length > EVENT_NAME_MAX_LENGTH) {
      setError(`Название не длиннее ${EVENT_NAME_MAX_LENGTH} символов`);
      return;
    }
    if (!isBoundary) {
      if (dateFormat === 'ddd') {
        const parsed = Number(dddValue.trim());
        if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
          setError('Введите целое число ддд (дней до дембеля) от 0');
          return;
        }
      } else if (dateFormat === 'dpp') {
        const parsed = Number(dppValue.trim());
        if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
          setError('Введите целое число дпп (дней после призыва) от 0');
          return;
        }
      } else if (!dateValue) {
        setError('Выберите дату');
        return;
      }
    }

    setIsSaving(true);
    const success = await onSave(form);
    setIsSaving(false);

    if (success) {
      onClose();
    } else {
      setError('Не удалось сохранить событие');
    }
  };

  const title = mode === 'add' ? 'Новое событие' : 'Изменение события';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: theme.background.start }]}>
          <View style={[styles.header, { borderBottomColor: theme.overlay.border }]}>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Отмена">
              <Text style={[styles.headerAction, { color: theme.text.secondary }]}>Отмена</Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.text.primary }]}>{title}</Text>
            <Pressable onPress={handleSave} hitSlop={8} disabled={isSaving}>
              <Text style={[styles.headerAction, styles.headerConfirm, { color: theme.text.primary }]}>
                {isSaving ? '...' : 'Готово'}
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.fieldLabel, { color: theme.text.primary }]}>Название</Text>
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text.slice(0, EVENT_NAME_MAX_LENGTH));
                setError(null);
              }}
              placeholder="Название события"
              placeholderTextColor={theme.input.placeholder}
              style={[
                styles.textInput,
                {
                  color: theme.text.primary,
                  borderColor: theme.overlay.border,
                  backgroundColor: theme.overlay.fill,
                },
              ]}
              maxLength={EVENT_NAME_MAX_LENGTH}
            />
            <Text style={[styles.charCount, { color: theme.text.secondary }]}>
              {name.length}/{EVENT_NAME_MAX_LENGTH}
            </Text>

            {isBoundary ? (
              <>
                <Text style={[styles.fieldLabel, { color: theme.text.primary }]}>Оформление</Text>
                <View style={styles.formatRow}>
                  {BOUNDARY_DISPLAY_OPTIONS.map((option) => {
                    const isActive = boundaryDisplay === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        style={[
                          styles.formatButton,
                          {
                            borderColor: theme.overlay.border,
                            backgroundColor: theme.overlay.fill,
                          },
                          isActive && {
                            borderColor: theme.text.primary,
                            backgroundColor: theme.overlay.muted,
                          },
                        ]}
                        onPress={() => {
                          setBoundaryDisplay(option.value);
                          setError(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.formatButtonText,
                            { color: theme.text.secondary },
                            isActive && { color: theme.text.primary, fontWeight: '600' },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            <IconPicker
              value={icon}
              onChange={setIcon}
              previewColor={iconPickerPreviewColor}
              previewOnFill={previewOnFill}
              previewFillColor={fillPreviewColor}
              autoGlyph={
                event && eventFormUsesAutoIconOption(event)
                  ? getAutomaticEventGlyph(event)
                  : undefined
              }
            />
            <IconColorPicker
              value={iconColor}
              onChange={(color) => {
                if (color) {
                  setIconColor(color);
                  setBoundaryIconThemeDefault(false);
                } else {
                  setIconColor(undefined);
                  setBoundaryIconThemeDefault(true);
                }
              }}
              label={
                isBoundary
                  ? boundaryDisplay === 'row'
                    ? 'Цвет заливки'
                    : 'Цвет иконки'
                  : undefined
              }
              swatchFallbackColor={boundaryIconThemeDefault ? theme.text.primary : undefined}
              showReset={isBoundary && !boundaryIconThemeDefault && iconColor != null}
            />

            {isBoundary && event ? (
              <>
                <Text style={[styles.fieldLabel, { color: theme.text.primary }]}>Дата</Text>
                <Text style={[styles.readOnlyDate, { color: theme.text.secondary }]}>
                  {formatEventDate(event.date)}
                </Text>
              </>
            ) : null}

            {!isBoundary ? (
            <>
            <Text style={[styles.fieldLabel, { color: theme.text.primary }]}>Формат даты</Text>
            <View style={styles.formatRow}>
              {DATE_FORMAT_OPTIONS.map((option) => {
                const isActive = dateFormat === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.formatButton,
                      {
                        borderColor: theme.overlay.border,
                        backgroundColor: theme.overlay.fill,
                      },
                      isActive && {
                        borderColor: theme.text.primary,
                        backgroundColor: theme.overlay.muted,
                      },
                    ]}
                    onPress={() => {
                      setDateFormat(option.value);
                      setError(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.formatButtonText,
                        { color: theme.text.secondary },
                        isActive && { color: theme.text.primary, fontWeight: '600' },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {dateFormat === 'ddd' ? (
              <>
                <Text style={[styles.fieldLabel, { color: theme.text.primary }]}>Дней до дембеля (ддд)</Text>
                <TextInput
                  value={dddValue}
                  onChangeText={(text) => {
                    setDddValue(text.replace(/[^0-9]/g, ''));
                    setError(null);
                  }}
                  placeholder="Например, 303"
                  placeholderTextColor={theme.input.placeholder}
                  style={[
                    styles.textInput,
                    {
                      color: theme.text.primary,
                      borderColor: theme.overlay.border,
                      backgroundColor: theme.overlay.fill,
                    },
                  ]}
                  keyboardType="number-pad"
                />
              </>
            ) : dateFormat === 'dpp' ? (
              <>
                <Text style={[styles.fieldLabel, { color: theme.text.primary }]}>Дней после призыва (дпп)</Text>
                <TextInput
                  value={dppValue}
                  onChangeText={(text) => {
                    setDppValue(text.replace(/[^0-9]/g, ''));
                    setError(null);
                  }}
                  placeholder="Например, 100"
                  placeholderTextColor={theme.input.placeholder}
                  style={[
                    styles.textInput,
                    {
                      color: theme.text.primary,
                      borderColor: theme.overlay.border,
                      backgroundColor: theme.overlay.fill,
                    },
                  ]}
                  keyboardType="number-pad"
                />
              </>
            ) : (
              <DatePicker
                label="Дата события"
                value={dateValue}
                onChange={(date) => {
                  setDateValue(date);
                  setError(null);
                }}
                labelStyle={styles.datePickerLabel}
                buttonStyle={styles.datePickerButton}
                buttonTextStyle={styles.datePickerButtonText}
              />
            )}
            </>
            ) : null}

            {error ? <Text style={[styles.error, { color: theme.text.accent }]}>{error}</Text> : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
  },
  headerAction: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    minWidth: 64,
  },
  headerConfirm: {
    fontWeight: '600',
    textAlign: 'right',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  fieldLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    height: FORM_FIELD_HEIGHT,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 0,
    paddingHorizontal: 14,
    marginBottom: 4,
    textAlignVertical: 'center',
  },
  charCount: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 20,
  },
  readOnlyDate: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    marginBottom: 20,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  formatButton: {
    flex: 1,
    height: FORM_FIELD_HEIGHT,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatButtonText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
  },
  datePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'left',
    marginBottom: 8,
  },
  datePickerButton: {
    marginHorizontal: 0,
    height: FORM_FIELD_HEIGHT,
    minHeight: FORM_FIELD_HEIGHT,
    paddingVertical: 0,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  datePickerButtonText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    textAlign: 'left',
  },
  error: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
