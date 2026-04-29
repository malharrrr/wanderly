import { test, expect, BrowserContext, Page } from '@playwright/test';

const TRIP_ID = 'replace-with-valid-trip-id'; 
const APP_URL = 'http://localhost:3000';
async function login(page: Page, email: string, pass: string) {
  await page.goto(`${APP_URL}/login`);
  await page.fill('input[placeholder="you@email.com"]', email);
  await page.fill('input[placeholder="••••••••"]', pass);
  await page.click('button:has-text("Sign in")');
  
  await page.waitForURL('**/dashboard');
}

test.describe('Real-Time Collaboration via Pusher', () => {
  let contextAlice: BrowserContext;
  let contextBob: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    contextAlice = await browser.newContext();
    contextBob = await browser.newContext();
  });

  test('Alice adds an expense and Bob sees it instantly', async () => {
    const pageAlice = await contextAlice.newPage();
    const pageBob = await contextBob.newPage();

    await login(pageAlice, 'alice@mail.com', 'your_password_here'); 
    await login(pageBob, 'bob@mail.com', 'your_password_here');

    await pageAlice.goto(`${APP_URL}/trips/${TRIP_ID}`);
    await pageBob.goto(`${APP_URL}/trips/${TRIP_ID}`);

    await pageAlice.click('button:has-text("splitwise")');
    await pageBob.click('button:has-text("splitwise")');
    await expect(pageBob.locator('text=Dinner at Sushi Bar')).not.toBeVisible();

    await pageAlice.fill('input[placeholder="What did you pay for? (e.g., Dinner)"]', 'Dinner at Sushi Bar');
    await pageAlice.fill('input[placeholder="0.00"]', '120');
    await pageAlice.click('button:has-text("Add Expense")');

    await expect(pageAlice.locator('text=Dinner at Sushi Bar')).toBeVisible();
    await expect(pageAlice.locator('text=$120.00')).toBeVisible();

    await expect(pageBob.locator('text=Dinner at Sushi Bar')).toBeVisible({ timeout: 5000 });
    await expect(pageBob.locator('text=$120.00')).toBeVisible({ timeout: 5000 });
    
    await expect(pageBob.locator('p:has-text("$120.00")')).toBeVisible();
  });

  test.afterAll(async () => {
    await contextAlice.close();
    await contextBob.close();
  });
});