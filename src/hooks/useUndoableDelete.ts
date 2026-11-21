import { useEffect, useRef, useState } from 'react';

import { createUndoWindow, UNDO_DELETE_TIMEOUT_MS } from '@/hooks/undoWindow';

interface UseUndoableDeleteOptions<T> {
  timeoutMs?: number;
  onCommit?: (pending: T) => void | Promise<void>;
  onRestore: (pending: T) => void | Promise<void>;
}

/** Пять секунд на отмену удаления. Доменный хук описывает только снимок и побочный эффект. */
export function useUndoableDelete<T>({
  timeoutMs = UNDO_DELETE_TIMEOUT_MS,
  onCommit,
  onRestore,
}: UseUndoableDeleteOptions<T>) {
  const [pending, setPending] = useState<T | null>(null);
  const onCommitRef = useRef(onCommit);
  const onRestoreRef = useRef(onRestore);
  onCommitRef.current = onCommit;
  onRestoreRef.current = onRestore;

  const windowRef = useRef<ReturnType<typeof createUndoWindow<T>> | null>(null);
  if (!windowRef.current) {
    windowRef.current = createUndoWindow<T>({
      timeoutMs,
      onCommit: (item) => onCommitRef.current?.(item),
      onRestore: (item) => onRestoreRef.current(item),
      onChange: setPending,
    });
  }

  useEffect(() => () => windowRef.current?.dispose(), []);

  return {
    pending,
    commitCurrent: windowRef.current.commitCurrent,
    schedule: windowRef.current.schedule,
    undo: windowRef.current.undo,
  };
}
