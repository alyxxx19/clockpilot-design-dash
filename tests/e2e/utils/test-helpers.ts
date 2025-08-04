import { Page, expect } from '@playwright/test';

/**
 * Common test utilities for ClockPilot E2E tests
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Login as employee user
   */
  async loginAsEmployee(email = 'employee@clockpilot.com', password = 'password123') {
    await this.page.goto('/login');
    await this.page.getByTestId('input-email').fill(email);
    await this.page.getByTestId('input-password').fill(password);
    await this.page.getByTestId('button-login').click();
    await expect(this.page).toHaveURL('/employee/dashboard');
  }

  /**
   * Login as admin user
   */
  async loginAsAdmin(email = 'admin@clockpilot.com', password = 'admin123') {
    await this.page.goto('/login');
    await this.page.getByTestId('input-email').fill(email);
    await this.page.getByTestId('input-password').fill(password);
    await this.page.getByTestId('button-login').click();
    await expect(this.page).toHaveURL('/admin/dashboard');
  }

  /**
   * Logout current user
   */
  async logout() {
    await this.page.getByTestId('user-menu').click();
    await this.page.getByTestId('button-logout').click();
    await expect(this.page).toHaveURL('/');
  }

  /**
   * Wait for element to be visible with retry
   */
  async waitForElement(testId: string, timeout = 10000) {
    await expect(this.page.getByTestId(testId)).toBeVisible({ timeout });
  }

  /**
   * Fill form field by test ID
   */
  async fillField(testId: string, value: string) {
    await this.page.getByTestId(testId).fill(value);
  }

  /**
   * Click button by test ID
   */
  async clickButton(testId: string) {
    await this.page.getByTestId(testId).click();
  }

  /**
   * Select option from dropdown by test ID
   */
  async selectOption(testId: string, value: string) {
    await this.page.getByTestId(testId).selectOption(value);
  }

  /**
   * Check if element exists without waiting
   */
  async elementExists(testId: string): Promise<boolean> {
    try {
      await this.page.getByTestId(testId).waitFor({ state: 'attached', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Take screenshot with timestamp
   */
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Wait for network to be idle
   */
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Simulate offline mode
   */
  async goOffline() {
    await this.page.context().setOffline(true);
  }

  /**
   * Restore online mode
   */
  async goOnline() {
    await this.page.context().setOffline(false);
  }

  /**
   * Get text content by test ID
   */
  async getTextContent(testId: string): Promise<string | null> {
    return await this.page.getByTestId(testId).textContent();
  }

  /**
   * Wait for success message
   */
  async waitForSuccessMessage(message?: string) {
    const successElement = this.page.getByTestId('success-message');
    await expect(successElement).toBeVisible();
    if (message) {
      await expect(successElement).toContainText(message);
    }
  }

  /**
   * Wait for error message
   */
  async waitForErrorMessage(message?: string) {
    const errorElement = this.page.getByTestId('error-message');
    await expect(errorElement).toBeVisible();
    if (message) {
      await expect(errorElement).toContainText(message);
    }
  }

  /**
   * Clear and fill input field
   */
  async clearAndFill(testId: string, value: string) {
    await this.page.getByTestId(testId).clear();
    await this.page.getByTestId(testId).fill(value);
  }

  /**
   * Wait for page to load completely
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Mock API response
   */
  async mockApiResponse(url: string, response: any, status = 200) {
    await this.page.route(url, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Create a new employee (admin function)
   */
  async createEmployee(employeeData: {
    firstName: string;
    lastName: string;
    email: string;
    employeeNumber: string;
    department: string;
    position: string;
  }) {
    await this.page.getByTestId('nav-employees').click();
    await this.page.getByTestId('button-new-employee').click();
    
    await this.fillField('input-first-name', employeeData.firstName);
    await this.fillField('input-last-name', employeeData.lastName);
    await this.fillField('input-email', employeeData.email);
    await this.fillField('input-employee-number', employeeData.employeeNumber);
    await this.selectOption('select-department', employeeData.department);
    await this.selectOption('select-position', employeeData.position);
    
    await this.clickButton('button-save-employee');
    await this.waitForSuccessMessage('Employé créé');
  }

  /**
   * Punch in/out helper
   */
  async punchInOut(action: 'in' | 'out') {
    await this.page.goto('/employee/time-entry');
    await this.clickButton(`button-punch-${action}`);
    
    if (action === 'in') {
      await expect(this.page.getByTestId('punch-status')).toContainText('Pointé');
    } else {
      await expect(this.page.getByTestId('punch-status')).toContainText('Fin de journée');
    }
  }

  /**
   * Create manual time entry
   */
  async createManualTimeEntry(entryData: {
    date: string;
    startTime: string;
    endTime: string;
    project: string;
    description: string;
  }) {
    await this.page.goto('/employee/time-entry');
    await this.clickButton('button-manual-entry');
    
    await this.fillField('input-date', entryData.date);
    await this.fillField('input-start-time', entryData.startTime);
    await this.fillField('input-end-time', entryData.endTime);
    await this.selectOption('select-project', entryData.project);
    await this.fillField('textarea-description', entryData.description);
    
    await this.clickButton('button-submit-entry');
    await this.waitForSuccessMessage('Entrée créée');
  }

  /**
   * Navigate to page and verify URL
   */
  async navigateAndVerify(url: string) {
    await this.page.goto(url);
    await expect(this.page).toHaveURL(url);
    await this.waitForPageLoad();
  }
}