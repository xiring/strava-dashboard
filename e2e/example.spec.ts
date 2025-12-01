import { test, expect } from '@playwright/test';

test.describe('Strava Dashboard', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads
    await expect(page).toHaveTitle(/Strava Dashboard/i);
  });

  test('should display login button when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Should see login/connect button
    const loginButton = page.getByRole('button', { name: /connect.*strava/i });
    await expect(loginButton).toBeVisible();
  });

  test('navigation should work', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation dropdowns
    const mainNav = page.getByRole('button', { name: /main/i });
    if (await mainNav.isVisible()) {
      await mainNav.click();
      await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    }
  });
});

