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

import { TrackerStatGrid } from '@/components/trackers/TrackerStatGrid';
import type { ServiceSummary } from '@/utils/serviceSummary';
import { loadServiceSummarySafe, serviceSummaryHeroCaption } from '@/utils/serviceSummary';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

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

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>Итоги</Text>
              <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Закрыть">
                <Feather name="x" size={22} color={colors.light.text.primary} />
              </Pressable>
            </View>

            {isLoading ? (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={colors.light.text.primary} />
              </View>
            ) : summary ? (
              <>
                <View style={styles.hero}>
                  {summary.partnerName ? (
                    <Text style={styles.heroName}>{summary.partnerName}</Text>
                  ) : null}
                  <Text style={styles.heroValue}>{summary.totalDays}</Text>
                  <Text style={styles.heroLabel}>{serviceSummaryHeroCaption(summary.totalDays)}</Text>
                  <Text style={styles.heroDates}>{summary.dateRangeLabel}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Звонки</Text>
                  <TrackerStatGrid stats={summary.callStats} />
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Встречи</Text>
                  <TrackerStatGrid stats={summary.meetingStats} />
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Дневник</Text>
                  <TrackerStatGrid stats={summary.diaryStats} />
                </View>

                {onOpenLetterBook ? (
                  <Pressable
                    style={styles.bookButton}
                    onPress={onOpenLetterBook}
                    accessibilityRole="button"
                    accessibilityLabel="Собрать книгу писем"
                  >
                    <Feather name="book-open" size={18} color={colors.light.background.start} />
                    <Text style={styles.bookButtonText}>Собрать книгу писем</Text>
                  </Pressable>
                ) : null}
              </>
            ) : (
              <Text style={styles.errorText}>Не удалось загрузить статистику</Text>
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
    backgroundColor: colors.light.background.start,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(167, 154, 138, 0.4)',
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
    color: colors.light.text.primary,
  },
  loader: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 4,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
    gap: 4,
  },
  heroName: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
    color: colors.light.text.primary,
    marginBottom: 8,
  },
  heroValue: {
    fontFamily: typography.fontFamily.display,
    fontSize: 48,
    color: colors.light.text.primary,
    lineHeight: 52,
  },
  heroLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.secondary,
  },
  heroDates: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    color: colors.light.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
    color: colors.light.text.primary,
  },
  errorText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    color: colors.light.text.secondary,
    textAlign: 'center',
    paddingVertical: 24,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.light.text.primary,
    borderRadius: 4,
    paddingVertical: 14,
    marginTop: 4,
  },
  bookButtonText: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
    color: colors.light.background.start,
  },
});
