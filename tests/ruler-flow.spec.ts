import { expect, test } from '@playwright/test';

async function startAs(page: import('@playwright/test').Page, rulerId: string): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#ruler-select')).toBeVisible();
  await page.locator(`[data-ruler="${rulerId}"]`).click();
  await page.locator('[data-start]').click();
  await expect(page.locator('#ruler-select')).toBeHidden();
  await page.waitForFunction(() => (window.__THREE_GAME_DIAGNOSTICS__?.frame ?? 0) > 10);
}

test('different rulers initialize different capitals and player names', async ({ page }) => {
  await startAs(page, 'liubei');
  await expect(page.locator('#top-bar')).toContainText('刘备');
  await expect(page.locator('#city-panel')).toContainText('平原');
  expect(await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.playerFactionId)).toBe('liubei');

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await startAs(page, 'caocao');
  await expect(page.locator('#top-bar')).toContainText('曹操');
  await expect(page.locator('#city-panel')).toContainText('陈留');
  expect(await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.playerFactionId)).toBe('caocao');
});

test('save refresh load restart and orders flow works', async ({ page }) => {
  await startAs(page, 'liubei');
  const startingOrders = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.ordersRemaining ?? 0);
  expect(startingOrders).toBeGreaterThan(0);

  await page.getByRole('button', { name: '开发农业' }).click();
  await expect.poll(async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.ordersRemaining ?? -1)).toBe(startingOrders - 1);
  await page.locator('button[data-action="save"]').click();
  await page.reload();
  await expect(page.locator('#ruler-select')).toBeHidden();
  await expect(page.locator('#top-bar')).toContainText('刘备');
  await expect.poll(async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.ordersRemaining ?? -1)).toBe(startingOrders - 1);

  await page.evaluate(async () => {
    const modulePath = '/src/game/GameState.ts';
    const mod = await import(modulePath);
    const state = mod.createInitialState('liubei');
    state.ordersRemaining = 1;
    state.ordersMax = 4;
    state.selectedCityId = 'pingyuan';
    localStorage.setItem('sango-strategy-demo-save-v2', JSON.stringify(state));
  });
  await page.reload();
  await page.getByRole('button', { name: '开发商业' }).click();
  await expect.poll(async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.ordersRemaining ?? -1)).toBe(0);
  await expect(page.getByRole('button', { name: '征兵' })).toBeDisabled();

  await page.locator('button[data-action="end"]').click();
  await expect.poll(async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.ordersRemaining ?? 0)).toBeGreaterThan(0);

  await page.locator('button[data-action="restart"]').click();
  await expect(page.locator('#ruler-select')).toBeVisible();
});
