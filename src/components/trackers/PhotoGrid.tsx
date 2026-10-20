import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { MeetingMediaItem } from '@/types/trackers';

interface PhotoGridProps {
  items: MeetingMediaItem[];
  onItemPress: (index: number) => void;
  onRemove?: (index: number) => void;
  editable?: boolean;
}

export function PhotoGrid({ items, onItemPress, onRemove, editable = false }: PhotoGridProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.grid}>
      {items.map((item, index) => (
        <View key={`${item.type}-${item.uri}-${index}`} style={styles.itemWrap}>
          <Pressable
            onPress={() => onItemPress(index)}
            accessibilityRole="button"
            accessibilityLabel={item.type === 'video' ? `Видео ${index + 1}` : `Фото ${index + 1}`}
          >
            {item.type === 'video' ? (
              <View style={[styles.thumbnail, styles.videoThumb]}>
                <Feather name="play" size={22} color="#fff" />
              </View>
            ) : (
              <Image source={{ uri: item.uri }} style={styles.thumbnail} />
            )}
          </Pressable>
          {editable && onRemove ? (
            <Pressable
              style={styles.removeButton}
              onPress={() => onRemove(index)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={item.type === 'video' ? `Удалить видео ${index + 1}` : `Удалить фото ${index + 1}`}
            >
              <Feather name="x" size={14} color="#fff" />
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemWrap: {
    position: 'relative',
  },
  thumbnail: {
    width: 88,
    height: 88,
    borderRadius: 4,
    backgroundColor: 'rgba(167, 154, 138, 0.15)',
  },
  videoThumb: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(62, 54, 48, 0.72)',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
