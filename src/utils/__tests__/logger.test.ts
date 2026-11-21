import { getRecentErrors, logger } from '@/utils/logger';

describe('logger', () => {
  const dev = typeof __DEV__ === 'undefined' ? false : __DEV__;

  it('в проде оставляет короткое сообщение без стека и пути', () => {
    if (dev) {
      return;
    }

    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    logger.error('Ошибка чтения', new Error('file:///data/user/0/diary/photo.jpg'));

    expect(spy).toHaveBeenCalledTimes(1);
    const printed = spy.mock.calls[0]?.map((part) => String(part)).join(' ');
    expect(printed).toContain('Ошибка чтения');
    expect(printed).not.toContain('photo.jpg');
    expect(getRecentErrors().at(-1)?.detail).toBeUndefined();
    spy.mockRestore();
  });
});
