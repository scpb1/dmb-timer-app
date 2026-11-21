import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { lockDiarySession } from '@/services/diarySession';
import { logger } from '@/utils/logger';
import { DIARY_KDF_ITERATIONS, pbkdf2Sha256Hex, timingSafeEqual } from '@/utils/pbkdf2';

const PIN_HASH_KEY = 'diary_pin_hash';
const PIN_SALT_KEY = 'diary_pin_salt';
const BIOMETRICS_KEY = 'diary_biometrics_enabled';
const RECOVERY_QUESTION_KEY = 'diary_recovery_question';
const RECOVERY_HASH_KEY = 'diary_recovery_answer_hash';
const RECOVERY_SALT_KEY = 'diary_recovery_answer_salt';
const PIN_ATTEMPTS_KEY = 'diary_pin_attempts';
const RECOVERY_ATTEMPTS_KEY = 'diary_recovery_attempts';
const LOCK_UNTIL_KEY = 'diary_pin_lock_until';
const AUTH_GRANT_KEY = 'diary_auth_grant';
const RESET_GRANT_KEY = 'diary_pin_reset_grant';

const SECRET_KEYS = [
  PIN_HASH_KEY,
  PIN_SALT_KEY,
  BIOMETRICS_KEY,
  RECOVERY_QUESTION_KEY,
  RECOVERY_HASH_KEY,
  RECOVERY_SALT_KEY,
  PIN_ATTEMPTS_KEY,
  RECOVERY_ATTEMPTS_KEY,
  LOCK_UNTIL_KEY,
  AUTH_GRANT_KEY,
  RESET_GRANT_KEY,
] as const;

const PBKDF2_PREFIX = 'pbkdf2-sha256$';
const AUTH_GRANT_TTL_MS = 3 * 60 * 1000;
const RESET_GRANT_TTL_MS = 5 * 60 * 1000;

/**
 * iOS: ключи доступны только пока телефон разблокирован и не уезжают
 * в резервную копию на другое устройство. Android эту опцию игнорирует.
 * requireAuthentication не включаем: экран замка сам спрашивает биометрию.
 */
const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const DIARY_PIN_LENGTH = 6;
export const DIARY_LEGACY_PIN_LENGTH = 4;
export const DIARY_PIN_MAX_ATTEMPTS = 5;
export const DIARY_RECOVERY_MAX_ATTEMPTS = 5;
export const DIARY_LOCK_MS = 15 * 60 * 1000;
export const DIARY_RECOVERY_ANSWER_MIN_LENGTH = 3;

/** Честный текст: код прячет экран, файл базы остаётся читаемым. */
export const DIARY_LOCK_DISCLOSURE =
  'Код из 6 цифр закрывает экран личного дневника. Он не шифрует базу и фото на телефоне: при доступе к файлу приложения текст записей можно прочитать.';

export const DIARY_LOCK_DISCLOSURE_SHORT =
  'Код закрывает экран. Записи в файле телефона не шифруются.';

let accessMigration: Promise<void> | null = null;

async function ensureDeviceOnlyAccess(): Promise<void> {
  if (!accessMigration) {
    accessMigration = migrateKeychainAccess().catch((error: unknown) => {
      accessMigration = null;
      throw error;
    });
  }
  await accessMigration;
}

/** Переписывает старые ключи, чтобы на iOS сменилась доступность keychain. */
async function migrateKeychainAccess(): Promise<void> {
  for (const key of SECRET_KEYS) {
    const value = await SecureStore.getItemAsync(key, SECURE_OPTIONS);
    if (value == null) {
      continue;
    }
    await SecureStore.deleteItemAsync(key, SECURE_OPTIONS);
    await SecureStore.setItemAsync(key, value, SECURE_OPTIONS);
  }
}

async function secureGet(key: string): Promise<string | null> {
  await ensureDeviceOnlyAccess();
  return SecureStore.getItemAsync(key, SECURE_OPTIONS);
}

async function secureSet(key: string, value: string): Promise<void> {
  await ensureDeviceOnlyAccess();
  await SecureStore.setItemAsync(key, value, SECURE_OPTIONS);
}

async function secureDelete(key: string): Promise<void> {
  await ensureDeviceOnlyAccess();
  try {
    await SecureStore.deleteItemAsync(key, SECURE_OPTIONS);
  } catch (error) {
    logger.error('Ошибка удаления данных защиты', error);
  }
}

function isSixDigitPin(pin: string): boolean {
  return new RegExp(`^\\d{${DIARY_PIN_LENGTH}}$`).test(pin);
}

