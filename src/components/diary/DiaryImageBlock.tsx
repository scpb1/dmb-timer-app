import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { DIARY_MIN_PHOTO_RATIO, type DiaryImageBlock } from '@/types/diary';
import { clampPhotoSize } from '@/utils/diaryContent';

interface DiaryImageBlockViewProps {
  block: DiaryImageBlock;
  selected: boolean;
  workWidth: number;
  workHeight: number;
  onSelect: () => void;
  onDelete: () => void;
  onMoveEnd: (translationY: number) => void;
  onResize: (widthRatio: number) => void;
  onDragActiveChange: (active: boolean) => void;
}

/** Фото в дневнике: выбор, перенос, удаление, масштаб */
export function DiaryImageBlockView({
  block,
  selected,
  workWidth,
  workHeight,
  onSelect,
  onDelete,
  onMoveEnd,
  onResize,
  onDragActiveChange,
}: DiaryImageBlockViewProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const rawWidth = Math.max(1, workWidth) * block.widthRatio;
  const rawHeight = rawWidth / Math.max(0.1, block.aspectRatio);
  const size = clampPhotoSize(rawWidth, rawHeight, Math.max(1, workWidth), Math.max(1, workHeight));
  const widthValue = useSharedValue(size.width);
  const heightValue = useSharedValue(size.height);
  const startWidth = useSharedValue(size.width);

  useEffect(() => {
    widthValue.value = size.width;
    heightValue.value = size.height;
    startWidth.value = size.width;
  }, [heightValue, size.height, size.width, startWidth, widthValue]);

  const moveGesture = Gesture.Pan()
    .enabled(selected)
    .onBegin(() => {
      runOnJS(onDragActiveChange)(true);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      runOnJS(onMoveEnd)(event.translationY);
      translateX.value = 0;
      translateY.value = 0;
      runOnJS(onDragActiveChange)(false);
    })
    .onFinalize(() => {
      translateX.value = 0;
      translateY.value = 0;
      runOnJS(onDragActiveChange)(false);
    });

  const resizeGesture = Gesture.Pan()
    .enabled(selected)
    .onBegin(() => {
      startWidth.value = widthValue.value;
      runOnJS(onDragActiveChange)(true);
    })
    .onUpdate((event) => {
      const safeWorkWidth = Math.max(1, workWidth);
      const safeWorkHeight = Math.max(1, workHeight);
      const aspectRatio = Math.max(0.1, block.aspectRatio);
      const maxWidth = Math.min(safeWorkWidth, safeWorkHeight * aspectRatio);
      const requestedMinWidth = Math.max(
        safeWorkWidth * DIARY_MIN_PHOTO_RATIO,
        safeWorkHeight * DIARY_MIN_PHOTO_RATIO * aspectRatio,
      );
      const minWidth = Math.min(maxWidth, requestedMinWidth);
      const delta = (event.translationX + event.translationY) / 2;
      const nextWidth = Math.min(maxWidth, Math.max(minWidth, startWidth.value + delta));
      widthValue.value = nextWidth;
      heightValue.value = nextWidth / aspectRatio;
    })
    .onEnd(() => {
      runOnJS(onResize)(widthValue.value / Math.max(1, workWidth));
    })
    .onFinalize((_event, success) => {
      if (!success) {
        widthValue.value = size.width;
        heightValue.value = size.height;
      }
      runOnJS(onDragActiveChange)(false);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    width: widthValue.value,
    height: heightValue.value,
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    zIndex: selected ? 4 : 1,
  }));

  return (
    <Animated.View style={[styles.wrap, animatedStyle]}>
      <Pressable style={styles.imagePressable} onPress={onSelect}>
        <Image source={{ uri: block.uri }} style={styles.image} />
      </Pressable>

      {selected ? (
        <>
          <Pressable
            style={styles.deleteHandle}
            onPress={onDelete}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Удалить фото"
          >
            <Feather name="trash-2" size={14} color="#fff" />
          </Pressable>

          <GestureDetector gesture={moveGesture}>
            <View style={styles.moveHandle} accessibilityLabel="Переместить фото">
              <Feather name="move" size={16} color="#fff" />
            </View>
          </GestureDetector>

          <GestureDetector gesture={resizeGesture}>
            <View style={styles.resizeHandle} accessibilityLabel="Изменить размер фото">
              <Feather name="maximize-2" size={12} color="#fff" />
            </View>
          </GestureDetector>
        </>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    marginVertical: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
    backgroundColor: 'rgba(167, 154, 138, 0.15)',
  },
  imagePressable: {
    width: '100%',
    height: '100%',
  },
  deleteHandle: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(229, 57, 53, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveHandle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 36,
    height: 36,
    marginTop: -18,
    marginLeft: -18,
    borderRadius: 9,
    backgroundColor: 'rgba(62, 54, 48, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resizeHandle: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: 'rgba(62, 54, 48, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
