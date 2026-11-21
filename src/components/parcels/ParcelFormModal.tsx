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
import { SegmentedControl } from '@/components/trackers/SegmentedControl';
import {
  PARCEL_CONTENTS_MAX_LENGTH,
  PARCEL_NOTE_MAX_LENGTH,
  PARCEL_TITLE_MAX_LENGTH,
  type ParcelEntry,
  type ParcelFormData,
  type ParcelKind,
  type ParcelStatus,
} from '@/types/parcels';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import { formFromParcelEntry, validateParcelForm } from '@/utils/parcelCalculations';

interface ParcelFormModalProps {
  visible: boolean;
  mode: 'add' | 'edit';
  kind: ParcelKind;
  entry: ParcelEntry | null;
  onClose: () => void;
  onSave: (form: ParcelFormData) => Promise<boolean>;
}

const KIND_OPTIONS: { value: ParcelKind; label: string }[] = [
  { value: 'parcel', label: 'Посылка' },
  { value: 'handover', label: 'Передачка' },
];

function statusOptions(kind: ParcelKind): { value: ParcelStatus; label: string }[] {
  return [
    { value: 'packing', label: 'Собираю' },
    { value: 'sent', label: kind === 'handover' ? 'Отнесла' : 'Отправила' },
    { value: 'received', label: kind === 'handover' ? 'Принял' : 'Дошла' },
  ];
}

function withStatusDates(form: ParcelFormData, status: ParcelStatus): ParcelFormData {
  const today = new Date();
  const next = { ...form, status };
  if (status === 'sent' && !next.sentDate) {
    next.sentDate = today;
  }
  if (status === 'received') {
    if (!next.sentDate) {
      next.sentDate = next.packingDate ?? today;
    }
    if (!next.receivedDate) {
      next.receivedDate = today;
    }
  }
  return next;
}

