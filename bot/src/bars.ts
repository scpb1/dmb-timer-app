const STAR_COUNT = 9;

export function starsLine(percent: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const filled = Math.max(0, Math.min(STAR_COUNT, Math.round(clamped / (100 / STAR_COUNT))));
  const stars = [
    ...Array.from({ length: filled }, () => '★'),
    ...Array.from({ length: STAR_COUNT - filled }, () => '☆'),
  ];
  return `${stars.join(' ')}   ${clamped}%`;
}
