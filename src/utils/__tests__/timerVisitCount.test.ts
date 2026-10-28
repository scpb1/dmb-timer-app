jest.mock('@/services/database', () => ({
  getConfig: jest.fn(),
  setConfig: jest.fn(),
}));

import { getConfig, setConfig } from '@/services/database';
import { getTimerVisitCount, incrementTimerVisitCount } from '@/utils/timerVisitCount';

const getConfigMock = getConfig as jest.Mock;
const setConfigMock = setConfig as jest.Mock;

describe('timerVisitCount', () => {
  beforeEach(() => {
    getConfigMock.mockReset();
    setConfigMock.mockReset();
  });

  it('возвращает 0, если счётчик не задан', async () => {
    getConfigMock.mockResolvedValue(null);
    await expect(getTimerVisitCount()).resolves.toBe(0);
  });

  it('увеличивает счётчик и сохраняет в config', async () => {
    getConfigMock.mockResolvedValue('5');
    await expect(incrementTimerVisitCount()).resolves.toBe(6);
    expect(setConfigMock).toHaveBeenCalledWith('timer_home_visit_count', '6');
  });
});
