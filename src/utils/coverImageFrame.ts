import { DEFAULT_BACKGROUND_FOCUS } from '@/types/timer';

export interface CoverSize {
  width: number;
  height: number;
}

export interface CoverImageFrame {
  width: number;
  height: number;
  left: number;
  top: number;
  overflowX: number;
  overflowY: number;
}

/** 0 — один край кадра, 0.5 — середина, 1 — противоположный край. */
export function clampBackgroundFocus(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_BACKGROUND_FOCUS;
  }

  const clamped = Math.min(1, Math.max(0, value));
  return Math.round(clamped * 10000) / 10000;
}

export function formatBackgroundFocus(value: number): string {
  return clampBackgroundFocus(value).toFixed(4);
}

/**
 * Кадр `cover`: фото заполняет контейнер, лишнее обрезается.
 * Точка фокуса совпадает с CSS `object-position` в процентах.
 */
export function coverImageFrame(
  container: CoverSize,
  image: CoverSize,
  focusX: number,
  focusY: number,
): CoverImageFrame {
  const imageWidth = image.width > 0 ? image.width : 1;
  const imageHeight = image.height > 0 ? image.height : 1;
  const scale = Math.max(container.width / imageWidth, container.height / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const focus = {
    x: clampBackgroundFocus(focusX),
    y: clampBackgroundFocus(focusY),
  };

  const left = (container.width - width) * focus.x;
  const top = (container.height - height) * focus.y;

  return {
    width,
    height,
    left: left === 0 ? 0 : left,
    top: top === 0 ? 0 : top,
    overflowX: Math.max(0, width - container.width),
    overflowY: Math.max(0, height - container.height),
  };
}

/** Сдвиг пальцем двигает фото вместе с пальцем и пересчитывает точку кадра. */
export function focusAfterDrag(
  start: { x: number; y: number },
  translation: { x: number; y: number },
  overflow: { x: number; y: number },
): { x: number; y: number } {
  return {
    x: clampBackgroundFocus(overflow.x > 1 ? start.x - translation.x / overflow.x : start.x),
    y: clampBackgroundFocus(overflow.y > 1 ? start.y - translation.y / overflow.y : start.y),
  };
}
