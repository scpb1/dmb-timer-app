import { useState } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

import { useImageSize } from '@/hooks/useImageSize';
import { coverImageFrame } from '@/utils/coverImageFrame';

interface PositionedCoverImageProps {
  uri: string;
  focusX: number;
  focusY: number;
  style?: StyleProp<ViewStyle>;
  width?: number;
  height?: number;
  /** Кэш expo-image. Для карточек, которые снимает view-shot, оставляйте выключенным. */
  cached?: boolean;
}

/** Фото в режиме cover со сдвигом кадра, а не только по центру. */
export function PositionedCoverImage({
  uri,
  focusX,
  focusY,
  style,
  width,
  height,
  cached = false,
}: PositionedCoverImageProps) {
  const imageSize = useImageSize(uri);
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);
  const container =
    width && height && width > 0 && height > 0 ? { width, height } : layout;
  const frame =
    container && imageSize ? coverImageFrame(container, imageSize, focusX, focusY) : null;

  return (
    <View
      style={[styles.clip, style]}
      onLayout={(event) => {
        if (width && height) {
          return;
        }
        const next = {
          width: event.nativeEvent.layout.width,
          height: event.nativeEvent.layout.height,
        };
        setLayout((prev) =>
          prev && prev.width === next.width && prev.height === next.height ? prev : next,
        );
      }}
    >
      {frame ? (
        cached ? (
          <ExpoImage
            source={{ uri }}
            cachePolicy="memory-disk"
            contentFit="fill"
            style={{
              position: 'absolute',
              width: frame.width,
              height: frame.height,
              left: frame.left,
              top: frame.top,
            }}
          />
        ) : (
          <Image
            source={{ uri }}
            style={{
              position: 'absolute',
              width: frame.width,
              height: frame.height,
              left: frame.left,
              top: frame.top,
            }}
          />
        )
      ) : cached ? (
        <ExpoImage
          source={{ uri }}
          cachePolicy="memory-disk"
          contentFit="cover"
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
});
