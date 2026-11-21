import { DIARY_KDF_ITERATIONS, pbkdf2Sha256Hex, timingSafeEqual } from '@/utils/pbkdf2';

describe('pbkdf2Sha256Hex', () => {
  it('совпадает с векторами PBKDF2-HMAC-SHA256', async () => {
    await expect(pbkdf2Sha256Hex('password', 'salt', 1)).resolves.toBe(
      '120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b',
    );
    await expect(pbkdf2Sha256Hex('password', 'salt', 2)).resolves.toBe(
      'ae4d0c95af6b46d32d0adff928f06dd02a303f8ef3c251dfd6e2d85a95474c43',
    );
    await expect(pbkdf2Sha256Hex('password', 'salt', 4096)).resolves.toBe(
      'c5e478d59288c841aa530db6845c4c8d962893a001ce4e11a4963873aa98134a',
    );
  });

  it('держит сотни тысяч итераций для кода дневника', () => {
    expect(DIARY_KDF_ITERATIONS).toBeGreaterThanOrEqual(100_000);
  });
});

describe('timingSafeEqual', () => {
  it('считает равными только одинаковые строки', () => {
    expect(timingSafeEqual('abc', 'abc')).toBe(true);
    expect(timingSafeEqual('abc', 'abd')).toBe(false);
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
    expect(timingSafeEqual('', '')).toBe(true);
  });
});
