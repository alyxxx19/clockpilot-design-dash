import { test, expect } from '@playwright/test';

// Use authenticated employee state
test.use({ storageState: 'tests/e2e/.auth/user.json' });

test.describe('Offline Mode Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start from time entry page
    await page.goto('/employee/time-entry');
    await expect(page.getByTestId('time-entry-page')).toBeVisible();
  });

  test('should detect online/offline status', async ({ page }) => {
    // Verify initially online
    await expect(page.getByTestId('connection-status')).toContainText('En ligne');
    
    // Go offline
    await page.context().setOffline(true);
    
    // Verify offline detection
    await expect(page.getByTestId('connection-status')).toContainText('Hors ligne');
    await expect(page.getByTestId('offline-indicator')).toBeVisible();
    
    // Go back online
    await page.context().setOffline(false);
    
    // Verify online detection
    await expect(page.getByTestId('connection-status')).toContainText('En ligne');
    await expect(page.getByTestId('offline-indicator')).not.toBeVisible();
  });

  test('should queue actions when offline', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);
    await expect(page.getByTestId('offline-indicator')).toBeVisible();
    
    // Try to punch in while offline
    await page.getByTestId('button-punch-in').click();
    
    // Verify action is queued
    await expect(page.getByTestId('offline-queue')).toBeVisible();
    await expect(page.getByTestId('offline-queue')).toContainText('1 action en attente');
    await expect(page.getByTestId('queued-action')).toContainText('Pointage entrée');
    
    // Try to create manual time entry while offline
    await page.getByTestId('button-manual-entry').click();
    await page.getByTestId('input-date').fill('2024-01-15');
    await page.getByTestId('input-start-time').fill('09:00');
    await page.getByTestId('input-end-time').fill('17:00');
    await page.getByTestId('select-project').selectOption('Project Alpha');
    await page.getByTestId('button-submit-entry').click();
    
    // Verify second action is queued
    await expect(page.getByTestId('offline-queue')).toContainText('2 actions en attente');
    
    // Verify both actions in queue
    const queuedActions = page.getByTestId('queued-action');
    await expect(queuedActions).toHaveCount(2);
  });

  test('should sync queued actions when going online', async ({ page }) => {
    // Go offline and perform actions
    await page.context().setOffline(true);
    
    // Punch in offline
    await page.getByTestId('button-punch-in').click();
    await expect(page.getByTestId('offline-queue')).toContainText('1 action en attente');
    
    // Go back online
    await page.context().setOffline(false);
    
    // Verify sync indicator appears
    await expect(page.getByTestId('sync-indicator')).toBeVisible();
    await expect(page.getByTestId('sync-status')).toContainText('Synchronisation...');
    
    // Wait for sync to complete
    await page.waitForTimeout(3000);
    
    // Verify queue is cleared
    await expect(page.getByTestId('offline-queue')).toContainText('0 action en attente');
    await expect(page.getByTestId('sync-status')).toContainText('Synchronisé');
    
    // Verify punch-in was successful
    await expect(page.getByTestId('punch-status')).toContainText('Pointé');
  });

  test('should handle sync failures gracefully', async ({ page }) => {
    // Go offline and perform action
    await page.context().setOffline(true);
    await page.getByTestId('button-punch-in').click();
    
    // Mock server error when going online
    await page.route('**/api/time-entries/punch', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server error' })
      });
    });
    
    // Go back online
    await page.context().setOffline(false);
    
    // Verify sync failure is handled
    await expect(page.getByTestId('sync-error')).toBeVisible();
    await expect(page.getByTestId('sync-error')).toContainText('Erreur de synchronisation');
    
    // Verify action remains in queue
    await expect(page.getByTestId('offline-queue')).toContainText('1 action en attente');
    
    // Verify retry option
    await expect(page.getByTestId('button-retry-sync')).toBeVisible();
  });

  test('should retry failed sync actions', async ({ page }) => {
    // Set up initial failure scenario
    await page.context().setOffline(true);
    await page.getByTestId('button-punch-in').click();
    
    // Mock initial failure then success
    let callCount = 0;
    await page.route('**/api/time-entries/punch', route => {
      callCount++;
      if (callCount === 1) {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server error' })
        });
      } else {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true, id: 123 })
        });
      }
    });
    
    // Go online (first attempt fails)
    await page.context().setOffline(false);
    await expect(page.getByTestId('sync-error')).toBeVisible();
    
    // Retry sync
    await page.getByTestId('button-retry-sync').click();
    
    // Verify success on retry
    await expect(page.getByTestId('sync-status')).toContainText('Synchronisé');
    await expect(page.getByTestId('offline-queue')).toContainText('0 action en attente');
  });

  test('should save form data locally when offline', async ({ page }) => {
    // Start filling manual entry form
    await page.getByTestId('button-manual-entry').click();
    await page.getByTestId('input-date').fill('2024-01-15');
    await page.getByTestId('input-start-time').fill('09:00');
    await page.getByTestId('input-end-time').fill('17:00');
    await page.getByTestId('textarea-description').fill('Working on important project');
    
    // Go offline
    await page.context().setOffline(true);
    
    // Continue filling form
    await page.getByTestId('select-project').selectOption('Project Beta');
    
    // Submit form while offline
    await page.getByTestId('button-submit-entry').click();
    
    // Verify data is saved locally and queued
    await expect(page.getByTestId('offline-queue')).toContainText('1 action en attente');
    await expect(page.getByTestId('queued-action')).toContainText('Project Beta');
    await expect(page.getByTestId('queued-action')).toContainText('Working on important project');
  });

  test('should show cached data when offline', async ({ page }) => {
    // Load data while online
    await page.goto('/employee/planning');
    await expect(page.getByTestId('planning-calendar')).toBeVisible();
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Go offline
    await page.context().setOffline(true);
    
    // Navigate away and back
    await page.goto('/employee/dashboard');
    await page.goto('/employee/planning');
    
    // Verify cached data is still available
    await expect(page.getByTestId('planning-calendar')).toBeVisible();
    await expect(page.getByTestId('cached-data-indicator')).toBeVisible();
    await expect(page.getByTestId('cached-data-indicator')).toContainText('Données mises en cache');
  });

  test('should handle offline punch out', async ({ page }) => {
    // First punch in while online
    await page.getByTestId('button-punch-in').click();
    await expect(page.getByTestId('punch-status')).toContainText('Pointé');
    
    // Go offline
    await page.context().setOffline(true);
    
    // Try to punch out while offline
    await page.getByTestId('button-punch-out').click();
    
    // Verify punch out is queued
    await expect(page.getByTestId('offline-queue')).toContainText('1 action en attente');
    await expect(page.getByTestId('queued-action')).toContainText('Pointage sortie');
    
    // Verify local status shows as punched out
    await expect(page.getByTestId('punch-status')).toContainText('Fin de journée (en attente)');
  });

  test('should show data freshness indicators', async ({ page }) => {
    // Load fresh data while online
    await page.goto('/employee/reports');
    await expect(page.getByTestId('data-timestamp')).toBeVisible();
    
    // Note the initial timestamp
    const initialTimestamp = await page.getByTestId('data-timestamp').textContent();
    
    // Go offline
    await page.context().setOffline(true);
    
    // Verify stale data indicator
    await expect(page.getByTestId('stale-data-warning')).toBeVisible();
    await expect(page.getByTestId('stale-data-warning')).toContainText('Données hors ligne');
    
    // Verify timestamp hasn't changed
    await expect(page.getByTestId('data-timestamp')).toContainText(initialTimestamp || '');
  });

  test('should handle offline task creation', async ({ page }) => {
    // Navigate to tasks page
    await page.goto('/employee/tasks');
    
    // Go offline
    await page.context().setOffline(true);
    
    // Create task while offline
    await page.getByTestId('button-new-task').click();
    await page.getByTestId('input-task-title').fill('Offline task creation');
    await page.getByTestId('textarea-task-description').fill('This task was created while offline');
    await page.getByTestId('select-task-priority').selectOption('high');
    await page.getByTestId('button-save-task').click();
    
    // Verify task is queued
    await expect(page.getByTestId('offline-queue')).toContainText('1 action en attente');
    
    // Verify task appears in local list with offline indicator
    await expect(page.getByTestId('task-list')).toContainText('Offline task creation');
    await expect(page.getByTestId('task-offline-indicator')).toBeVisible();
  });

  test('should handle network intermittency', async ({ page }) => {
    // Simulate network going on and off repeatedly
    for (let i = 0; i < 3; i++) {
      // Go offline
      await page.context().setOffline(true);
      await page.getByTestId('button-punch-in').click();
      
      // Go online briefly
      await page.context().setOffline(false);
      await page.waitForTimeout(500);
      
      // Go offline again
      await page.context().setOffline(true);
      await page.waitForTimeout(500);
    }
    
    // Finally go online
    await page.context().setOffline(false);
    
    // Verify all actions eventually sync
    await page.waitForTimeout(5000);
    await expect(page.getByTestId('offline-queue')).toContainText('0 action en attente');
  });

  test('should persist queue across page reloads', async ({ page }) => {
    // Go offline and perform action
    await page.context().setOffline(true);
    await page.getByTestId('button-punch-in').click();
    await expect(page.getByTestId('offline-queue')).toContainText('1 action en attente');
    
    // Reload page
    await page.reload();
    
    // Verify queue persists
    await expect(page.getByTestId('offline-queue')).toContainText('1 action en attente');
    await expect(page.getByTestId('queued-action')).toContainText('Pointage entrée');
  });
});