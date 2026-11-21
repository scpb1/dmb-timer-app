const resets: (() => void)[] = [];

/** Хуки регистрируют снимки в памяти, полный сброс вызывает их без цикла импортов. */
export function registerMemoryCacheReset(reset: () => void): void {
  if (!resets.includes(reset)) {
    resets.push(reset);
  }
}

export function clearMemoryCaches(): void {
  for (const reset of resets) {
    reset();
  }
}
