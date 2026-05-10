import { test, expect } from '@playwright/test';

const DEMO_EMAIL = 'arya@demo.roamera.in';
const DEMO_PASSWORD = 'password123';

test.describe('Authentication — happy path', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in|log in|welcome/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('login with valid credentials redirects to home', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(DEMO_EMAIL);
    await page.getByLabel(/password/i).fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/(compass|home|feed|$)/, { timeout: 10_000 });
    await expect(page).not.toHaveURL(/login/);
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('bad@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page.getByText(/invalid|incorrect|wrong|failed/i)).toBeVisible({ timeout: 5_000 });
  });

  test('register page renders', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /register|sign up|create account/i })).toBeVisible();
  });

  test('logout redirects to login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(DEMO_EMAIL);
    await page.getByLabel(/password/i).fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/(compass|home|feed|$)/, { timeout: 10_000 });

    // Find and click logout
    const logoutBtn = page.getByRole('button', { name: /log ?out|sign out/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      // May be in a dropdown menu
      await page.getByRole('button', { name: /menu|profile|avatar/i }).first().click();
      await page.getByRole('menuitem', { name: /log ?out|sign out/i }).click();
    }
    await page.waitForURL(/login/, { timeout: 5_000 });
    await expect(page).toHaveURL(/login/);
  });
});
