import { APP_NAME } from '@/constants';

type LogLevel = 'info' | 'warn' | 'error';

export interface LoggedError {
  at: number;
  message: string;
  detail?: string;
}

const MAX_RECENT_ERRORS = 12;
const recentErrors: LoggedError[] = [];

function isDev(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

function errorDetail(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }
  if (error === undefined) {
    return undefined;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function rememberError(message: string, error?: unknown): void {
  recentErrors.push({
    at: Date.now(),
    message,
    detail: errorDetail(error),
  });
  if (recentErrors.length > MAX_RECENT_ERRORS) {
    recentErrors.shift();
  }
}

function log(level: LogLevel, message: string, error?: unknown): void {
  if (level === 'info' && !isDev()) {
    return;
  }

  if (level === 'error') {
    rememberError(message, error);
  }

  const prefix = `[${APP_NAME}:${level.toUpperCase()}]`;

  if (error !== undefined) {
    console[level === 'error' ? 'error' : 'warn'](prefix, message, error);
    return;
  }

  if (level === 'warn') {
    console.warn(prefix, message);
    return;
  }

  console.log(prefix, message);
}

export const logger = {
  info: (message: string) => log('info', message),
  warn: (message: string, error?: unknown) => log('warn', message, error),
  error: (message: string, error?: unknown) => log('error', message, error),
};

export function getRecentErrors(): readonly LoggedError[] {
  return recentErrors;
}
