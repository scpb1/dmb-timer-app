import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { logger } from '@/utils/logger';

const PIN_HASH_KEY = 'diary_pin_hash';
const PIN_SALT_KEY = 'diary_pin_salt';
const BIOMETRICS_KEY = 'diary_biometrics_enabled';
const RECOVERY_QUESTION_KEY = 'diary_recovery_question';
const RECOVERY_HASH_KEY = 'diary_recovery_answer_hash';
const RECOVERY_SALT_KEY = 'diary_recovery_answer_salt';
const PIN_ATTEMPTS_KEY = 'diary_pin_attempts';
const RECOVERY_ATTEMPTS_KEY = 'diary_recovery_attempts';
const LOCK_UNTIL_KEY = 'diary_pin_lock_until';

export const DIARY_PIN_LENGTH = 4;
export const DIARY_PIN_MAX_ATTEMPTS = 5;
export const DIARY_RECOVERY_MAX_ATTEMPTS = 5;
export const DIARY_LOCK_MS = 15 * 60 * 1000;
export const DIARY_RECOVERY_ANSWER_MIN_LENGTH = 3;

async function hashSecret(value: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${value}`);
}

function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function readNumber(key: string): Promise<number> {
  const raw = await SecureStore.getItemAsync(key);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

async function writeNumber(key: string, value: number): Promise<void> {
  await SecureStore.setItemAsync(key, String(value));
}

export async function isDiaryLockEnabled(): Promise<boolean> {
  try {
    const hash = await SecureStore.getItemAsync(PIN_HASH_KEY);
    return Boolean(hash);
  } catch (error) {
    logger.error('Ошибка чтения защиты дневника', error);
    return false;
  }
}

export async function isDiaryBiometricsEnabled(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(BIOMETRICS_KEY);
    return value === 'true';
  } catch (error) {
    logger.error('Ошибка чтения настройки биометрии', error);
    return false;
  }
}

export async function getBiometricAvailability(): Promise<{
  hardware: boolean;
  enrolled: boolean;
  face: boolean;
  fingerprint: boolean;
}> {
  try {
    const hardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = hardware ? await LocalAuthentication.isEnrolledAsync() : false;
    const types = hardware
      ? await LocalAuthentication.supportedAuthenticationTypesAsync()
      : [];
    return {
      hardware,
      enrolled,
      face: types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION),
      fingerprint: types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT),
    };
  } catch (error) {
    logger.error('Ошибка проверки биометрии', error);
    return { hardware: false, enrolled: false, face: false, fingerprint: false };
  }
}

export async function getDiaryRecoveryQuestion(): Promise<string | null> {
  try {
    return (await SecureStore.getItemAsync(RECOVERY_QUESTION_KEY)) ?? null;
  } catch (error) {
    logger.error('Ошибка чтения кодового вопроса', error);
    return null;
  }
}

export async function hasDiaryRecovery(): Promise<boolean> {
  try {
    const [question, hash] = await Promise.all([
      SecureStore.getItemAsync(RECOVERY_QUESTION_KEY),
      SecureStore.getItemAsync(RECOVERY_HASH_KEY),
    ]);
    return Boolean(question && hash);
  } catch (error) {
    logger.error('Ошибка проверки кодового вопроса', error);
    return false;
  }
}

export interface DiaryLockStatus {
  remainingPinAttempts: number;
  remainingRecoveryAttempts: number;
  lockedUntil: number | null;
  locked: boolean;
}

export async function getDiaryLockStatus(): Promise<DiaryLockStatus> {
  const [pinAttempts, recoveryAttempts, lockUntilRaw] = await Promise.all([
    readNumber(PIN_ATTEMPTS_KEY),
    readNumber(RECOVERY_ATTEMPTS_KEY),
    SecureStore.getItemAsync(LOCK_UNTIL_KEY),
  ]);
  const lockedUntil = lockUntilRaw ? Number(lockUntilRaw) : null;
  const locked = Boolean(lockedUntil && lockedUntil > Date.now());

  return {
    remainingPinAttempts: Math.max(0, DIARY_PIN_MAX_ATTEMPTS - pinAttempts),
    remainingRecoveryAttempts: Math.max(0, DIARY_RECOVERY_MAX_ATTEMPTS - recoveryAttempts),
    lockedUntil: locked ? lockedUntil : null,
    locked,
  };
}

async function lockTemporarily(): Promise<void> {
  await SecureStore.setItemAsync(LOCK_UNTIL_KEY, String(Date.now() + DIARY_LOCK_MS));
}

async function clearLockState(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY),
    SecureStore.deleteItemAsync(RECOVERY_ATTEMPTS_KEY),
    SecureStore.deleteItemAsync(LOCK_UNTIL_KEY),
  ]);
}

async function saveRecovery(question: string, answer: string): Promise<boolean> {
  const normalizedQuestion = question.trim();
  const normalizedAnswer = normalizeAnswer(answer);
  if (!normalizedQuestion || normalizedAnswer.length < DIARY_RECOVERY_ANSWER_MIN_LENGTH) {
    return false;
  }

  const salt = Crypto.randomUUID();
  const hash = await hashSecret(normalizedAnswer, salt);
  await SecureStore.setItemAsync(RECOVERY_QUESTION_KEY, normalizedQuestion);
  await SecureStore.setItemAsync(RECOVERY_SALT_KEY, salt);
  await SecureStore.setItemAsync(RECOVERY_HASH_KEY, hash);
  return true;
}

export async function setDiaryPin(
  pin: string,
  recovery?: { question: string; answer: string },
): Promise<boolean> {
  if (!/^\d{4}$/.test(pin)) {
    return false;
  }

  try {
    if (recovery) {
      const saved = await saveRecovery(recovery.question, recovery.answer);
      if (!saved) {
        return false;
      }
    } else if (!(await hasDiaryRecovery())) {
      return false;
    }

    const salt = Crypto.randomUUID();
    const hash = await hashSecret(pin, salt);
    await SecureStore.setItemAsync(PIN_SALT_KEY, salt);
    await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
    await clearLockState();
    return true;
  } catch (error) {
    logger.error('Ошибка сохранения кода дневника', error);
    return false;
  }
}

export type PinVerifyResult = {
  ok: boolean;
  remaining: number;
  locked: boolean;
  lockedUntil: number | null;
};

export async function verifyDiaryPin(pin: string): Promise<PinVerifyResult> {
  try {
    const status = await getDiaryLockStatus();
    if (status.locked) {
      return {
        ok: false,
        remaining: 0,
        locked: true,
        lockedUntil: status.lockedUntil,
      };
    }

    const [salt, hash] = await Promise.all([
      SecureStore.getItemAsync(PIN_SALT_KEY),
      SecureStore.getItemAsync(PIN_HASH_KEY),
    ]);
    if (!salt || !hash) {
      return { ok: false, remaining: 0, locked: false, lockedUntil: null };
    }

    const nextHash = await hashSecret(pin, salt);
    if (nextHash === hash) {
      await clearLockState();
      return {
        ok: true,
        remaining: DIARY_PIN_MAX_ATTEMPTS,
        locked: false,
        lockedUntil: null,
      };
    }

    const attempts = (await readNumber(PIN_ATTEMPTS_KEY)) + 1;
    await writeNumber(PIN_ATTEMPTS_KEY, attempts);
    if (attempts >= DIARY_PIN_MAX_ATTEMPTS) {
      await lockTemporarily();
      return {
        ok: false,
        remaining: 0,
        locked: true,
        lockedUntil: Date.now() + DIARY_LOCK_MS,
      };
    }

    return {
      ok: false,
      remaining: DIARY_PIN_MAX_ATTEMPTS - attempts,
      locked: false,
      lockedUntil: null,
    };
  } catch (error) {
    logger.error('Ошибка проверки кода дневника', error);
    return { ok: false, remaining: 0, locked: false, lockedUntil: null };
  }
}

export type RecoveryVerifyResult = PinVerifyResult;

export async function verifyDiaryRecoveryAnswer(answer: string): Promise<RecoveryVerifyResult> {
  try {
    const status = await getDiaryLockStatus();
    if (status.locked && status.remainingRecoveryAttempts <= 0) {
      return {
        ok: false,
        remaining: 0,
        locked: true,
        lockedUntil: status.lockedUntil,
      };
    }

    const [salt, hash] = await Promise.all([
      SecureStore.getItemAsync(RECOVERY_SALT_KEY),
      SecureStore.getItemAsync(RECOVERY_HASH_KEY),
    ]);
    if (!salt || !hash) {
      return { ok: false, remaining: 0, locked: false, lockedUntil: null };
    }

    const nextHash = await hashSecret(normalizeAnswer(answer), salt);
    if (nextHash === hash) {
      await clearLockState();
      return {
        ok: true,
        remaining: DIARY_RECOVERY_MAX_ATTEMPTS,
        locked: false,
        lockedUntil: null,
      };
    }

    const attempts = (await readNumber(RECOVERY_ATTEMPTS_KEY)) + 1;
    await writeNumber(RECOVERY_ATTEMPTS_KEY, attempts);
    if (attempts >= DIARY_RECOVERY_MAX_ATTEMPTS) {
      await lockTemporarily();
      return {
        ok: false,
        remaining: 0,
        locked: true,
        lockedUntil: Date.now() + DIARY_LOCK_MS,
      };
    }

    return {
      ok: false,
      remaining: DIARY_RECOVERY_MAX_ATTEMPTS - attempts,
      locked: false,
      lockedUntil: null,
    };
  } catch (error) {
    logger.error('Ошибка проверки кодового ответа', error);
    return { ok: false, remaining: 0, locked: false, lockedUntil: null };
  }
}

export async function resetDiaryPinAfterRecovery(pin: string): Promise<boolean> {
  if (!/^\d{4}$/.test(pin)) {
    return false;
  }

  try {
    const salt = Crypto.randomUUID();
    const hash = await hashSecret(pin, salt);
    await SecureStore.setItemAsync(PIN_SALT_KEY, salt);
    await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
    await clearLockState();
    return true;
  } catch (error) {
    logger.error('Ошибка сброса кода дневника', error);
    return false;
  }
}

export async function removeDiaryLock(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(PIN_HASH_KEY),
    SecureStore.deleteItemAsync(PIN_SALT_KEY),
    SecureStore.deleteItemAsync(BIOMETRICS_KEY),
    SecureStore.deleteItemAsync(RECOVERY_QUESTION_KEY),
    SecureStore.deleteItemAsync(RECOVERY_HASH_KEY),
    SecureStore.deleteItemAsync(RECOVERY_SALT_KEY),
    SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY),
    SecureStore.deleteItemAsync(RECOVERY_ATTEMPTS_KEY),
    SecureStore.deleteItemAsync(LOCK_UNTIL_KEY),
  ]);
}

export async function setDiaryBiometricsEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRICS_KEY, enabled ? 'true' : 'false');
}

export async function authenticateDiaryBiometrics(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Открыть личный дневник',
      cancelLabel: 'Ввести код',
      disableDeviceFallback: true,
    });
    return result.success;
  } catch (error) {
    logger.error('Ошибка биометрии дневника', error);
    return false;
  }
}
