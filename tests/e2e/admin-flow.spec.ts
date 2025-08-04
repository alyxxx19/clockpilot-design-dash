import { test, expect } from '@playwright/test';

// Use authenticated state for admin
test.use({ storageState: 'tests/e2e/.auth/admin.json' });

test.describe('Admin Workflow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start from admin dashboard
    await page.goto('/admin/dashboard');
    await expect(page.getByTestId('admin-dashboard')).toBeVisible();
  });

  test('should view admin dashboard', async ({ page }) => {
    // Verify dashboard elements
    await expect(page.getByTestId('stats-overview')).toBeVisible();
    await expect(page.getByTestId('employee-count')).toBeVisible();
    await expect(page.getByTestId('active-projects')).toBeVisible();
    await expect(page.getByTestId('pending-validations')).toBeVisible();
    
    // Check admin navigation
    await expect(page.getByTestId('nav-employees')).toBeVisible();
    await expect(page.getByTestId('nav-planning')).toBeVisible();
    await expect(page.getByTestId('nav-validation')).toBeVisible();
    await expect(page.getByTestId('nav-reports')).toBeVisible();
  });

  test('should create new employee', async ({ page }) => {
    // Navigate to employees management
    await page.getByTestId('nav-employees').click();
    await expect(page).toHaveURL('/admin/employees');
    
    // Open new employee form
    await page.getByTestId('button-new-employee').click();
    await expect(page.getByTestId('employee-modal')).toBeVisible();
    
    // Fill employee form
    await page.getByTestId('input-first-name').fill('Jean');
    await page.getByTestId('input-last-name').fill('Dupont');
    await page.getByTestId('input-email').fill('jean.dupont@clockpilot.com');
    await page.getByTestId('input-employee-number').fill('EMP001');
    await page.getByTestId('select-department').selectOption('Développement');
    await page.getByTestId('select-position').selectOption('Développeur Senior');
    await page.getByTestId('input-hire-date').fill('2024-01-15');
    await page.getByTestId('input-salary').fill('45000');
    await page.getByTestId('input-weekly-hours').fill('35');
    
    // Set contract details
    await page.getByTestId('select-contract-type').selectOption('CDI');
    await page.getByTestId('input-start-date').fill('2024-01-15');
    
    // Submit form
    await page.getByTestId('button-save-employee').click();
    
    // Verify success
    await expect(page.getByTestId('success-message')).toContainText('Employé créé');
    
    // Verify employee appears in list
    await expect(page.getByTestId('employee-list')).toContainText('Jean Dupont');
    await expect(page.getByTestId('employee-list')).toContainText('jean.dupont@clockpilot.com');
  });

  test('should edit existing employee', async ({ page }) => {
    // Navigate to employees
    await page.getByTestId('nav-employees').click();
    
    // Click edit on first employee
    await page.getByTestId('employee-item').first().getByTestId('button-edit').click();
    await expect(page.getByTestId('employee-modal')).toBeVisible();
    
    // Update employee information
    await page.getByTestId('input-phone').fill('+33 6 12 34 56 78');
    await page.getByTestId('input-address').fill('123 Rue de la République, 75001 Paris');
    await page.getByTestId('select-status').selectOption('active');
    
    // Save changes
    await page.getByTestId('button-save-employee').click();
    
    // Verify success
    await expect(page.getByTestId('success-message')).toContainText('Employé mis à jour');
  });

  test('should generate planning for team', async ({ page }) => {
    // Navigate to planning management
    await page.getByTestId('nav-planning').click();
    await expect(page).toHaveURL('/admin/planning');
    
    // Open planning generation form
    await page.getByTestId('button-generate-planning').click();
    await expect(page.getByTestId('planning-generation-modal')).toBeVisible();
    
    // Configure planning generation
    await page.getByTestId('input-start-date').fill('2024-01-22');
    await page.getByTestId('input-end-date').fill('2024-01-28');
    await page.getByTestId('select-department').selectOption('Développement');
    
    // Set work patterns
    await page.getByTestId('checkbox-monday').check();
    await page.getByTestId('checkbox-tuesday').check();
    await page.getByTestId('checkbox-wednesday').check();
    await page.getByTestId('checkbox-thursday').check();
    await page.getByTestId('checkbox-friday').check();
    
    await page.getByTestId('input-start-time').fill('09:00');
    await page.getByTestId('input-end-time').fill('17:00');
    
    // Generate planning
    await page.getByTestId('button-confirm-generation').click();
    
    // Verify success
    await expect(page.getByTestId('success-message')).toContainText('Planning généré');
    
    // Verify planning entries appear
    await expect(page.getByTestId('planning-calendar')).toBeVisible();
    await expect(page.getByTestId('planning-entry')).toBeVisible();
  });

  test('should validate time entries', async ({ page }) => {
    // Navigate to validation page
    await page.getByTestId('nav-validation').click();
    await expect(page).toHaveURL('/admin/validation');
    
    // Verify pending validations
    await expect(page.getByTestId('pending-list')).toBeVisible();
    
    // Filter by employee
    await page.getByTestId('filter-employee').selectOption('Jean Dupont');
    await page.getByTestId('button-apply-filters').click();
    
    // Select first pending entry
    const firstEntry = page.getByTestId('validation-item').first();
    await expect(firstEntry).toBeVisible();
    
    // Approve time entry
    await firstEntry.getByTestId('button-approve').click();
    await expect(page.getByTestId('approve-modal')).toBeVisible();
    
    // Add approval comment
    await page.getByTestId('textarea-approval-comment').fill('Heures validées - conforme au planning');
    await page.getByTestId('button-confirm-approval').click();
    
    // Verify success
    await expect(page.getByTestId('success-message')).toContainText('Entrée approuvée');
    
    // Test bulk approval
    await page.getByTestId('checkbox-select-all').check();
    await page.getByTestId('button-bulk-approve').click();
    await page.getByTestId('button-confirm-bulk-approval').click();
    
    // Verify bulk approval success
    await expect(page.getByTestId('success-message')).toContainText('entrées approuvées');
  });

  test('should reject time entry with comment', async ({ page }) => {
    // Navigate to validation page
    await page.getByTestId('nav-validation').click();
    
    // Select entry to reject
    const entryToReject = page.getByTestId('validation-item').first();
    await entryToReject.getByTestId('button-reject').click();
    
    // Fill rejection form
    await expect(page.getByTestId('reject-modal')).toBeVisible();
    await page.getByTestId('textarea-rejection-reason').fill('Heures incorrectes - pas de projet assigné pour cette période');
    await page.getByTestId('checkbox-notify-employee').check();
    
    // Confirm rejection
    await page.getByTestId('button-confirm-rejection').click();
    
    // Verify success
    await expect(page.getByTestId('success-message')).toContainText('Entrée rejetée');
  });

  test('should generate and export admin reports', async ({ page }) => {
    // Navigate to reports
    await page.getByTestId('nav-reports').click();
    await expect(page).toHaveURL('/admin/reports');
    
    // Configure report parameters
    await page.getByTestId('select-report-type').selectOption('monthly-summary');
    await page.getByTestId('input-report-month').fill('2024-01');
    await page.getByTestId('select-department').selectOption('Développement');
    
    // Generate report
    await page.getByTestId('button-generate-report').click();
    
    // Wait for report to load
    await expect(page.getByTestId('report-data')).toBeVisible();
    
    // Verify report content
    await expect(page.getByTestId('total-hours-worked')).toBeVisible();
    await expect(page.getByTestId('overtime-summary')).toBeVisible();
    await expect(page.getByTestId('attendance-rate')).toBeVisible();
    
    // Test Excel export
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('button-export-excel').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.xlsx');
    
    // Test PDF export
    const pdfDownloadPromise = page.waitForEvent('download');
    await page.getByTestId('button-export-pdf').click();
    const pdfDownload = await pdfDownloadPromise;
    expect(pdfDownload.suggestedFilename()).toContain('.pdf');
  });

  test('should manage departments', async ({ page }) => {
    // Navigate to employees page
    await page.getByTestId('nav-employees').click();
    
    // Open departments management
    await page.getByTestId('button-manage-departments').click();
    await expect(page.getByTestId('departments-modal')).toBeVisible();
    
    // Add new department
    await page.getByTestId('button-add-department').click();
    await page.getByTestId('input-department-name').fill('Marketing');
    await page.getByTestId('input-department-code').fill('MKT');
    await page.getByTestId('textarea-department-description').fill('Équipe marketing et communication');
    await page.getByTestId('button-save-department').click();
    
    // Verify department added
    await expect(page.getByTestId('department-list')).toContainText('Marketing');
    
    // Edit department
    await page.getByTestId('department-item').last().getByTestId('button-edit-department').click();
    await page.getByTestId('input-department-budget').fill('50000');
    await page.getByTestId('button-save-department').click();
    
    // Verify success
    await expect(page.getByTestId('success-message')).toContainText('Département mis à jour');
  });

  test('should manage projects', async ({ page }) => {
    // Navigate to projects (assuming it's under planning)
    await page.getByTestId('nav-planning').click();
    await page.getByTestId('tab-projects').click();
    
    // Create new project
    await page.getByTestId('button-new-project').click();
    await expect(page.getByTestId('project-modal')).toBeVisible();
    
    // Fill project form
    await page.getByTestId('input-project-name').fill('Application Mobile');
    await page.getByTestId('input-project-code').fill('APP-MOB-001');
    await page.getByTestId('textarea-project-description').fill('Développement de l\'application mobile ClockPilot');
    await page.getByTestId('input-client-name').fill('ClockPilot SAS');
    await page.getByTestId('input-start-date').fill('2024-01-15');
    await page.getByTestId('input-end-date').fill('2024-06-15');
    await page.getByTestId('input-budget').fill('150000');
    
    // Assign team members
    await page.getByTestId('select-project-manager').selectOption('Jean Dupont');
    await page.getByTestId('multiselect-team-members').click();
    await page.getByRole('option', { name: 'Marie Martin' }).click();
    await page.getByRole('option', { name: 'Pierre Durand' }).click();
    
    // Save project
    await page.getByTestId('button-save-project').click();
    
    // Verify success
    await expect(page.getByTestId('success-message')).toContainText('Projet créé');
    await expect(page.getByTestId('project-list')).toContainText('Application Mobile');
  });

  test('should view and analyze overtime', async ({ page }) => {
    // Navigate to reports
    await page.getByTestId('nav-reports').click();
    
    // Select overtime analysis
    await page.getByTestId('tab-overtime-analysis').click();
    await expect(page.getByTestId('overtime-dashboard')).toBeVisible();
    
    // Configure analysis period
    await page.getByTestId('input-analysis-start').fill('2024-01-01');
    await page.getByTestId('input-analysis-end').fill('2024-01-31');
    await page.getByTestId('button-analyze-overtime').click();
    
    // Verify overtime data
    await expect(page.getByTestId('overtime-summary')).toBeVisible();
    await expect(page.getByTestId('overtime-by-employee')).toBeVisible();
    await expect(page.getByTestId('overtime-chart')).toBeVisible();
    
    // Check for compliance alerts
    const complianceAlerts = page.getByTestId('compliance-alerts');
    if (await complianceAlerts.isVisible()) {
      await expect(complianceAlerts).toContainText('Attention');
    }
  });

  test('should manage system settings', async ({ page }) => {
    // Navigate to settings
    await page.getByTestId('nav-settings').click();
    await expect(page).toHaveURL('/admin/settings');
    
    // Update company information
    await page.getByTestId('tab-company').click();
    await page.getByTestId('input-company-name').fill('ClockPilot Enterprise');
    await page.getByTestId('input-company-address').fill('456 Avenue des Champs-Élysées, 75008 Paris');
    await page.getByTestId('input-company-phone').fill('+33 1 23 45 67 89');
    
    // Save company settings
    await page.getByTestId('button-save-company').click();
    await expect(page.getByTestId('success-message')).toContainText('Paramètres société mis à jour');
    
    // Update working hours defaults
    await page.getByTestId('tab-working-hours').click();
    await page.getByTestId('input-default-weekly-hours').fill('35');
    await page.getByTestId('input-overtime-threshold').fill('35');
    await page.getByTestId('checkbox-weekend-work').check();
    
    // Save working hours settings
    await page.getByTestId('button-save-working-hours').click();
    await expect(page.getByTestId('success-message')).toContainText('Paramètres horaires mis à jour');
  });

  test('should handle legal compliance checks', async ({ page }) => {
    // Navigate to reports
    await page.getByTestId('nav-reports').click();
    
    // Open compliance dashboard
    await page.getByTestId('tab-compliance').click();
    await expect(page.getByTestId('compliance-dashboard')).toBeVisible();
    
    // Run compliance check
    await page.getByTestId('button-run-compliance-check').click();
    
    // Wait for check to complete
    await expect(page.getByTestId('compliance-results')).toBeVisible();
    
    // Verify compliance indicators
    await expect(page.getByTestId('working-time-compliance')).toBeVisible();
    await expect(page.getByTestId('rest-period-compliance')).toBeVisible();
    await expect(page.getByTestId('overtime-compliance')).toBeVisible();
    
    // Check for violations
    const violations = page.getByTestId('compliance-violations');
    if (await violations.isVisible()) {
      await expect(violations.getByTestId('violation-item')).toBeVisible();
    }
  });
});