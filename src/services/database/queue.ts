let chain: Promise<unknown> = Promise.resolve();

/** Один SQLite-запрос за раз: expo-sqlite падает на параллельном finalizeAsync. */
export function enqueueDatabaseOp<T>(work: () => Promise<T>): Promise<T> {
  const next = chain.then(work, work);
  chain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export function isSqliteBusy(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /database is locked|SQLITE_BUSY|finalizeAsync/i.test(message);
}

export async function withSqliteBusyRetry<T>(
  work: () => Promise<T>,
  attempts = 5,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isSqliteBusy(error) || attempt === attempts - 1) {
        throw error;
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 40 * 2 ** attempt);
      });
    }
  }

  throw lastError;
}
