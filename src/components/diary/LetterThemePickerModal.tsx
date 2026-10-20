import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { insertCustomLetterTheme } from '@/services/database';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import {
  isCustomLetterThemeId,
  LETTER_THEME_SEARCH_DEBOUNCE_MS,
  LETTER_THEME_TITLE_MAX_LENGTH,
  type LetterTheme,
} from '@/types/diary';
import { filterLetterThemes, sortLetterThemesForPicker } from '@/utils/letterThemes';

interface LetterThemePickerModalProps {
  visible: boolean;
  themes: LetterTheme[];
  usedThemeIds: string[];
  onClose: () => void;
  onSelect: (theme: LetterTheme) => void;
  onCustomAdded: (theme: LetterTheme) => Promise<void>;
}

export function LetterThemePickerModal({
  visible,
  themes,
  usedThemeIds,
  onClose,
  onSelect,
  onCustomAdded,
}: LetterThemePickerModalProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, LETTER_THEME_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, visible]);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setDebouncedQuery('');
      setAdding(false);
      setDraft('');
      setError(null);
      setSaving(false);
    }
  }, [visible]);

  const used = useMemo(() => new Set(usedThemeIds), [usedThemeIds]);
  const visibleThemes = useMemo(
    () => sortLetterThemesForPicker(filterLetterThemes(themes, debouncedQuery), usedThemeIds),
    [debouncedQuery, themes, usedThemeIds],
  );

  const saveCustom = async () => {
    if (saving) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const theme = await insertCustomLetterTheme(draft);
      await onCustomAdded(theme);
      setAdding(false);
      setDraft('');
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Не удалось сохранить тему';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Закрыть" />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Закрыть">
              <Text style={styles.headerAction}>Закрыть</Text>
            </Pressable>
            <Text style={styles.headerTitle}>Темы</Text>
            <Pressable
              onPress={() => {
                setAdding((value) => !value);
                setError(null);
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Своя тема"
            >
              <Text style={[styles.headerAction, styles.headerConfirm]}>Своя</Text>
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <Feather name="search" size={16} color={colors.light.text.secondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Найти тему"
              placeholderTextColor={colors.light.input.placeholder}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </View>

          {adding ? (
            <View style={styles.addWrap}>
              <TextInput
                value={draft}
                onChangeText={(text) => {
                  setDraft(text);
                  setError(null);
                }}
                placeholder="Название своей темы"
                placeholderTextColor={colors.light.input.placeholder}
                style={styles.addInput}
                maxLength={LETTER_THEME_TITLE_MAX_LENGTH}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => void saveCustom()}
              />
              <Text style={styles.charCount}>
                {draft.trim().length}/{LETTER_THEME_TITLE_MAX_LENGTH}
              </Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable
                onPress={() => void saveCustom()}
                style={styles.saveButton}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Сохранить тему"
              >
                {saving ? (
                  <ActivityIndicator color={colors.light.text.primary} />
                ) : (
                  <Text style={styles.saveButtonText}>Добавить и выбрать</Text>
                )}
              </Pressable>
            </View>
          ) : null}

          <FlatList
            data={visibleThemes}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {debouncedQuery.trim() ? 'Ничего не нашлось. Можно добавить свою.' : 'Тем пока нет'}
              </Text>
            }
            renderItem={({ item }) => {
              const isUsed = used.has(item.id);
              return (
                <Pressable
                  onPress={() => {
                    if (!isUsed) {
                      onSelect(item);
                    }
                  }}
                  disabled={isUsed}
                  style={[styles.row, isUsed && styles.rowUsed]}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isUsed }}
                >
                  <View style={styles.rowText}>
                    <Text style={[styles.rowTitle, isUsed && styles.rowTitleUsed]}>{item.title}</Text>
                    {isCustomLetterThemeId(item.id) ? (
                      <Text style={styles.rowMeta}>своя</Text>
                    ) : null}
                    {isUsed ? <Text style={styles.rowMeta}>уже есть письмо</Text> : null}
                  </View>
                </Pressable>
              );
            }}
          />
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
    backgroundColor: '#FCF7DF',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    height: '88%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(167, 154, 138, 0.4)',
  },
  headerTitle: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    fontWeight: '600',
    color: colors.light.text.primary,
  },
  headerAction: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    color: colors.light.text.secondary,
    minWidth: 64,
  },
  headerConfirm: {
    color: colors.light.text.primary,
    fontWeight: '600',
    textAlign: 'right',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.4)',
    borderRadius: 4,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    color: colors.light.text.primary,
    paddingVertical: 10,
  },
  addWrap: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  addInput: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    color: colors.light.text.primary,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.4)',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  charCount: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    color: colors.light.text.secondary,
    textAlign: 'right',
    marginTop: 4,
  },
  error: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.accent,
    marginTop: 6,
  },
  saveButton: {
    marginTop: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.light.text.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    fontWeight: '600',
    color: colors.light.text.primary,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  empty: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    color: colors.light.text.secondary,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  row: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(167, 154, 138, 0.28)',
  },
  rowUsed: {
    opacity: 0.55,
  },
  rowText: {
    gap: 2,
  },
  rowTitle: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    color: colors.light.text.primary,
    lineHeight: 22,
  },
  rowTitleUsed: {
    color: colors.light.text.secondary,
  },
  rowMeta: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    color: colors.light.text.secondary,
    marginTop: 2,
  },
});
