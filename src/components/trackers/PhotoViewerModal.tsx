import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'react-native';
import { ResizeMode, Video } from 'expo-av';
import { Feather } from '@expo/vector-icons';

import type { MeetingMediaItem } from '@/types/trackers';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PhotoViewerModalProps {
  visible: boolean;
  items: MeetingMediaItem[];
  initialIndex?: number;
  onClose: () => void;
}

export function PhotoViewerModal({
  visible,
  items,
  initialIndex = 0,
  onClose,
}: PhotoViewerModalProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setCurrentIndex(initialIndex);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: initialIndex * SCREEN_WIDTH, animated: false });
    });
  }, [visible, initialIndex]);

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <Text style={styles.counter}>
            {currentIndex + 1} / {items.length}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Закрыть"
          >
            <Feather name="x" size={24} color="#fff" />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          style={styles.carousel}
        >
          {items.map((item, index) => (
            <View key={`${item.type}-${item.uri}-${index}`} style={styles.slide}>
              {item.type === 'video' ? (
                <Video
                  source={{ uri: item.uri }}
                  style={styles.media}
                  resizeMode={ResizeMode.CONTAIN}
                  useNativeControls
                  shouldPlay={visible && currentIndex === index}
                />
              ) : (
                <Image source={{ uri: item.uri }} style={styles.media} resizeMode="contain" />
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 12,
  },
  counter: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    color: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carousel: {
    flexGrow: 0,
    height: SCREEN_HEIGHT * 0.72,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.68,
    backgroundColor: colors.dark.background.start,
  },
});
