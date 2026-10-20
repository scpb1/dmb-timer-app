type AppReloadHandler = () => Promise<void>;

let reloadHandler: AppReloadHandler | null = null;

export function registerAppReloadHandler(handler: AppReloadHandler | null): void {
  reloadHandler = handler;
}

export async function reloadAppSession(): Promise<void> {
  if (!reloadHandler) {
    throw new Error('Перезагрузка приложения ещё не готова');
  }
  await reloadHandler();
}
