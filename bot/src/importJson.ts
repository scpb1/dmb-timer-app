import fs from 'node:fs';

import { config } from './config';
import { ensureDatabase } from './db';
import { importJsonStore, jsonImportStamp } from './store';

async function main(): Promise<void> {
  await ensureDatabase();
  const stamp = await jsonImportStamp();
  if (stamp) {
    console.log(`JSON уже перенесён ${stamp}, повторно не трогаю.`);
    return;
  }

  if (!fs.existsSync(config.dataFile)) {
    console.log(`Файла ${config.dataFile} нет, перенос пропущен. Когда файл появится, скрипт заберёт его при следующем запуске.`);
    return;
  }

  const raw: unknown = JSON.parse(fs.readFileSync(config.dataFile, 'utf8'));
  const result = await importJsonStore(raw);
  if (result.status === 'already') {
    console.log(`JSON уже перенесён ${result.at}, повторно не трогаю.`);
    return;
  }

  console.log(
    `Перенесено пользователей ${result.users}, чатов ${result.chats}, отзывов ${result.feedback}. Файл store.json оставлен на месте.`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
