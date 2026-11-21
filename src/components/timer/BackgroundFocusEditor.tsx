import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PositionedCoverImage } from '@/components/common/PositionedCoverImage';
import { useImageSize } from '@/hooks/useImageSize';
import { DEFAULT_BACKGROUND_FOCUS } from '@/types/timer';
import { coverImageFrame, focusAfterDrag } from '@/utils/coverImageFrame';
import { typography } from '@/theme/typography';

interface BackgroundFocusEditorProps {
  visible: boolean;
  uri: string | null;
  focusX: number;
  focusY: number;
  onCancel: () => void;
  onSave: (focusX: number, focusY: number) => void;
}

/** Полноэкранный сдвиг кадра: то, что видно здесь, видно на таймере. */
export function BackgroundFocusEditor({
  visible,
  uri,
  focusX,
  focusY,
  onCancel,
  onSave,
}: BackgroundFocusEditorProps) {
  const [draft, setDraft] = useState({ x: focusX, y: focusY });
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);
  const imageSize = useImageSize(uri);
  const draftRef = useRef(draft);
  const originRef = useRef(draft);
  const overflowRef = useRef({ x: 0, y: 0 });
  const onSaveRef = useRef(onSave);
  const onCancelRef = useRef(onCancel);

  const fittedFrame =
    layout && imageSize
      ? coverImageFrame(layout, imageSize, DEFAULT_BACKGROUND_FOCUS, DEFAULT_BACKGROUND_FOCUS)
      : null;
  overflowRef.current = {
    x: fittedFrame?.overflowX ?? 0,
    y: fittedFrame?.overflowY ?? 0,
  };
  draftRef.current = draft;
  onSaveRef.current = onSave;
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!visible) {
      return;
    }
    const next = { x: focusX, y: focusY };
    originRef.current = next;
    setDraft(next);
  }, [visible, uri, focusX, focusY]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
      onPanResponderGrant: () => {
        originRef.current = draftRef.current;
      },
      onPanResponderMove: (_, gesture) => {
        const next = focusAfterDrag(
          originRef.current,
          { x: gesture.dx, y: gesture.dy },
          overflowRef.current,
        );
        draftRef.current = next;
        setDraft(next);
      },
    }),
  ).current;

  const canMove = !fittedFrame || fittedFrame.overflowX > 1 || fittedFrame.overflowY > 1;
  const hint =
    fittedFrame && fittedFrame.overflowX <= 1 && fittedFrame.overflowY <= 1
      ? 'Это фото и так целиком помещается в экран'
      : 'Потяните фото, чтобы выбрать видимую часть';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.root}>
        <View
          style={styles.stage}
          {...pan.panHandlers}
          onLayout={(event) => {
            const next = {
              width: event.nativeEvent.layout.width,
              height: event.nativeEvent.layout.height,
            };
            setLayout((prev) =>
              prev && prev.width === next.width && prev.height === next.height ? prev : next,
            );
          }}
          accessibilityLabel="Сдвиньте фото"
        >
          {uri && layout ? (
            <PositionedCoverImage
              uri={uri}
              focusX={draft.x}
              focusY={draft.y}
              width={layout.width}
              height={layout.height}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
        </View>

        <SafeAreaView style={styles.chrome} edges={['top', 'bottom']} pointerEvents="box-none">
          <View style={styles.hintWrap} pointerEvents="none">
            <Text style={styles.hint}>{hint}</Text>
          </View>
          <View style={styles.actions}>
            <Pressable
              style={styles.action}
              onPress={() => onCancelRef.current()}
              accessibilityRole="button"
              accessibilityLabel="Отмена"
            >
              <Text style={styles.actionText}>Отмена</Text>
            </Pressable>
            <Pressable
              style={styles.action}
              onPress={() => {
                const next = { x: DEFAULT_BACKGROUND_FOCUS, y: DEFAULT_BACKGROUND_FOCUS };
                draftRef.current = next;
                setDraft(next);
              }}
              disabled={!canMove}
              accessibilityRole="button"
              accessibilityLabel="По центру"
            >
              <Text style={[styles.actionText, !canMove && styles.actionTextDisabled]}>
                По центру
              </Text>
            </Pressable>
            <Pressable
              style={[styles.action, styles.saveAction]}
              onPress={() => onSaveRef.current(draftRef.current.x, draftRef.current.y)}
              accessibilityRole="button"
              accessibilityLabel="Готово"
            >
              <Text style={styles.saveText}>Готово</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#08080A',
  },
  stage: {
    flex: 1,
  },
  chrome: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  hintWrap: {
    alignSelf: 'center',
    marginTop: 12,
    marginHorizontal: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(8, 8, 10, 0.72)',
  },
  hint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    lineHeight: 18,
    color: '#F2F0EC',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(8, 8, 10, 0.72)',
  },
  action: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  actionText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    color: '#F2F0EC',
  },
  actionTextDisabled: {
    opacity: 0.4,
  },
  saveAction: {
    backgroundColor: '#F2F0EC',
  },
  saveText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    color: '#08080A',
  },
});
