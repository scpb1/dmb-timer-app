type LogLevel = 'info' | 'warn' | 'error';

function log(level: LogLevel, message: string, error?: unknown): void {
  const prefix = `[Жди:${level.toUpperCase()}]`;

  if (error !== undefined) {
    console[level === 'error' ? 'error' : 'warn'](prefix, message, error);
    return;
  }

  console.log(prefix, message);
}

export const logger = {
  info: (message: string) => log('info', message),
  warn: (message: string, error?: unknown) => log('warn', message, error),
  error: (message: string, error?: unknown) => log('error', message, error),
};
