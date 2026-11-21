export const UNDO_DELETE_TIMEOUT_MS = 5000;

interface UndoWindowOptions<T> {
  timeoutMs?: number;
  /** Когда окно закрылось само, его сменило новое удаление или экран размонтировался. */
  onCommit?: (pending: T) => void | Promise<void>;
  onRestore: (pending: T) => void | Promise<void>;
  onChange?: (pending: T | null) => void;
}

/**
 * Одно окно «отменить удаление».
 * `commitCurrent` закрывает текущее окно и вызывает `onCommit`.
 * `arm` только запускает таймер, без повторного commit.
 */
export function createUndoWindow<T>(options: UndoWindowOptions<T>) {
  const timeoutMs = options.timeoutMs ?? UNDO_DELETE_TIMEOUT_MS;
  let pending: T | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const notify = () => {
    options.onChange?.(pending);
  };

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const commitCurrent = async () => {
    clearTimer();
    const current = pending;
    if (!current) {
      return;
    }
    pending = null;
    notify();
    await options.onCommit?.(current);
  };

  const arm = (item: T) => {
    clearTimer();
    pending = item;
    notify();
    timer = setTimeout(() => {
      timer = null;
      const current = pending;
      pending = null;
      notify();
      if (current) {
        void options.onCommit?.(current);
      }
    }, timeoutMs);
  };

  return {
    get pending() {
      return pending;
    },
    commitCurrent,
    arm,
    async schedule(item: T) {
      await commitCurrent();
      arm(item);
    },
    async undo() {
      const current = pending;
      if (!current) {
        return;
      }
      clearTimer();
      pending = null;
      notify();
      await options.onRestore(current);
    },
    dispose() {
      clearTimer();
      const current = pending;
      pending = null;
      if (current) {
        void options.onCommit?.(current);
      }
    },
  };
}
