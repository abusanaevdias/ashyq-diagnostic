/** Проверка окружения при старте прод-сервера: ошибки видны в логе сразу, а не после потерянной заявки. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.NODE_ENV !== 'production') return;

  const { inspectDeployment } = await import('./lib/env');
  const { errors, warnings } = await inspectDeployment();
  for (const warning of warnings) console.warn(`[ashyq env] ${warning}`);
  for (const error of errors) console.error(`[ashyq env] ОШИБКА: ${error}`);
}
