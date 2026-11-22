const STAR_COUNT = 10;
const PERCENT_DECIMALS = 2;

function formatPercentLabel(percent: number): string {
  const factor = 10 ** PERCENT_DECIMALS;
  const truncated = Math.floor(percent * factor + 1e-9) / factor;
  return `${truncated.toFixed(PERCENT_DECIMALS).replace('.', ',')}%`;
}

export function starsLine(percent: number): string {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.max(0, Math.min(STAR_COUNT, Math.floor(clamped / 10)));
  const stars = [
    ...Array.from({ length: filled }, () => '★'),
    ...Array.from({ length: STAR_COUNT - filled }, () => '☆'),
  ];
  return `${stars.join(' ')}   ${formatPercentLabel(clamped)}`;
}
