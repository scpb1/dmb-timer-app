import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

/**
 * PBKDF2-HMAC-SHA256. Сотни тысяч итераций: офлайн-перебор короткого кода
 * перестаёт занимать секунды. SDK 51 не отдаёт PBKDF2, поэтому считается здесь.
 */
export const DIARY_KDF_ITERATIONS = 200_000;

export async function pbkdf2Sha256Hex(
  value: string,
  salt: string,
  iterations: number,
): Promise<string> {
  const bytes = await pbkdf2Async(sha256, value, salt, {
    c: iterations,
    dkLen: 32,
  });
  return bytesToHex(bytes);
}

/** Сравнение без раннего выхода по первому отличию. */
export function timingSafeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    const leftCode = index < left.length ? left.charCodeAt(index) : 0;
    const rightCode = index < right.length ? right.charCodeAt(index) : 0;
    diff |= leftCode ^ rightCode;
  }
  return diff === 0;
}
