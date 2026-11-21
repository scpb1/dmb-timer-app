import { GrammyError } from 'grammy';
import type { Api, Other } from 'grammy/out/core/api';
import type { RawApi } from 'grammy/out/core/client';

const GAP_MS = 40;

let tail: Promise<unknown> = Promise.resolve();
let lastAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function retryAfterSec(error: unknown): number | null {
  if (!(error instanceof GrammyError) || error.error_code !== 429) {
    return null;
  }
  const params = error.parameters as { retry_after?: number } | undefined;
  const value = params?.retry_after;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function enqueueApi<T>(run: () => Promise<T>): Promise<T> {
  const job = tail.then(async () => {
    const wait = Math.max(0, lastAt + GAP_MS - Date.now());
    if (wait > 0) {
      await sleep(wait);
    }
    for (;;) {
      try {
        const value = await run();
        lastAt = Date.now();
        return value;
      } catch (error) {
        const sec = retryAfterSec(error);
        if (sec === null) {
          throw error;
        }
        await sleep(sec * 1000 + GAP_MS);
      }
    }
  });
  tail = job.then(
    () => undefined,
    () => undefined,
  );
  return job;
}

export function queuedGetChatMember(
  api: Api,
  chatId: number,
  userId: number,
): ReturnType<Api['getChatMember']> {
  return enqueueApi(() => api.getChatMember(chatId, userId));
}

export function queuedSendMessage(
  api: Api,
  chatId: number,
  text: string,
  other?: Other<RawApi, 'sendMessage', 'chat_id' | 'text'>,
): ReturnType<Api['sendMessage']> {
  return enqueueApi(() => api.sendMessage(chatId, text, other));
}