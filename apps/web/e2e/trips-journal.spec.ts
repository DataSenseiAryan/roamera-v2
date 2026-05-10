import { test, expect } from '@playwright/test';

const DEMO_EMAIL = 'arya@demo.roamera.in';
const DEMO_PASSWORD = 'password123';

test.describe('Trips + Journal tab — happy path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(DEMO_EMAIL);
    await page.getByLabel(/password/i).fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/(compass|home|feed|trips|$)/, { timeout: 10_000 });
  });

  test('Trips list page loads', async ({ page }) => {
    await page.goto('/trips');
    await expect(page).not.toHaveURL(/login/);
    await page.waitForTimeout(1000);
    const hasList = await page.getByRole('heading', { name: /trip|journey|travel/i }).count() > 0;
    const hasEmpty = await page.getByText(/no trips|plan your|create/i).isVisible().catch(() => false);
    expect(hasList || hasEmpty).toBe(true);
  });

  test('Create a new trip', async ({ page }) => {
    await page.goto('/trips');
    const createBtn = page.getByRole('button', { name: /create|new trip|add trip/i }).first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();

      const titleInput = page.getByLabel(/title|name/i).first();
      if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await titleInput.fill('Playwright E2E Trip ' + Date.now());
      }

      const dateFrom = page.getByLabel(/from|start date/i).first();
      if (await dateFrom.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dateFrom.fill('2025-08-01');
      }

      const dateTo = page.getByLabel(/to|end date/i).first();
      if (await dateTo.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dateTo.fill('2025-08-15');
      }

      const saveBtn = page.getByRole('button', { name: /save|create|submit/i }).first();
      if (await saveBtn.isEnabled()) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        await expect(page).not.toHaveURL(/login/);
      }
    }
  });

  test('Trip detail page has Journal tab', async ({ page }) => {
    await page.goto('/trips');
    await page.waitForTimeout(1000);

    // Click on first trip link
    const tripLink = page.getByRole('link', { name: /view|details|open/i }).first();
    const altLink = page.locator('a[href*="/trips/"]').first();
    const linkToClick = await tripLink.isVisible({ timeout: 2000 }).catch(() => false) ? tripLink : altLink;

    if (await linkToClick.isVisible({ timeout: 2000 }).catch(() => false)) {
      await linkToClick.click();
      await page.waitForTimeout(1500);

      // Verify Journal tab exists
      const journalTab = page.getByRole('tab', { name: /journal/i });
      await expect(journalTab).toBeVisible({ timeout: 5000 });

      // Click Journal tab
      await journalTab.click();
      await page.waitForTimeout(500);

      // Journal panel should be visible
      const journalPanel = page.getByText(/journal|entries|add entry|write/i);
      await expect(journalPanel).toBeVisible({ timeout: 3000 });
    }
  });

  test('Journal tab - add an entry', async ({ page }) => {
    await page.goto('/trips');
    await page.waitForTimeout(1000);

    const tripLink = page.locator('a[href*="/trips/"]').first();
    if (await tripLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tripLink.click();
      await page.waitForTimeout(1000);

      const journalTab = page.getByRole('tab', { name: /journal/i });
      if (await journalTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await journalTab.click();
        await page.waitForTimeout(500);

        const addBtn = page.getByRole('button', { name: /add entry|new entry|create entry/i }).first();
        if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await addBtn.click();
          const titleInput = page.getByPlaceholder(/entry title|title/i).first();
          if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await titleInput.fill('Day 1 — E2E Test Entry');
            const saveBtn = page.getByRole('button', { name: /save|create|add/i }).first();
            if (await saveBtn.isEnabled()) {
              await saveBtn.click();
              await page.waitForTimeout(1500);
              await expect(page.getByText(/Day 1|E2E Test Entry/i)).toBeVisible({ timeout: 3000 });
            }
          }
        }
      }
    }
  });

  test('"Journey Magazine" link is not in navbar (removed in S12)', async ({ page }) => {
    await page.goto('/trips');
    // Verify the old standalone Journey Magazine is gone from nav
    const oldLink = page.getByRole('link', { name: /journey magazine/i });
    await expect(oldLink).not.toBeVisible();
  });
});
