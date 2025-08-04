import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');
const adminAuthFile = path.join(__dirname, '../.auth/admin.json');

// Setup authentication for regular employee user
setup('authenticate employee', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');
  
  // Fill login form with employee credentials
  await page.getByTestId('input-email').fill('employee@clockpilot.com');
  await page.getByTestId('input-password').fill('password123');
  
  // Click login button
  await page.getByTestId('button-login').click();
  
  // Wait for successful login redirect
  await page.waitForURL('/employee/dashboard');
  
  // Verify we're logged in by checking for user info
  await expect(page.getByTestId('user-menu')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});

// Setup authentication for admin user
setup('authenticate admin', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');
  
  // Fill login form with admin credentials
  await page.getByTestId('input-email').fill('admin@clockpilot.com');
  await page.getByTestId('input-password').fill('admin123');
  
  // Click login button
  await page.getByTestId('button-login').click();
  
  // Wait for successful login redirect
  await page.waitForURL('/admin/dashboard');
  
  // Verify we're logged in by checking for admin navigation
  await expect(page.getByTestId('admin-nav')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: adminAuthFile });
});