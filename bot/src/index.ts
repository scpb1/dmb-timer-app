import { createBot } from './bot';
import { config } from './config';

async function main(): Promise<void> {
  const bot = createBot();

  await bot.api.setMyCommands(
    [
      { command: 'start', description: 'Начать и проверить подписку' },
      { command: 'srok', description: 'Сколько прошло и осталось' },
      { command: 'prazdniki', description: 'События' },
      { command: 'author', description: 'Написать автору' },
      { command: 'cancel', description: 'Отменить текущий шаг' },
    ],
    { scope: { type: 'all_private_chats' } },
  );

  await bot.api.setMyCommands(
    [
      { command: 'srok', description: 'Срок службы' },
      { command: 'ddd', description: 'Срок службы' },
    ],
    { scope: { type: 'all_group_chats' } },
  );

  console.log(`Канал для подписки: @${config.channelUsername}`);
  console.log(`Отзывы: @${config.adminUsername}`);
  console.log('Вставь токен, если ещё не вставила, и не закрывай это окно — бот жив, пока программа запущена.');

  await bot.start({
    onStart: (info) => {
      console.log(`Бот запущен как @${info.username}`);
    },
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
