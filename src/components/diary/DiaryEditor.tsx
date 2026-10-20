import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { DiaryDateButton } from '@/components/diary/DiaryDateButton';
import { DiaryImageBlockView } from '@/components/diary/DiaryImageBlock';
import { DiaryParagraph } from '@/components/diary/DiaryParagraph';
import { DiaryToolbar } from '@/components/diary/DiaryToolbar';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { persistDiaryPhoto, readImageSize, removeDiaryPhotoIfOwned, useDiaryEntry } from '@/hooks/useDiary';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { DiaryBlock, DiaryKind, DiaryTextStyle } from '@/types/diary';
import { DEFAULT_DIARY_TEXT_STYLE } from '@/types/diary';
import {
  applyStyleToRange,
  cloneStyle,
  createEmptyDocument,
  createImageBlock,
  documentsEqual,
  dropIndexForY,
  insertImageAtCursor,
  moveBlock,
  parseDateStamp,
  removeBlock,
  styleAtOffset,
} from '@/utils/diaryContent';
import { logger } from '@/utils/logger';

interface DiaryEditorProps {
  kind: DiaryKind;
  date: string;
  onDateChange: (nextDate: string) => void;
  themeId?: string;
  themeTitle?: string;
  startFresh?: boolean;
  extraHeaderAction?: ReactNode;
}

interface Selection {
  start: number;
  end: number;
}

