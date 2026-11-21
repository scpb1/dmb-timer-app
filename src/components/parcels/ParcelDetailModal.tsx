import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { DatePicker } from '@/components/common/DatePicker';
import { FORM_FIELD_HEIGHT } from '@/components/events/formFieldStyles';
import type { ParcelEntry, ParcelStatus } from '@/types/parcels';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import {
  formatParcelDate,
  fromParcelDateKey,
  nextParcelStatus,
  parcelAdvanceActionLabel,
  parcelCardTitle,
  parcelKindLabel,
  parcelStatusLabel,
  parcelTimeline,
} from '@/utils/parcelCalculations';

interface ParcelDetailModalProps {
  visible: boolean;
  entry: ParcelEntry | null;
  onClose: () => void;
  onEdit: (entry: ParcelEntry) => void;
  onDelete: (id: string) => Promise<void>;
  onAdvance: (id: string, nextStatus: ParcelStatus, date: Date) => Promise<string | null>;
}

export function ParcelDetailModal({
  visible,
  entry,
  onClose,
  onEdit,
  onDelete,
  onAdvance,
}: ParcelDetailModalProps) {
  const theme = useAppTheme();
  const [advanceDate, setAdvanceDate] = useState(new Date());
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setAdvanceDate(new Date());
      setIsAdvancing(false);
      setAdvanceError(null);
    }
  }, [visible, entry?.id, entry?.status]);

  if (!entry) {
    return null;
  }

  const nextStatus = nextParcelStatus(entry.status);
  const advanceLabel = nextStatus ? parcelAdvanceActionLabel(entry.kind, entry.status) : null;
  const advanceDateLabel =
    nextStatus === 'sent'
      ? entry.kind === 'handover'
        ? 'Когда отнесла'
        : 'Дата отправки'
      : entry.kind === 'handover'
        ? 'Когда принял'
        : 'Когда дошла';

  const handleDelete = () => {
    Alert.alert('Удалить запись?', 'Её можно вернуть сразу после удаления', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          void onDelete(entry.id);
          onClose();
        },
      },
    ]);
  };

  const advanceMinimumDate = nextStatus
    ? fromParcelDateKey(nextStatus === 'received' && entry.sentDate ? entry.sentDate : entry.packingDate)
    : undefined;

  const handleAdvance = async () => {
    if (!nextStatus) {
      return;
    }
    setIsAdvancing(true);
    setAdvanceError(null);
    const error = await onAdvance(entry.id, nextStatus, advanceDate);
    setIsAdvancing(false);
    if (error) {
      setAdvanceError(error);
      return;
    }
    setAdvanceDate(new Date());
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.background.start }]}>
          <View style={[styles.handle, { backgroundColor: theme.overlay.border }]} />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={[styles.kind, { color: theme.text.secondary }]}>
                  {parcelKindLabel(entry.kind)} · {parcelStatusLabel(entry.kind, entry.status)}
                </Text>
                <Text style={[styles.title, { color: theme.text.primary }]}>{parcelCardTitle(entry)}</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Закрыть">
                <Feather name="x" size={22} color={theme.text.primary} />
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Что внутри</Text>
              <Text style={[styles.body, { color: theme.text.primary }]}>{entry.contents}</Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Даты</Text>
              {parcelTimeline(entry).map((item) => (
                <View key={item.key} style={styles.timelineRow}>
                  <Text style={[styles.timelineLabel, { color: theme.text.secondary }]}>{item.label}</Text>
                  <Text style={[styles.timelineValue, { color: theme.text.primary }]}>
                    {item.dateKey ? formatParcelDate(item.dateKey) : '—'}
                  </Text>
                </View>
              ))}
            </View>

            {entry.note ? (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Заметка</Text>
                <Text style={[styles.body, { color: theme.text.primary }]}>{entry.note}</Text>
              </View>
            ) : null}

            {nextStatus && advanceLabel ? (
              <View style={styles.section}>
                <DatePicker
                  label={advanceDateLabel}
                  value={advanceDate}
                  onChange={setAdvanceDate}
                  minimumDate={advanceMinimumDate}
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
                <Pressable
                  style={[
                    styles.advanceButton,
                    {
                      backgroundColor: theme.overlay.fill,
                      borderColor: theme.overlay.border,
                    },
                  ]}
                  onPress={() => void handleAdvance()}
                  disabled={isAdvancing}
                  accessibilityRole="button"
                  accessibilityLabel={advanceLabel}
                >
                  <Text style={[styles.advanceButtonText, { color: theme.text.primary }]}>
                    {isAdvancing ? '…' : advanceLabel}
                  </Text>
                </Pressable>
                {advanceError ? (
                  <Text style={[styles.error, { color: theme.text.accent }]}>{advanceError}</Text>
                ) : null}
              </View>
            ) : null}

            <Pressable
              style={[
                styles.editButton,
                {
                  backgroundColor: theme.overlay.fill,
                  borderColor: theme.overlay.border,
                },
              ]}
              onPress={() => {
                onEdit(entry);
                onClose();
              }}
            >
              <Feather name="edit-2" size={18} color={theme.text.primary} />
              <Text style={[styles.editButtonText, { color: theme.text.primary }]}>Изменить</Text>
            </Pressable>

            <Pressable style={styles.deleteButton} onPress={handleDelete}>
              <Feather name="trash-2" size={18} color={theme.text.accent} />
              <Text style={[styles.deleteButtonText, { color: theme.text.accent }]}>Удалить</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
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
    maxHeight: '85%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  kind: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    marginBottom: 4,
  },
  title: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 22,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
  },
  body: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    lineHeight: 22,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  timelineLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
  },
  timelineValue: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    textAlign: 'right',
    flexShrink: 1,
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
  advanceButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 4,
    borderWidth: 1,
  },
  advanceButtonText: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 15,
  },
  error: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    textAlign: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 4,
    borderWidth: 1,
  },
  editButtonText: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 15,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  deleteButtonText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
  },
});
