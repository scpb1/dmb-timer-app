import { enqueueDatabaseOp, isSqliteBusy, withSqliteBusyRetry } from '@/services/database/queue';

describe('database queue', () => {
  it('выполняет операции по очереди', async () => {
    const order: number[] = [];
    await Promise.all([
      enqueueDatabaseOp(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        order.push(1);
      }),
      enqueueDatabaseOp(async () => {
        order.push(2);
      }),
    ]);
    expect(order).toEqual([1, 2]);
  });

  it('повторяет работу при блокировке базы', async () => {
    let calls = 0;
    const result = await withSqliteBusyRetry(async () => {
      calls += 1;
      if (calls < 3) {
        throw new Error("Call to function 'NativeStatement.finalizeAsync' has been rejected.\n→ Caused by: Error code ♣: database is locked");
      }
      return 'ok';
    });
    expect(result).toBe('ok');
    expect(calls).toBe(3);
  });

  it('узнаёт SQLITE_BUSY', () => {
    expect(isSqliteBusy(new Error('database is locked'))).toBe(true);
    expect(isSqliteBusy(new Error('UNIQUE constraint failed'))).toBe(false);
  });
});
