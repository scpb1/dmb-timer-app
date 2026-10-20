import { useState } from 'react';
import {
  ActivityIndicator,
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

import { LETTER_BOOK_VARIANTS } from '@/types/letterBook';
import type { LetterBookVariantId } from '@/types/letterBook';
import { exportLetterBook } from '@/utils/exportLetterBook';
import { logger } from '@/utils/logger';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface LetterBookExportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LetterBookExportModal({ visible, onClose }: LetterBookExportModalProps) {
  const [selectedId, setSelectedId] = useState<LetterBookVariantId>('classic');
  const [includePhotos, setIncludePhotos] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);
    try {
      await exportLetterBook(selectedId, { includePhotos });
    } catch (error) {
      logger.error('Ошибка экспорта книги писем', error);
      Alert.alert('Ошибка', 'Не удалось собрать книгу');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>Книга писем</Text>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Закрыть"
              >
                <Feather name="x" size={22} color={colors.light.text.primary} />
              </Pressable>
            </View>

            <Text style={styles.lead}>
              Соберите письма солдату в PDF. В книгу войдут те же итоги, что на дембеле: дни
              службы, звонки, встречи и дневник.
            </Text>

            {LETTER_BOOK_VARIANTS.map((variant) => {
              const selected = variant.id === selectedId;
              return (
                <Pressable
                  key={variant.id}
                  style={[styles.card, selected && styles.cardSelected]}
                  onPress={() => setSelectedId(variant.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={variant.title}
                >
                  <View style={styles.iconWrap}>
                    <Feather name={variant.icon} size={22} color={colors.light.text.primary} />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{variant.title}</Text>
                    <Text style={styles.cardSubtitle}>{variant.subtitle}</Text>
                    <Text style={styles.cardHint}>{variant.hint}</Text>
                  </View>
                  <View style={[styles.radio, selected && styles.radioSelected]} />
                </Pressable>
              );
            })}

            <Pressable
              style={styles.checkRow}
              onPress={() => setIncludePhotos((prev) => !prev)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: includePhotos }}
              accessibilityLabel="Добавлять фото"
            >
              <View style={[styles.checkbox, includePhotos && styles.checkboxOn]}>
                {includePhotos ? (
                  <Feather name="check" size={14} color={colors.light.background.start} />
                ) : null}
              </View>
              <View style={styles.checkText}>
                <Text style={styles.checkLabel}>
                  {includePhotos ? 'Добавлять фото' : 'Игнорировать фото'}
                </Text>
                <Text style={styles.checkHint}>
                  {includePhotos
                    ? 'Снимки из писем встанут по центру, около двух третей ширины страницы'
                    : 'В книге останется только текст писем'}
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[styles.button, isExporting && styles.buttonDisabled]}
              onPress={() => void handleExport()}
              disabled={isExporting}
              accessibilityRole="button"
              accessibilityLabel="Собрать PDF"
            >
              {isExporting ? (
                <ActivityIndicator color={colors.light.background.start} />
              ) : (
                <Text style={styles.buttonText}>Собрать PDF</Text>
              )}
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
    gap: 12,
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
  lead: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.secondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.28)',
  },
  cardSelected: {
    borderColor: colors.light.text.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
    color: colors.light.text.primary,
  },
  cardSubtitle: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    color: colors.light.text.primary,
    marginTop: 2,
  },
  cardHint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    color: colors.light.text.secondary,
    marginTop: 4,
    lineHeight: 17,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 154, 138, 0.7)',
    marginTop: 4,
  },
  radioSelected: {
    borderColor: colors.light.text.primary,
    backgroundColor: colors.light.text.primary,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 154, 138, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  checkboxOn: {
    backgroundColor: colors.light.text.primary,
    borderColor: colors.light.text.primary,
  },
  checkText: {
    flex: 1,
    gap: 3,
  },
  checkLabel: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 15,
    color: colors.light.text.primary,
  },
  checkHint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    color: colors.light.text.secondary,
    lineHeight: 17,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light.text.primary,
    borderRadius: 4,
    paddingVertical: 14,
    minHeight: 48,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
    color: colors.light.background.start,
  },
});
