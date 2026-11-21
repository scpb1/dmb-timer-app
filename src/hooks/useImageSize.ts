import { useEffect, useState } from 'react';
import { Image } from 'react-native';

export interface ImageSize {
  width: number;
  height: number;
}

const sizeCache = new Map<string, ImageSize>();

export function useImageSize(uri: string | null | undefined): ImageSize | null {
  const [size, setSize] = useState<ImageSize | null>(() =>
    uri ? (sizeCache.get(uri) ?? null) : null,
  );

  useEffect(() => {
    if (!uri) {
      setSize(null);
      return;
    }

    const cached = sizeCache.get(uri);
    if (cached) {
      setSize(cached);
      return;
    }

    let cancelled = false;
    setSize(null);
    Image.getSize(
      uri,
      (width, height) => {
        if (cancelled || width <= 0 || height <= 0) {
          return;
        }
        const next = { width, height };
        sizeCache.set(uri, next);
        setSize(next);
      },
      () => {
        if (!cancelled) {
          setSize(null);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [uri]);

  return size;
}
