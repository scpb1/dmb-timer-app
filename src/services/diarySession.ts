import { useSyncExternalStore } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { AUTO_LOCK_TIMEOUT_MS } from '@/constants';

type Listener = (unlocked: boolean) => void;

let unlocked = false;
let lockTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<Listener>();

function emit(): void {
  listeners.forEach((listener) => listener(unlocked));
}

function clearLockTimer(): void {
  if (lockTimer) {
    clearTimeout(lockTimer);
    lockTimer = null;
  }
}

function scheduleLock(): void {
  clearLockTimer();
  lockTimer = setTimeout(() => {
    lockTimer = null;
    if (!unlocked) {
      return;
    }
    unlocked = false;
    emit();
  }, AUTO_LOCK_TIMEOUT_MS);
}

export function isDiarySessionUnlocked(): boolean {
  return unlocked;
}

/** Открывает личный дневник до таймаута или ухода приложения в фон. */
export function unlockDiarySession(): void {
  unlocked = true;
  scheduleLock();
  emit();
}

/** Продлевает таймаут, пока человек пишет или листает открытый дневник. */
export function touchDiarySession(): void {
  if (!unlocked) {
    return;
  }
  scheduleLock();
}

export function lockDiarySession(): void {
  clearLockTimer();
  if (!unlocked) {
    return;
  }
  unlocked = false;
  emit();
}

export function useDiarySessionUnlocked(): boolean {
  return useSyncExternalStore(subscribeDiarySession, isDiarySessionUnlocked, () => false);
}

export function subscribeDiarySession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function onAppState(next: AppStateStatus): void {
  if (next === 'background') {
    lockDiarySession();
  }
}

if (typeof AppState?.addEventListener === 'function') {
  AppState.addEventListener('change', onAppState);
}
