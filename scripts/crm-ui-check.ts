import { chromium, devices } from 'playwright';

const base = process.env.BASE_URL ?? 'http://localhost:3000';
const key = process.env.CRM_ADMIN_KEY;
if (!key) throw new Error('CRM_ADMIN_KEY is required for the CRM UI check');
const adminKey = key;

async function main() {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext({ ...devices['iPhone 12'] });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));

  await page.goto(`${base}/crm`, { waitUntil: 'networkidle' });
  await page.locator('#crm-key').fill(adminKey);
  await page.getByRole('button', { name: 'Открыть CRM' }).click();
  await page.getByText('Рабочая очередь').waitFor();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 0) throw new Error(`CRM has ${overflow}px horizontal overflow`);
  if (errors.length > 0) throw new Error(errors.join(' | '));

  await page.screenshot({ path: 'screenshots/crm-mobile.png', fullPage: true });
  console.log('PASS  CRM открывается с admin key');
  console.log('PASS  CRM не имеет горизонтального переполнения');
  console.log('PASS  CRM не пишет ошибок в консоль');

  await context.close();
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