function isLegacyPinHash(hash: string): boolean {
  return !hash.startsWith(PBKDF2_PREFIX) && /^[0-9a-f]{64}$/i.test(hash);
}

function parsePbkdf2(stored: string): { iterations: number; hex: string } | null {
  if (!stored.startsWith(PBKDF2_PREFIX)) {
    return null;
  }
  const rest = stored.slice(PBKDF2_PREFIX.length);
  const splitAt = rest.indexOf('$');
  if (splitAt <= 0) {
    return null;
  }
  const iterations = Number(rest.slice(0, splitAt));
  const hex = rest.slice(splitAt + 1);
  if (!Number.isInteger(iterations) || iterations < 1 || !/^[0-9a-f]+$/i.test(hex)) {
    return null;
  }
  return { iterations, hex };
}

async function legacyHash(value: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${value}`);
}

async function hashSecret(value: string, salt: string): Promise<string> {
  const hex = await pbkdf2Sha256Hex(value, salt, DIARY_KDF_ITERATIONS);
  return `${PBKDF2_PREFIX}${DIARY_KDF_ITERATIONS}$${hex}`;
}

async function secretMatches(value: string, salt: string, stored: string): Promise<boolean> {
  const parsed = parsePbkdf2(stored);
  if (parsed) {
    const next = await pbkdf2Sha256Hex(value, salt, parsed.iterations);
    return timingSafeEqual(next, parsed.hex.toLowerCase());
  }
  const next = await legacyHash(value, salt);
  return timingSafeEqual(next, stored.toLowerCase());
}

function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/\s+/g, ' ');
}

function isRecoveryValid(question: string, answer: string): boolean {
  return Boolean(question.trim()) && normalizeAnswer(answer).length >= DIARY_RECOVERY_ANSWER_MIN_LENGTH;
}

async function readNumber(key: string): Promise<number> {
  const raw = await secureGet(key);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

async function writeNumber(key: string, value: number): Promise<void> {
  await secureSet(key, String(value));
}

async function issueGrant(key: string, ttlMs: number): Promise<string> {
  const token = Crypto.randomUUID();
  await secureSet(key, JSON.stringify({ token, expiresAt: Date.now() + ttlMs }));
  return token;
}

async function consumeGrant(key: string, token: string): Promise<boolean> {
  const raw = await secureGet(key);
  if (!raw || !token) {
    return false;
  }

  let storedToken = '';
  let expiresAt = 0;
  try {
    const parsed = JSON.parse(raw) as { token?: unknown; expiresAt?: unknown };
    storedToken = typeof parsed.token === 'string' ? parsed.token : '';
    expiresAt = typeof parsed.expiresAt === 'number' ? parsed.expiresAt : 0;
  } catch {
    await secureDelete(key);
    return false;
  }

  const tokenOk = timingSafeEqual(storedToken, token);
  if (expiresAt <= Date.now()) {
    await secureDelete(key);
    return false;
  }
  if (!tokenOk) {
    return false;
  }
  await secureDelete(key);
  return true;
}

export async function isDiaryLockEnabled(): Promise<boolean> {
  try {
    const hash = await secureGet(PIN_HASH_KEY);
    return Boolean(hash);
  } catch (error) {
    logger.error('Ошибка чтения защиты дневника', error);
    return false;
  }
}

/** 4 для старого кода, 6 для нового и для ещё не заданного. */
export async function getDiaryPinLength(): Promise<number> {
  try {
    const hash = await secureGet(PIN_HASH_KEY);
    if (hash && isLegacyPinHash(hash)) {
      return DIARY_LEGACY_PIN_LENGTH;
    }
  } catch (error) {
    logger.error('Ошибка чтения длины кода', error);
  }
  return DIARY_PIN_LENGTH;
}

export async function isDiaryBiometricsEnabled(): Promise<boolean> {
  try {
    const value = await secureGet(BIOMETRICS_KEY);
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
    // Текст вопроса нужен на экране. В лог его не пишем.
    return (await secureGet(RECOVERY_QUESTION_KEY)) ?? null;
  } catch (error) {
    logger.error('Ошибка чтения кодового вопроса', error);
    return null;
  }
}

export async function hasDiaryRecovery(): Promise<boolean> {
  try {
    const [question, hash] = await Promise.all([
      secureGet(RECOVERY_QUESTION_KEY),
      secureGet(RECOVERY_HASH_KEY),
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
    secureGet(LOCK_UNTIL_KEY),
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
  await secureSet(LOCK_UNTIL_KEY, String(Date.now() + DIARY_LOCK_MS));
}

async function clearLockState(): Promise<void> {
  await Promise.all([
    secureDelete(PIN_ATTEMPTS_KEY),
    secureDelete(RECOVERY_ATTEMPTS_KEY),
    secureDelete(LOCK_UNTIL_KEY),
  ]);
}

async function saveRecovery(question: string, answer: string): Promise<boolean> {
  const normalizedQuestion = question.trim();
  const normalizedAnswer = normalizeAnswer(answer);
  if (!isRecoveryValid(normalizedQuestion, normalizedAnswer)) {
    return false;
  }

  const salt = Crypto.randomUUID();
  const hash = await hashSecret(normalizedAnswer, salt);
  await secureSet(RECOVERY_QUESTION_KEY, normalizedQuestion);
  await secureSet(RECOVERY_SALT_KEY, salt);
  await secureSet(RECOVERY_HASH_KEY, hash);
  return true;
}

export async function setDiaryPin(
  pin: string,
  recovery?: { question: string; answer: string },
  grant?: string,
  options?: { enableBiometrics?: boolean },
): Promise<boolean> {
  if (!isSixDigitPin(pin)) {
    return false;
  }

  try {
    if (recovery) {
      if (!isRecoveryValid(recovery.question, recovery.answer)) {
        return false;
      }
    } else if (!(await hasDiaryRecovery())) {
      return false;
    }

    if (await isDiaryLockEnabled()) {
      if (!grant || !(await consumeGrant(AUTH_GRANT_KEY, grant))) {
        return false;
      }
    }

    if (recovery) {
      const saved = await saveRecovery(recovery.question, recovery.answer);
      if (!saved) {
        return false;
      }
    }

    const salt = Crypto.randomUUID();
    const hash = await hashSecret(pin, salt);
    await secureSet(PIN_SALT_KEY, salt);
    await secureSet(PIN_HASH_KEY, hash);
    if (options?.enableBiometrics) {
      await secureSet(BIOMETRICS_KEY, 'true');
    }
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
  /** Доказательство для смены кода, биометрии и снятия замка. */
  grant: string | null;
  /** Старый код из 4 цифр. Дневник откроется после нового кода из 6. */
  needsNewPin: boolean;
  /** Одноразовый ключ для resetDiaryPinAfterRecovery. */
  resetGrant: string | null;
};

const FAILED_VERIFY: PinVerifyResult = {
  ok: false,
  remaining: 0,
  locked: false,
  lockedUntil: null,
  grant: null,
  needsNewPin: false,
  resetGrant: null,
};

export async function verifyDiaryPin(pin: string): Promise<PinVerifyResult> {
  try {
    const status = await getDiaryLockStatus();
    if (status.locked) {
      return {
        ...FAILED_VERIFY,
        locked: true,
        lockedUntil: status.lockedUntil,
      };
    }

    const [salt, hash] = await Promise.all([secureGet(PIN_SALT_KEY), secureGet(PIN_HASH_KEY)]);
    if (!salt || !hash) {
      return FAILED_VERIFY;
    }

    const legacy = isLegacyPinHash(hash);
    const nextHash = await secretMatches(pin, salt, hash);
    if (nextHash) {
      await clearLockState();
      const grant = await issueGrant(AUTH_GRANT_KEY, AUTH_GRANT_TTL_MS);
      const resetGrant = legacy ? await issueGrant(RESET_GRANT_KEY, RESET_GRANT_TTL_MS) : null;
      return {
        ok: true,
        remaining: DIARY_PIN_MAX_ATTEMPTS,
        locked: false,
        lockedUntil: null,
        grant,
        needsNewPin: legacy,
        resetGrant,
      };
    }

    const attempts = (await readNumber(PIN_ATTEMPTS_KEY)) + 1;
    await writeNumber(PIN_ATTEMPTS_KEY, attempts);
    if (attempts >= DIARY_PIN_MAX_ATTEMPTS) {
      await lockTemporarily();
      return {
        ...FAILED_VERIFY,
        locked: true,
        lockedUntil: Date.now() + DIARY_LOCK_MS,
      };
    }

    return {
      ...FAILED_VERIFY,
      remaining: DIARY_PIN_MAX_ATTEMPTS - attempts,
    };
  } catch (error) {
    logger.error('Ошибка проверки кода дневника', error);
    return FAILED_VERIFY;
  }
}

export type RecoveryVerifyResult = PinVerifyResult;

export async function verifyDiaryRecoveryAnswer(answer: string): Promise<RecoveryVerifyResult> {
  try {
    const status = await getDiaryLockStatus();
    if (status.locked && status.remainingRecoveryAttempts <= 0) {
      return {
        ...FAILED_VERIFY,
        locked: true,
        lockedUntil: status.lockedUntil,
      };
    }

    const [salt, hash] = await Promise.all([
      secureGet(RECOVERY_SALT_KEY),
      secureGet(RECOVERY_HASH_KEY),
    ]);
    if (!salt || !hash) {
      return FAILED_VERIFY;
    }

    const matched = await secretMatches(normalizeAnswer(answer), salt, hash);
    if (matched) {
      await clearLockState();
      const resetGrant = await issueGrant(RESET_GRANT_KEY, RESET_GRANT_TTL_MS);
      return {
        ok: true,
        remaining: DIARY_RECOVERY_MAX_ATTEMPTS,
        locked: false,
        lockedUntil: null,
        grant: null,
        needsNewPin: true,
        resetGrant,
      };
    }

    const attempts = (await readNumber(RECOVERY_ATTEMPTS_KEY)) + 1;
    await writeNumber(RECOVERY_ATTEMPTS_KEY, attempts);
    if (attempts >= DIARY_RECOVERY_MAX_ATTEMPTS) {
      await lockTemporarily();
      return {
        ...FAILED_VERIFY,
        locked: true,
        lockedUntil: Date.now() + DIARY_LOCK_MS,
      };
    }

    return {
      ...FAILED_VERIFY,
      remaining: DIARY_RECOVERY_MAX_ATTEMPTS - attempts,
    };
  } catch (error) {
    logger.error('Ошибка проверки кодового ответа', error);
    return FAILED_VERIFY;
  }
}

export async function resetDiaryPinAfterRecovery(pin: string, grant: string): Promise<boolean> {
  if (!isSixDigitPin(pin)) {
    return false;
  }

  try {
    if (!(await consumeGrant(RESET_GRANT_KEY, grant))) {
      return false;
    }
    const salt = Crypto.randomUUID();
    const hash = await hashSecret(pin, salt);
    await secureSet(PIN_SALT_KEY, salt);
    await secureSet(PIN_HASH_KEY, hash);
    await clearLockState();
    return true;
  } catch (error) {
    logger.error('Ошибка сброса кода дневника', error);
    return false;
  }
}

/** Стирает замок без кода. Только полный сброс данных. */
export async function eraseDiaryLock(): Promise<void> {
  await Promise.all(SECRET_KEYS.map((key) => secureDelete(key)));
  lockDiarySession();
}

export async function removeDiaryLock(grant: string): Promise<boolean> {
  if (!(await consumeGrant(AUTH_GRANT_KEY, grant))) {
    return false;
  }
  await eraseDiaryLock();
  return true;
}

export async function setDiaryBiometricsEnabled(enabled: boolean, grant: string): Promise<boolean> {
  try {
    if (!(await isDiaryLockEnabled())) {
      return false;
    }
    if (!(await consumeGrant(AUTH_GRANT_KEY, grant))) {
      return false;
    }
    await secureSet(BIOMETRICS_KEY, enabled ? 'true' : 'false');
    return true;
  } catch (error) {
    logger.error('Ошибка сохранения биометрии', error);
    return false;
  }
}

export type BiometricAuthResult = {
  ok: boolean;
  grant: string | null;
  needsNewPin: boolean;
  resetGrant: string | null;
};

export async function authenticateDiaryBiometrics(): Promise<BiometricAuthResult> {
  const denied: BiometricAuthResult = {
    ok: false,
    grant: null,
    needsNewPin: false,
    resetGrant: null,
  };
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Открыть личный дневник',
      cancelLabel: 'Ввести код',
      disableDeviceFallback: true,
    });
    if (!result.success) {
      return denied;
    }

    const hash = await secureGet(PIN_HASH_KEY);
    const needsNewPin = Boolean(hash && isLegacyPinHash(hash));
    const grant = await issueGrant(AUTH_GRANT_KEY, AUTH_GRANT_TTL_MS);
    const resetGrant = needsNewPin ? await issueGrant(RESET_GRANT_KEY, RESET_GRANT_TTL_MS) : null;
    return { ok: true, grant, needsNewPin, resetGrant };
  } catch (error) {
    logger.error('Ошибка биометрии дневника', error);
    return denied;
  }
}
