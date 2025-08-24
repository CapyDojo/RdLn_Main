import { test, expect } from '@playwright/test';

test('homepage has title', async ({ page }) => {
  await page.goto('http://localhost:5173'); // Default Vite dev server URL
  
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/RdLn/);
});

test('can input text and compare documents', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Fill in the original document
  await page.locator('textarea[aria-label="Original Document"]').fill('This is the original text.');
  
  // Fill in the revised document
  await page.locator('textarea[aria-label="Revised Document"]').fill('This is the revised text.');
  
  // Click the compare button
  await page.getByRole('button', { name: 'Compare' }).click();
  
  // Check that results are displayed
  await expect(page.locator('.output-container')).toBeVisible();
});