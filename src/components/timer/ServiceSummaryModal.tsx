import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { DembelCongratulationsBody } from '@/components/timer/DembelCongratulationsBody';
import { TrackerStatGrid } from '@/components/trackers/TrackerStatGrid';
import type { ServiceSummary } from '@/utils/serviceSummary';
import { loadServiceSummarySafe, serviceSummaryHeroCaption } from '@/utils/serviceSummary';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

/** Пока показываем только поздравление; блоки звонков/встреч/дневника вернём позже */
const SHOW_LEGACY_SUMMARY_STATS = false;

interface ServiceSummaryModalProps {
  visible: boolean;
  partnerName: string;
  enlistmentDate: Date | null;
  demobilizationDate: Date | null;
  onClose: () => void;
  onOpenLetterBook?: () => void;
}

export function ServiceSummaryModal({
  visible,
  partnerName,
  enlistmentDate,
  demobilizationDate,
  onClose,
  onOpenLetterBook,
}: ServiceSummaryModalProps) {
  const theme = useAppTheme();
  const [summary, setSummary] = useState<ServiceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!visible || !enlistmentDate || !demobilizationDate) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    void loadServiceSummarySafe({
      partnerName,
      enlistmentDate,
      demobilizationDate,
    }).then((nextSummary) => {
      if (cancelled) {
        return;
      }
      setSummary(nextSummary);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [visible, partnerName, enlistmentDate, demobilizationDate]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: theme.background.start }]}>
          <View style={[styles.handle, { backgroundColor: theme.overlay.border }]} />

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text.primary }]}>Итоги</Text>
              <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Закрыть">
                <Feather name="x" size={22} color={theme.text.primary} />
              </Pressable>
            </View>

            {isLoading ? (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={theme.text.primary} />
              </View>
            ) : summary ? (
              <>
                <DembelCongratulationsBody
                  userName={summary.userName}
                  timerVisitCount={summary.timerVisitCount}
                />

                {SHOW_LEGACY_SUMMARY_STATS ? (
                  <>
                    <View
                      style={[
                        styles.hero,
                        {
                          backgroundColor: theme.overlay.fill,
                          borderColor: theme.overlay.border,
                        },
                      ]}
                    >
                      {summary.partnerName ? (
                        <Text style={[styles.heroName, { color: theme.text.primary }]}>
                          {summary.partnerName}
                        </Text>
                      ) : null}
                      <Text style={[styles.heroValue, { color: theme.text.primary }]}>
                        {summary.totalDays}
                      </Text>
                      <Text style={[styles.heroLabel, { color: theme.text.secondary }]}>
                        {serviceSummaryHeroCaption(summary.totalDays)}
                      </Text>
                      <Text style={[styles.heroDates, { color: theme.text.secondary }]}>
                        {summary.dateRangeLabel}
                      </Text>
                    </View>

                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Звонки</Text>
                      <TrackerStatGrid stats={summary.callStats} />
                    </View>

                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Встречи</Text>
                      <TrackerStatGrid stats={summary.meetingStats} />
                    </View>

                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Дневник</Text>
                      <TrackerStatGrid stats={summary.diaryStats} />
                    </View>

                    {onOpenLetterBook ? (
                      <Pressable
                        style={[styles.bookButton, { backgroundColor: theme.text.primary }]}
                        onPress={onOpenLetterBook}
                        accessibilityRole="button"
                        accessibilityLabel="Собрать книгу писем"
                      >
                        <Feather name="book-open" size={18} color={theme.text.inverse} />
                        <Text style={[styles.bookButtonText, { color: theme.text.inverse }]}>
                          Собрать книгу писем
                        </Text>
                      </Pressable>
                    ) : null}
                  </>
                ) : null}
              </>
            ) : (
              <Text style={[styles.errorText, { color: theme.text.secondary }]}>
                Не удалось загрузить статистику
              </Text>
            )}
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
    maxHeight: '92%',
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
    paddingBottom: 28,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 22,
  },
  loader: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
    borderRadius: 4,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    gap: 4,
  },
  heroName: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
    marginBottom: 8,
  },
  heroValue: {
    fontFamily: typography.fontFamily.display,
    fontSize: 48,
    lineHeight: 52,
  },
  heroLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
  },
  heroDates: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
  },
  errorText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 24,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 4,
    paddingVertical: 14,
    marginTop: 4,
  },
  bookButtonText: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
  },
});
