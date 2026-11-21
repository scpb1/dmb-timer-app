import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import {
  DIARY_PIN_MAX_ATTEMPTS,
  resetDiaryPinAfterRecovery,
  setDiaryPin,
  verifyDiaryPin,
  verifyDiaryRecoveryAnswer,
} from '@/services/diaryLock';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'when-unlocked',
    getItemAsync: async (key: string) => store.get(key) ?? null,
    setItemAsync: async (key: string, value: string) => {
      store.set(key, value);
    },
    deleteItemAsync: async (key: string) => {
      store.delete(key);
    },
    resetStore: () => store.clear(),
  };
});

jest.mock('expo-crypto', () => {
  let next = 0;
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA256' },
    randomUUID: () => {
      next += 1;
      return `uuid-${next}`;
    },
    digestStringAsync: async (_algorithm: string, value: string) => `digest:${value}`,
    resetIds: () => {
      next = 0;
    },
  };
});

jest.mock('expo-local-authentication', () => ({
  AuthenticationType: { FACIAL_RECOGNITION: 1, FINGERPRINT: 2 },
  hasHardwareAsync: async () => false,
  isEnrolledAsync: async () => false,
  authenticateAsync: async () => ({ success: false }),
}));

jest.mock('@/services/diarySession', () => ({
  lockDiarySession: jest.fn(),
}));

jest.mock('@/utils/pbkdf2', () => {
  const actual = jest.requireActual<typeof import('@/utils/pbkdf2')>('@/utils/pbkdf2');
  return {
    ...actual,
    DIARY_KDF_ITERATIONS: 1,
    pbkdf2Sha256Hex: async (value: string, salt: string) =>
      Buffer.from(`${salt}:${value}`).toString('hex'),
  };
});

const PIN = '123456';
const NEXT_PIN = '654321';

describe('код личного дневника', () => {
  beforeEach(() => {
    (SecureStore as unknown as { resetStore: () => void }).resetStore();
    (Crypto as unknown as { resetIds: () => void }).resetIds();
  });

  async function savePin(): Promise<void> {
    const saved = await setDiaryPin(PIN, { question: 'Кот', answer: 'мурзик' });
    expect(saved).toBe(true);
  }

  it('верный код сбрасывает счётчик неудач', async () => {
    await savePin();
    const wrong = await verifyDiaryPin('000000');
    expect(wrong.ok).toBe(false);
    expect(wrong.remaining).toBe(DIARY_PIN_MAX_ATTEMPTS - 1);

    const ok = await verifyDiaryPin(PIN);
    expect(ok.ok).toBe(true);
    expect(ok.remaining).toBe(DIARY_PIN_MAX_ATTEMPTS);

    const again = await verifyDiaryPin('000000');
    expect(again.remaining).toBe(DIARY_PIN_MAX_ATTEMPTS - 1);
    expect(again.locked).toBe(false);
  });

  it('пять ошибок закрывают ввод, шестая остаётся закрытой', async () => {
    await savePin();
    for (let attempt = 1; attempt < DIARY_PIN_MAX_ATTEMPTS; attempt += 1) {
      const result = await verifyDiaryPin('000000');
      expect(result.locked).toBe(false);
      expect(result.remaining).toBe(DIARY_PIN_MAX_ATTEMPTS - attempt);
    }
    const locked = await verifyDiaryPin('000000');
    expect(locked.locked).toBe(true);
    const stillLocked = await verifyDiaryPin(PIN);
    expect(stillLocked.ok).toBe(false);
    expect(stillLocked.locked).toBe(true);
  });

  it('после кодового ответа старый код не подходит, новый подходит', async () => {
    await savePin();
    const recovery = await verifyDiaryRecoveryAnswer('Мурзик');
    expect(recovery.ok).toBe(true);
    expect(recovery.resetGrant).toEqual(expect.any(String));

    const reset = await resetDiaryPinAfterRecovery(NEXT_PIN, recovery.resetGrant ?? '');
    expect(reset).toBe(true);
    expect((await verifyDiaryPin(PIN)).ok).toBe(false);
    expect((await verifyDiaryPin(NEXT_PIN)).ok).toBe(true);
  });
});
