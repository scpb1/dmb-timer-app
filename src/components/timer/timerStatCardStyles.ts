import { StyleSheet } from 'react-native';

import { typography } from '@/theme/typography';

/** Как подпись «дней» / «недель» под числом на плашке */
export const statCardUnitText = {
  fontFamily: typography.fontFamily.sans,
  fontSize: 14,
} as const;

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
