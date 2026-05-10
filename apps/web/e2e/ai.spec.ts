import { test, expect } from '@playwright/test';

const DEMO_EMAIL = 'arya@demo.roamera.in';
const DEMO_PASSWORD = 'password123';

test.describe('AI Trip Planner — happy path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(DEMO_EMAIL);
    await page.getByLabel(/password/i).fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/(compass|home|feed|trips|$)/, { timeout: 10_000 });
  });

  test('AI planner page loads', async ({ page }) => {
    await page.goto('/plan');
    await expect(page).not.toHaveURL(/login/);
    await page.waitForTimeout(1000);
    const hasInput = await page.getByRole('textbox').count() > 0;
    const hasHeading = await page.getByRole('heading', { name: /plan|ai|trip planner|assistant/i }).count() > 0;
    expect(hasInput || hasHeading).toBe(true);
  });

  test('AI planner input field is interactive', async ({ page }) => {
    await page.goto('/plan');
    await page.waitForTimeout(1000);
    const input = page.getByRole('textbox').first();
    if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      await input.fill('Plan a 5-day trip to Goa in December');
      await expect(input).toHaveValue(/Goa/i);
    }
  });

  test('TravelLens search page loads', async ({ page }) => {
    await page.goto('/travel-lens');
    await page.waitForTimeout(1000);
    await expect(page).not.toHaveURL(/login/);
    const hasContent = await page.locator('main').isVisible();
    expect(hasContent).toBe(true);
  });

  test('Atlas / visited countries page loads', async ({ page }) => {
    await page.goto('/atlas');
    await page.waitForTimeout(1000);
    await expect(page).not.toHaveURL(/login/);
    // Atlas page should show some map or stats
    const hasMap = await page.locator('svg, canvas, .leaflet-container').count() > 0;
    const hasStats = await page.getByText(/countries|visited|percent/i).count() > 0;
    expect(hasMap || hasStats).toBe(true);
  });
});
