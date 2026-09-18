import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface PhotoGridProps {
  photos: string[];
  onPhotoPress: (index: number) => void;
  onRemove?: (index: number) => void;
  editable?: boolean;
}

export function PhotoGrid({ photos, onPhotoPress, onRemove, editable = false }: PhotoGridProps) {
  if (photos.length === 0) {
    return null;
  }

  return (
    <View style={styles.grid}>
      {photos.map((uri, index) => (
        <View key={`${uri}-${index}`} style={styles.itemWrap}>
          <Pressable onPress={() => onPhotoPress(index)}>
            <Image source={{ uri }} style={styles.thumbnail} />
          </Pressable>
          {editable && onRemove ? (
            <Pressable style={styles.removeButton} onPress={() => onRemove(index)} hitSlop={6}>
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
    borderRadius: 5,
    backgroundColor: 'rgba(167, 154, 138, 0.15)',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
