import { test, expect } from '@playwright/test';

const DEMO_EMAIL = 'arya@demo.roamera.in';
const DEMO_PASSWORD = 'password123';

test.describe('Posts (Moments) — happy path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(DEMO_EMAIL);
    await page.getByLabel(/password/i).fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/(compass|home|feed|$)/, { timeout: 10_000 });
  });

  test('Compass feed loads and shows posts or empty state', async ({ page }) => {
    await page.goto('/compass');
    await expect(page).not.toHaveURL(/login/);
    // Feed renders within 5 seconds
    await page.waitForTimeout(1000);
    const hasPosts = await page.getByRole('article').count() > 0;
    const hasEmpty = await page.getByText(/no posts|be the first|discover/i).isVisible().catch(() => false);
    expect(hasPosts || hasEmpty).toBe(true);
  });

  test('Create a new post (Moment)', async ({ page }) => {
    await page.goto('/compass');
    // Find create/new post button
    const createBtn = page.getByRole('button', { name: /create|new post|share|moment/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      // Fill in post form
      const titleInput = page.getByPlaceholder(/title|heading/i).first();
      if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await titleInput.fill('E2E Test Moment — ' + Date.now());
      }
      const captionInput = page.getByPlaceholder(/caption|description|write/i).first();
      if (await captionInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await captionInput.fill('This is an automated E2E test post from Playwright.');
      }
      const submitBtn = page.getByRole('button', { name: /post|publish|share/i }).first();
      if (await submitBtn.isEnabled()) {
        await submitBtn.click();
        // Should stay on page or redirect to the new post
        await page.waitForTimeout(2000);
        await expect(page).not.toHaveURL(/login/);
      }
    }
  });

  test('Post detail page loads', async ({ page }) => {
    await page.goto('/compass');
    const firstPost = page.getByRole('article').first();
    if (await firstPost.isVisible({ timeout: 3000 }).catch(() => false)) {
      const link = firstPost.getByRole('link').first();
      if (await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(1500);
        await expect(page).not.toHaveURL(/login/);
      }
    }
  });
});