/** Общий лист дневника: текст, фото, форматирование, сохранение */
export function DiaryEditor({
  kind,
  date,
  onDateChange,
  themeId,
  themeTitle,
  startFresh = false,
  extraHeaderAction,
}: DiaryEditorProps) {
  const navigation = useNavigation();
  const { isLoading, entry, save } = useDiaryEntry(kind, date);

  const [baseline, setBaseline] = useState(() => createEmptyDocument());
  const [blocks, setBlocks] = useState<DiaryBlock[]>(() => baseline.blocks);
  const [typingStyle, setTypingStyle] = useState<DiaryTextStyle>(cloneStyle(DEFAULT_DIARY_TEXT_STYLE));
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>({ start: 0, end: 0 });
  const [workSize, setWorkSize] = useState({ width: 0, height: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(Boolean(startFresh));

  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  const layoutsRef = useRef<Record<string, { y: number; height: number }>>({});
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const skipGuardRef = useRef(false);

  const dirty = useMemo(
    () => !documentsEqual({ version: 1, blocks }, baseline),
    [blocks, baseline],
  );

  useEffect(() => {
    if (!startFresh) {
      return;
    }

    const empty = createEmptyDocument();
    setBlocks(empty.blocks);
    setBaseline(empty);
    setFocusedBlockId(empty.blocks[0]?.id ?? null);
    setSelectedImageId(null);
    setIsEditing(true);
  }, [date, startFresh]);

  useEffect(() => {
    if (startFresh || isLoading) {
      return;
    }

    const document = entry?.document ?? createEmptyDocument();
    setBlocks(document.blocks);
    setBaseline(document);
    setFocusedBlockId(document.blocks.find((block) => block.type === 'paragraph')?.id ?? null);
    setSelectedImageId(null);
    setIsEditing(false);
  }, [date, startFresh, isLoading, entry?.id]);

  const persist = useCallback(async (exitEditing = false) => {
    setIsSaving(true);
    const ok = await save({ version: 1, blocks: blocksRef.current }, themeId);
    setIsSaving(false);
    if (ok) {
      setBaseline({ version: 1, blocks: blocksRef.current });
      if (exitEditing) {
        setIsEditing(false);
        setSelectedImageId(null);
      }
    } else {
      Alert.alert('Не удалось сохранить', 'Попробуйте ещё раз');
    }
    return ok;
  }, [save, themeId]);

  const persistRef = useRef(persist);
  persistRef.current = persist;

  useEffect(() => {
    if (!isEditing || !dirty || isSaving) {
      return;
    }

    const timer = setTimeout(() => {
      void persistRef.current(false);
    }, 700);

    return () => clearTimeout(timer);
  }, [blocks, dirty, isEditing, isSaving]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (!dirty || skipGuardRef.current || event.data.action.type === 'REPLACE') {
        return;
      }

      event.preventDefault();
      void persistRef.current(false).then((ok) => {
        if (!ok) {
          return;
        }
        skipGuardRef.current = true;
        navigation.dispatch(event.data.action);
      });
    });

    return unsubscribe;
  }, [dirty, navigation]);

  const handleFormatChange = (patch: Partial<DiaryTextStyle>) => {
    const nextStyle = { ...typingStyle, ...patch };
    setTypingStyle(nextStyle);

    const focused = blocksRef.current.find((block) => block.id === focusedBlockId);
    if (!focused || focused.type !== 'paragraph' || selection.start === selection.end) {
      return;
    }

    const nextSpans = applyStyleToRange(focused.spans, selection.start, selection.end, patch);
    setBlocks((current) =>
      current.map((block) =>
        block.id === focused.id && block.type === 'paragraph' ? { ...block, spans: nextSpans } : block,
      ),
    );
  };

  const handleParagraphSelection = (blockId: string, start: number, end: number) => {
    setSelectedImageId(null);
    setSelection({ start, end });
    setSelection({ start, end });
    const block = blocksRef.current.find((item) => item.id === blockId);
    if (block?.type === 'paragraph') {
      setTypingStyle(styleAtOffset(block.spans, start));
    }
  };

  const requestDateChange = (next: Date) => {
    const nextDate = format(next, 'yyyy-MM-dd');
    if (nextDate === date) {
      return;
    }

    const apply = () => onDateChange(nextDate);

    if (!dirty) {
      apply();
      return;
    }

    void persist(false).then((ok) => {
      if (ok) {
        apply();
      }
    });
  };

  const insertPickedPhoto = async (uri: string) => {
    try {
      const savedUri = await persistDiaryPhoto(uri);
      const size = await readImageSize(savedUri);
      const image = createImageBlock(savedUri, size.width / Math.max(1, size.height));
      const focusedIndex = blocksRef.current.findIndex((block) => block.id === focusedBlockId);
      const next = insertImageAtCursor(
        blocksRef.current,
        focusedIndex >= 0 ? focusedIndex : null,
        image,
        typingStyle,
      );
      setBlocks(next);
      setSelectedImageId(image.id);

      const imageIndex = next.findIndex((block) => block.id === image.id);
      const after = next[imageIndex + 1];
      if (after?.type === 'paragraph') {
        setFocusedBlockId(after.id);
        requestAnimationFrame(() => inputRefs.current[after.id]?.focus());
      }
    } catch (error) {
      logger.error('Ошибка вставки фото в дневник', error);
      Alert.alert('Не удалось добавить фото', 'Попробуйте выбрать другое изображение');
    }
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Нет доступа', 'Разрешите доступ к галерее');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await insertPickedPhoto(result.assets[0].uri);
    }
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Нет доступа', 'Разрешите доступ к камере');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await insertPickedPhoto(result.assets[0].uri);
    }
  };

  const handleAddPhoto = () => {
    Alert.alert('Фото в дневник', 'Куда вставить снимок?', [
      { text: 'Галерея', onPress: () => void pickFromLibrary() },
      { text: 'Камера', onPress: () => void pickFromCamera() },
      { text: 'Отмена', style: 'cancel' },
    ]);
  };

  const handleMoveImage = (blockId: string, translationY: number) => {
    const layout = layoutsRef.current[blockId];
    if (!layout) {
      return;
    }

    const dropY = layout.y + layout.height / 2 + translationY;
    const layouts = blocksRef.current.flatMap((block) => {
      const item = layoutsRef.current[block.id];
      return item ? [{ id: block.id, y: item.y, height: item.height }] : [];
    });
    const toIndex = dropIndexForY(layouts, dropY);
    setBlocks(moveBlock(blocksRef.current, blockId, toIndex));
  };

  const enterEditing = () => {
    setIsEditing(true);
    setSelectedImageId(null);
  };

  const exitEditing = () => {
    void persist(true);
  };

  const blurInputs = () => {
    Object.values(inputRefs.current).forEach((ref) => ref?.blur());
  };

  const parsedDate = parseDateStamp(date);
  const maximumDate = new Date();

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Назад"
            >
              <Feather name="chevron-left" size={26} color={colors.light.text.primary} />
            </Pressable>

            <DiaryDateButton date={parsedDate} onChange={requestDateChange} maximumDate={maximumDate} />

            <View style={styles.headerRight}>
              {extraHeaderAction}
              {isEditing ? (
                <Pressable
                  onPress={exitEditing}
                  style={styles.iconAction}
                  disabled={isSaving}
                  accessibilityRole="button"
                  accessibilityLabel="Готово"
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={colors.light.text.primary} />
                  ) : (
                    <Feather name="check" size={22} color={colors.light.text.primary} />
                  )}
                </Pressable>
              ) : (
                <Pressable
                  onPress={enterEditing}
                  style={styles.iconAction}
                  accessibilityRole="button"
                  accessibilityLabel="Редактировать"
                >
                  <Feather name="edit-2" size={20} color={colors.light.text.primary} />
                </Pressable>
              )}
            </View>
          </View>

          {themeTitle ? (
            <Text style={styles.themeTitle} numberOfLines={2}>
              «{themeTitle}»
            </Text>
          ) : null}

          {isEditing ? <DiaryToolbar style={typingStyle} onChange={handleFormatChange} /> : null}

          {isLoading && !startFresh ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={colors.light.text.primary} />
            </View>
          ) : (
            <View
              style={styles.paper}
              onLayout={(event) => {
                const { width, height } = event.nativeEvent.layout;
                setWorkSize({ width, height });
              }}
            >
              <ScrollView
                style={styles.flex}
                contentContainerStyle={[
                  styles.paperContent,
                  !isEditing && styles.paperContentRead,
                ]}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={!dragging}
                onScrollBeginDrag={() => setSelectedImageId(null)}
              >
                {blocks.map((block) => (
                  <View
                    key={block.id}
                    onLayout={(event) => {
                      layoutsRef.current[block.id] = {
                        y: event.nativeEvent.layout.y,
                        height: event.nativeEvent.layout.height,
                      };
                    }}
                  >
                    {block.type === 'paragraph' ? (
                      <DiaryParagraph
                        block={block}
                        typingStyle={typingStyle}
                        editable={isEditing}
                        inputRef={(ref) => {
                          inputRefs.current[block.id] = ref;
                        }}
                        onFocus={() => {
                          setFocusedBlockId(block.id);
                          setSelectedImageId(null);
                        }}
                        onChangeSpans={(spans) => {
                          setBlocks((current) =>
                            current.map((item) =>
                              item.id === block.id && item.type === 'paragraph' ? { ...item, spans } : item,
                            ),
                          );
                        }}
                        onSelectionChange={(start, end) => handleParagraphSelection(block.id, start, end)}
                      />
                    ) : (
                      <DiaryImageBlockView
                        block={block}
                        selected={isEditing && selectedImageId === block.id}
                        workWidth={Math.max(0, workSize.width - 32)}
                        workHeight={Math.max(0, workSize.height - 24)}
                        onSelect={() => {
                          if (!isEditing) {
                            return;
                          }
                          blurInputs();
                          setSelectedImageId(block.id);
                          setFocusedBlockId(block.id);
                        }}
                        onDelete={() => {
                          if (block.type === 'image') {
                            void removeDiaryPhotoIfOwned(block.uri);
                          }
                          setBlocks(removeBlock(blocksRef.current, block.id));
                          setSelectedImageId(null);
                        }}
                        onMoveEnd={(translationY) => handleMoveImage(block.id, translationY)}
                        onResize={(widthRatio) => {
                          setBlocks((current) =>
                            current.map((item) =>
                              item.id === block.id && item.type === 'image'
                                ? { ...item, widthRatio }
                                : item,
                            ),
                          );
                        }}
                        onDragActiveChange={setDragging}
                      />
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {isEditing ? (
            <Pressable
              style={styles.fab}
              onPress={handleAddPhoto}
              accessibilityRole="button"
              accessibilityLabel="Добавить фото"
            >
              <Feather name="plus" size={28} color={colors.light.text.primary} />
            </Pressable>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAction: {
    width: 40,
    height: 40,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.35)',
  },
  themeTitle: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    color: colors.light.text.secondary,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  paper: {
    flex: 1,
    zIndex: 0,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 253, 246, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.28)',
    overflow: 'hidden',
  },
  paperContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 88,
  },
  paperContentRead: {
    paddingBottom: 24,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: colors.light.background.start,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#3E3630',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
