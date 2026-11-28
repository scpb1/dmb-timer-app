import { createBot } from './bot';
import { config } from './config';
import { ensureDatabase } from './db';
import { digestFitEstimate, startGroupScheduler } from './digest';
import { seedKnownEvents } from './store';
import { DIGEST_HOUR } from './time';

async function main(): Promise<void> {
  await ensureDatabase();
  await seedKnownEvents();
  const bot = createBot();

  await bot.api.setMyCommands(
    [
      { command: 'start', description: 'Начать и проверить подписку' },
      { command: 'mydmb', description: 'Сколько прошло и осталось' },
      { command: 'prazdniki', description: 'События' },
      { command: 'author', description: 'Написать автору' },
      { command: 'cancel', description: 'Отменить текущий шаг' },
    ],
    { scope: { type: 'all_private_chats' } },
  );

  await bot.api.setMyCommands(
    [
      { command: 'mydmb', description: 'Твой срок службы' },
      { command: 'newdmb', description: 'Встать в сводку беседы' },
      { command: 'list_dmb', description: 'Ближайшие дембеля' },
      { command: 'list_members', description: 'Участники сводки по призывам' },
      { command: 'list_all_members', description: 'Все участники сводки по призывам' },
      { command: 'list_events', description: 'События на сегодня' },
      { command: 'lists_settings', description: 'Настройки автосводки и событий' },
      { command: 'next_event', description: 'Ближайшее событие' },
      { command: 'list_next_events', description: 'Ближайшие события всех' },
      { command: 'month_events', description: 'Мои события на месяц' },
      { command: 'list_month_events', description: 'Все события на месяц' },
      { command: 'out_dmb', description: 'Выйти из сводки чата' },
    ],
    { scope: { type: 'all_group_chats' } },
  );

  const fit = digestFitEstimate();
  console.log(`Канал для подписки: @${config.channelUsername}`);
  console.log(`Отзывы: @${config.adminUsername}`);
  console.log(
    `Сводка бесед в ${DIGEST_HOUR}:00 по Москве. В одно сообщение влезает примерно ${fit.typicalUsers} человек, если имя короткое.`,
  );
  console.log('Не закрывай это окно — бот жив, пока программа запущена.');

  startGroupScheduler(bot.api);

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
