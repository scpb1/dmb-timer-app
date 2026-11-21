import { StyleSheet } from 'react-native';

import { typography } from '@/theme/typography';

/** Как подпись «дней» / «недель» под числом на плашке */
export const statCardUnitText = {
  fontFamily: typography.fontFamily.sans,
  fontSize: 14,
} as const;

/** Белая плашка для PNG: чёрный текст, без рамки. Скругление задаёт сама карточка. */
export const solidWhiteStatCardColors = {
  fill: '#FFFFFF',
  ink: '#1C1917',
  muted: '#6B6560',
} as const;

export const solidWhiteStatCard = StyleSheet.create({
  card: {
    backgroundColor: solidWhiteStatCardColors.fill,
    borderWidth: 0,
    overflow: 'hidden',
  },
});

export const elapsedRemainingLabel = StyleSheet.create({
  label: {
    ...statCardUnitText,
    marginBottom: 8,
  },
});

export function isElapsedRemainingLabel(title: string): boolean {
  const normalized = title.toLowerCase();
  return normalized === 'прошло' || normalized === 'осталось';
}
