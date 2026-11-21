import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
process.env.TZ = process.env.TZ?.trim() || 'Europe/Moscow';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`В bot/.env не задано ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function normalizeUsername(value: string): string {
  return value.replace(/^@/, '').toLowerCase();
}

/** Временно false — подписка не проверяется, включи true перед продом */
export const subscriptionRequired = false;

export const config = {
  botToken: required('BOT_TOKEN'),
  channelUsername: normalizeUsername(optional('CHANNEL_USERNAME') ?? 'girly_ddd'),
  adminUsername: normalizeUsername(optional('ADMIN_USERNAME') ?? 'imklvcva'),
  adminChatId: optional('ADMIN_CHAT_ID') ? Number(optional('ADMIN_CHAT_ID')) : undefined,
  timezone: optional('TZ') ?? 'Europe/Moscow',
  dataFile: path.resolve(__dirname, '..', 'data', 'store.json'),
  subscriptionRequired,
};

if (config.botToken.includes('сюда_токен')) {
  throw new Error('Вставь токен бота в bot/.env вместо заглушки');
}

if (config.adminChatId !== undefined && !Number.isFinite(config.adminChatId)) {
  throw new Error('ADMIN_CHAT_ID должен быть числом');
}

export const channelChatId = `@${config.channelUsername}`;
export const channelUrl = `https://t.me/${config.channelUsername}`;
