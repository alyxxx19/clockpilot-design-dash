import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should login with valid employee credentials', async ({ page }) => {
    // Navigate to login page
    await page.getByTestId('link-login').click();
    await expect(page).toHaveURL('/login');
    
    // Fill login form
    await page.getByTestId('input-email').fill('employee@clockpilot.com');
    await page.getByTestId('input-password').fill('password123');
    
    // Submit form
    await page.getByTestId('button-login').click();
    
    // Verify successful login
    await expect(page).toHaveURL('/employee/dashboard');
    await expect(page.getByTestId('user-menu')).toBeVisible();
    await expect(page.getByText('Bienvenue')).toBeVisible();
  });

  test('should login with valid admin credentials', async ({ page }) => {
    // Navigate to login page
    await page.getByTestId('link-login').click();
    
    // Fill login form with admin credentials
    await page.getByTestId('input-email').fill('admin@clockpilot.com');
    await page.getByTestId('input-password').fill('admin123');
    
    // Submit form
    await page.getByTestId('button-login').click();
    
    // Verify successful admin login
    await expect(page).toHaveURL('/admin/dashboard');
    await expect(page.getByTestId('admin-nav')).toBeVisible();
    await expect(page.getByText('Tableau de bord Admin')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Navigate to login page
    await page.getByTestId('link-login').click();
    
    // Fill login form with invalid credentials
    await page.getByTestId('input-email').fill('invalid@example.com');
    await page.getByTestId('input-password').fill('wrongpassword');
    
    // Submit form
    await page.getByTestId('button-login').click();
    
    // Verify error message
    await expect(page.getByTestId('error-message')).toBeVisible();
    await expect(page.getByText('Email ou mot de passe incorrect')).toBeVisible();
    
    // Verify we're still on login page
    await expect(page).toHaveURL('/login');
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Navigate to login page
    await page.getByTestId('link-login').click();
    
    // Try to submit empty form
    await page.getByTestId('button-login').click();
    
    // Verify validation errors
    await expect(page.getByText('Email requis')).toBeVisible();
    await expect(page.getByText('Mot de passe requis')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.getByTestId('link-login').click();
    await page.getByTestId('input-email').fill('employee@clockpilot.com');
    await page.getByTestId('input-password').fill('password123');
    await page.getByTestId('button-login').click();
    
    // Wait for dashboard
    await expect(page).toHaveURL('/employee/dashboard');
    
    // Open user menu and logout
    await page.getByTestId('user-menu').click();
    await page.getByTestId('button-logout').click();
    
    // Verify logout
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('link-login')).toBeVisible();
  });

  test('should handle session expiry', async ({ page }) => {
    // Login first
    await page.getByTestId('link-login').click();
    await page.getByTestId('input-email').fill('employee@clockpilot.com');
    await page.getByTestId('input-password').fill('password123');
    await page.getByTestId('button-login').click();
    
    // Wait for dashboard
    await expect(page).toHaveURL('/employee/dashboard');
    
    // Simulate expired session by clearing cookies
    await page.context().clearCookies();
    
    // Try to access protected route
    await page.goto('/employee/planning');
    
    // Verify redirect to login
    await expect(page).toHaveURL('/login');
    await expect(page.getByText('Session expirée')).toBeVisible();
  });

  test('should redirect to intended page after login', async ({ page }) => {
    // Try to access protected page without login
    await page.goto('/employee/planning');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
    
    // Login
    await page.getByTestId('input-email').fill('employee@clockpilot.com');
    await page.getByTestId('input-password').fill('password123');
    await page.getByTestId('button-login').click();
    
    // Should redirect to originally intended page
    await expect(page).toHaveURL('/employee/planning');
  });

  test('should remember login with "Remember me" option', async ({ page }) => {
    // Navigate to login page
    await page.getByTestId('link-login').click();
    
    // Fill login form and check remember me
    await page.getByTestId('input-email').fill('employee@clockpilot.com');
    await page.getByTestId('input-password').fill('password123');
    await page.getByTestId('checkbox-remember').check();
    
    // Submit form
    await page.getByTestId('button-login').click();
    
    // Verify successful login
    await expect(page).toHaveURL('/employee/dashboard');
    
    // Close and reopen browser (simulate new session)
    await page.context().close();
    const newContext = await page.context().browser()?.newContext();
    const newPage = await newContext?.newPage();
    
    if (newPage) {
      await newPage.goto('/');
      // Should still be logged in due to remember me
      await expect(newPage).toHaveURL('/employee/dashboard');
    }
  });

  test('should show loading state during login', async ({ page }) => {
    // Navigate to login page
    await page.getByTestId('link-login').click();
    
    // Fill login form
    await page.getByTestId('input-email').fill('employee@clockpilot.com');
    await page.getByTestId('input-password').fill('password123');
    
    // Submit form and check loading state
    await page.getByTestId('button-login').click();
    
    // Verify loading state (button should show spinner)
    await expect(page.getByTestId('login-spinner')).toBeVisible();
    
    // Wait for completion
    await expect(page).toHaveURL('/employee/dashboard');
  });
});