export function ParcelFormModal({
  visible,
  mode,
  kind,
  entry,
  onClose,
  onSave,
}: ParcelFormModalProps) {
  const theme = useAppTheme();
  const [form, setForm] = useState<ParcelFormData>(() => formFromParcelEntry(entry, kind));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm(formFromParcelEntry(entry, kind));
      setError(null);
      setIsSaving(false);
    }
  }, [visible, entry, kind]);

  const patch = (partial: Partial<ParcelFormData>) => {
    setForm((current) => ({ ...current, ...partial }));
    setError(null);
  };

  const handleSave = async () => {
    const message = validateParcelForm(form);
    if (message) {
      setError(message);
      return;
    }
    setIsSaving(true);
    const success = await onSave(form);
    setIsSaving(false);
    if (success) {
      onClose();
    } else {
      setError('Не удалось сохранить');
    }
  };

  const title = mode === 'add' ? 'Новая запись' : 'Изменение';
  const sentLabel = form.kind === 'handover' ? 'Когда отнесла' : 'Дата отправки';
  const receivedLabel = form.kind === 'handover' ? 'Когда принял' : 'Когда дошла';

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
            <Pressable onPress={() => void handleSave()} hitSlop={8} disabled={isSaving}>
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
            <Text style={[styles.fieldLabel, { color: theme.text.primary }]}>Вид</Text>
            <View style={styles.segmentWrap}>
              <SegmentedControl
                options={KIND_OPTIONS}
                value={form.kind}
                onChange={(nextKind) => patch({ kind: nextKind })}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: theme.text.primary }]}>Статус</Text>
            <View style={styles.segmentWrap}>
              <SegmentedControl
                options={statusOptions(form.kind)}
                value={form.status}
                onChange={(status) => setForm((current) => withStatusDates({ ...current, status }, status))}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: theme.text.primary }]}>Что внутри</Text>
            <TextInput
              value={form.contents}
              onChangeText={(text) => patch({ contents: text.slice(0, PARCEL_CONTENTS_MAX_LENGTH) })}
              placeholder="Носки, чай, письмо — своими словами"
              placeholderTextColor={theme.input.placeholder}
              multiline
              style={[
                styles.textInput,
                styles.multiline,
                {
                  color: theme.text.primary,
                  borderColor: theme.overlay.border,
                  backgroundColor: theme.overlay.fill,
                },
              ]}
              maxLength={PARCEL_CONTENTS_MAX_LENGTH}
            />
            <Text style={[styles.charCount, { color: theme.text.secondary }]}>
              {form.contents.length}/{PARCEL_CONTENTS_MAX_LENGTH}
            </Text>

            <Text style={[styles.fieldLabel, { color: theme.text.primary }]}>Название, если нужно</Text>
            <TextInput
              value={form.title}
              onChangeText={(text) => patch({ title: text.slice(0, PARCEL_TITLE_MAX_LENGTH) })}
              placeholder="Мартовская, день рождения…"
              placeholderTextColor={theme.input.placeholder}
              style={[
                styles.textInput,
                {
                  color: theme.text.primary,
                  borderColor: theme.overlay.border,
                  backgroundColor: theme.overlay.fill,
                },
              ]}
              maxLength={PARCEL_TITLE_MAX_LENGTH}
            />
            <Text style={[styles.charCount, { color: theme.text.secondary }]}>
              {form.title.length}/{PARCEL_TITLE_MAX_LENGTH}
            </Text>

            <DatePicker
              label="С какого дня собираю"
              value={form.packingDate}
              onChange={(date) => patch({ packingDate: date })}
              maximumDate={new Date()}
              labelStyle={styles.datePickerLabel}
              buttonStyle={[
                styles.datePickerButton,
                {
                  backgroundColor: theme.overlay.fill,
                  borderColor: theme.overlay.border,
                },
              ]}
              buttonTextStyle={styles.datePickerButtonText}
            />

            {form.status !== 'packing' ? (
              <DatePicker
                label={sentLabel}
                value={form.sentDate}
                onChange={(date) => patch({ sentDate: date })}
                maximumDate={new Date()}
                labelStyle={styles.datePickerLabel}
                buttonStyle={[
                  styles.datePickerButton,
                  {
                    backgroundColor: theme.overlay.fill,
                    borderColor: theme.overlay.border,
                  },
                ]}
                buttonTextStyle={styles.datePickerButtonText}
              />
            ) : null}

            {form.status === 'received' ? (
              <DatePicker
                label={receivedLabel}
                value={form.receivedDate}
                onChange={(date) => patch({ receivedDate: date })}
                maximumDate={new Date()}
                labelStyle={styles.datePickerLabel}
                buttonStyle={[
                  styles.datePickerButton,
                  {
                    backgroundColor: theme.overlay.fill,
                    borderColor: theme.overlay.border,
                  },
                ]}
                buttonTextStyle={styles.datePickerButtonText}
              />
            ) : null}

            <Text style={[styles.fieldLabel, { color: theme.text.primary }]}>Заметка для себя</Text>
            <TextInput
              value={form.note}
              onChangeText={(text) => patch({ note: text.slice(0, PARCEL_NOTE_MAX_LENGTH) })}
              placeholder="Трек не пишем — только то, что важно помнить"
              placeholderTextColor={theme.input.placeholder}
              multiline
              style={[
                styles.textInput,
                styles.multiline,
                {
                  color: theme.text.primary,
                  borderColor: theme.overlay.border,
                  backgroundColor: theme.overlay.fill,
                },
              ]}
              maxLength={PARCEL_NOTE_MAX_LENGTH}
            />
            <Text style={[styles.charCount, { color: theme.text.secondary }]}>
              {form.note.length}/{PARCEL_NOTE_MAX_LENGTH}
            </Text>

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
    maxHeight: '90%',
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
  segmentWrap: {
    marginBottom: 18,
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
  multiline: {
    height: 96,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 18,
  },
  datePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'left',
    marginBottom: 8,
    marginTop: 2,
  },
  datePickerButton: {
    marginHorizontal: 0,
    height: FORM_FIELD_HEIGHT,
    minHeight: FORM_FIELD_HEIGHT,
    paddingVertical: 0,
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginBottom: 16,
  },
  datePickerButtonText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    textAlign: 'left',
  },
  error: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});
