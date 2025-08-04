import { test, expect } from '@playwright/test';

// Use authenticated state for employee
test.use({ storageState: 'tests/e2e/.auth/user.json' });

test.describe('Employee Workflow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start from employee dashboard
    await page.goto('/employee/dashboard');
    await expect(page.getByTestId('employee-dashboard')).toBeVisible();
  });

  test('should view employee dashboard', async ({ page }) => {
    // Verify dashboard elements
    await expect(page.getByTestId('welcome-message')).toBeVisible();
    await expect(page.getByTestId('quick-stats')).toBeVisible();
    await expect(page.getByTestId('recent-activity')).toBeVisible();
    
    // Check navigation menu
    await expect(page.getByTestId('nav-planning')).toBeVisible();
    await expect(page.getByTestId('nav-time-entry')).toBeVisible();
    await expect(page.getByTestId('nav-tasks')).toBeVisible();
    await expect(page.getByTestId('nav-reports')).toBeVisible();
  });

  test('should view personal planning', async ({ page }) => {
    // Navigate to planning
    await page.getByTestId('nav-planning').click();
    await expect(page).toHaveURL('/employee/planning');
    
    // Verify planning page elements
    await expect(page.getByTestId('planning-calendar')).toBeVisible();
    await expect(page.getByTestId('date-navigation')).toBeVisible();
    
    // Check for planning entries
    await expect(page.getByTestId('planning-entry')).toBeVisible();
    
    // Test date navigation
    await page.getByTestId('button-next-week').click();
    await expect(page.getByTestId('current-week-display')).toContainText('Semaine');
    
    // Test view toggle (day/week/month)
    await page.getByTestId('view-toggle-week').click();
    await expect(page.getByTestId('week-view')).toBeVisible();
    
    await page.getByTestId('view-toggle-day').click();
    await expect(page.getByTestId('day-view')).toBeVisible();
  });

  test('should punch in and out (time tracking)', async ({ page }) => {
    // Navigate to time entry
    await page.getByTestId('nav-time-entry').click();
    await expect(page).toHaveURL('/employee/time-entry');
    
    // Verify time tracking interface
    await expect(page.getByTestId('time-clock')).toBeVisible();
    await expect(page.getByTestId('current-time')).toBeVisible();
    
    // Test punch in
    const punchInButton = page.getByTestId('button-punch-in');
    if (await punchInButton.isVisible()) {
      await punchInButton.click();
      
      // Verify punch in confirmation
      await expect(page.getByTestId('punch-status')).toContainText('Pointé');
      await expect(page.getByTestId('button-punch-out')).toBeVisible();
      
      // Test punch out
      await page.getByTestId('button-punch-out').click();
      
      // Verify punch out confirmation
      await expect(page.getByTestId('punch-status')).toContainText('Fin de journée');
      await expect(page.getByTestId('button-punch-in')).toBeVisible();
    }
  });

  test('should create manual time entry', async ({ page }) => {
    // Navigate to time entry
    await page.getByTestId('nav-time-entry').click();
    
    // Open manual entry form
    await page.getByTestId('button-manual-entry').click();
    await expect(page.getByTestId('manual-entry-modal')).toBeVisible();
    
    // Fill manual entry form
    await page.getByTestId('input-date').fill('2024-01-15');
    await page.getByTestId('input-start-time').fill('09:00');
    await page.getByTestId('input-end-time').fill('17:00');
    await page.getByTestId('select-project').selectOption('Project Alpha');
    await page.getByTestId('textarea-description').fill('Development work on user interface');
    
    // Submit manual entry
    await page.getByTestId('button-submit-entry').click();
    
    // Verify success
    await expect(page.getByTestId('success-message')).toBeVisible();
    await expect(page.getByTestId('success-message')).toContainText('Entrée créée');
    
    // Verify entry appears in list
    await expect(page.getByTestId('time-entry-list')).toContainText('2024-01-15');
    await expect(page.getByTestId('time-entry-list')).toContainText('Project Alpha');
  });

  test('should view and filter time entries', async ({ page }) => {
    // Navigate to time entry
    await page.getByTestId('nav-time-entry').click();
    
    // Test date range filter
    await page.getByTestId('filter-start-date').fill('2024-01-01');
    await page.getByTestId('filter-end-date').fill('2024-01-31');
    await page.getByTestId('button-apply-filters').click();
    
    // Verify filtered results
    await expect(page.getByTestId('time-entry-list')).toBeVisible();
    
    // Test project filter
    await page.getByTestId('filter-project').selectOption('Project Alpha');
    await page.getByTestId('button-apply-filters').click();
    
    // Verify project-specific results
    const entries = page.getByTestId('time-entry-item');
    await expect(entries.first()).toContainText('Project Alpha');
    
    // Test status filter
    await page.getByTestId('filter-status').selectOption('pending');
    await page.getByTestId('button-apply-filters').click();
    
    // Clear filters
    await page.getByTestId('button-clear-filters').click();
    await expect(page.getByTestId('filter-start-date')).toHaveValue('');
  });

  test('should view personal reports', async ({ page }) => {
    // Navigate to reports
    await page.getByTestId('nav-reports').click();
    await expect(page).toHaveURL('/employee/reports');
    
    // Verify reports page elements
    await expect(page.getByTestId('report-summary')).toBeVisible();
    await expect(page.getByTestId('hours-chart')).toBeVisible();
    
    // Test report date range
    await page.getByTestId('report-start-date').fill('2024-01-01');
    await page.getByTestId('report-end-date').fill('2024-01-31');
    await page.getByTestId('button-generate-report').click();
    
    // Verify report data
    await expect(page.getByTestId('total-hours')).toBeVisible();
    await expect(page.getByTestId('overtime-hours')).toBeVisible();
    await expect(page.getByTestId('projects-breakdown')).toBeVisible();
    
    // Test export functionality
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('button-export-pdf').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('should manage tasks', async ({ page }) => {
    // Navigate to tasks
    await page.getByTestId('nav-tasks').click();
    await expect(page).toHaveURL('/employee/tasks');
    
    // Verify tasks page
    await expect(page.getByTestId('task-list')).toBeVisible();
    
    // Create new task
    await page.getByTestId('button-new-task').click();
    await expect(page.getByTestId('task-modal')).toBeVisible();
    
    // Fill task form
    await page.getByTestId('input-task-title').fill('Review code documentation');
    await page.getByTestId('textarea-task-description').fill('Review and update API documentation');
    await page.getByTestId('select-task-priority').selectOption('medium');
    await page.getByTestId('input-task-due-date').fill('2024-01-20');
    
    // Submit task
    await page.getByTestId('button-save-task').click();
    
    // Verify task created
    await expect(page.getByTestId('success-message')).toContainText('Tâche créée');
    await expect(page.getByTestId('task-list')).toContainText('Review code documentation');
    
    // Mark task as completed
    await page.getByTestId('task-checkbox').first().check();
    await expect(page.getByTestId('task-item').first()).toHaveClass(/completed/);
  });

  test('should update profile information', async ({ page }) => {
    // Navigate to profile
    await page.getByTestId('user-menu').click();
    await page.getByTestId('link-profile').click();
    await expect(page).toHaveURL('/employee/profile');
    
    // Verify profile page
    await expect(page.getByTestId('profile-form')).toBeVisible();
    
    // Update phone number
    await page.getByTestId('input-phone').fill('+33 6 12 34 56 78');
    
    // Update address
    await page.getByTestId('input-address').fill('123 Rue de la Paix, 75001 Paris');
    
    // Save changes
    await page.getByTestId('button-save-profile').click();
    
    // Verify success
    await expect(page.getByTestId('success-message')).toContainText('Profil mis à jour');
  });

  test('should handle offline mode', async ({ page }) => {
    // Go to time entry page
    await page.getByTestId('nav-time-entry').click();
    
    // Go offline
    await page.context().setOffline(true);
    
    // Try to punch in while offline
    await page.getByTestId('button-punch-in').click();
    
    // Verify offline indicator
    await expect(page.getByTestId('offline-indicator')).toBeVisible();
    await expect(page.getByTestId('offline-queue')).toContainText('1 action en attente');
    
    // Go back online
    await page.context().setOffline(false);
    
    // Verify sync
    await expect(page.getByTestId('sync-indicator')).toBeVisible();
    await page.waitForTimeout(2000); // Wait for sync
    await expect(page.getByTestId('offline-queue')).toContainText('0 action');
  });

  test('should receive notifications', async ({ page }) => {
    // Navigate to notifications
    await page.getByTestId('nav-notifications').click();
    await expect(page).toHaveURL('/notifications');
    
    // Verify notifications page
    await expect(page.getByTestId('notifications-list')).toBeVisible();
    
    // Check notification badge
    const notificationBadge = page.getByTestId('notification-badge');
    if (await notificationBadge.isVisible()) {
      await expect(notificationBadge).toContainText(/\d+/);
    }
    
    // Mark notification as read
    const firstNotification = page.getByTestId('notification-item').first();
    if (await firstNotification.isVisible()) {
      await firstNotification.getByTestId('button-mark-read').click();
      await expect(firstNotification).toHaveClass(/read/);
    }
  });
});