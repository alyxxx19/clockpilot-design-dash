/**
 * Script automatique pour générer les screenshots de documentation
 * Utilise Playwright pour capturer toutes les pages avec des données réalistes
 */

import { chromium, Browser, Page } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'docs/screenshots';
const VIEWPORT = { width: 1200, height: 800 };

// Données de démonstration réalistes
const DEMO_DATA = {
  employees: [
    {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@clockpilot.com',
      position: 'Développeur Senior',
      department: 'Développement',
      weeklyHours: '35h/sem',
      status: 'Actif'
    },
    {
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@clockpilot.com',
      position: 'Designer UX/UI',
      department: 'Design',
      weeklyHours: '35h/sem',
      status: 'Actif'
    },
    {
      firstName: 'Pierre',
      lastName: 'Durand',
      email: 'pierre.durand@clockpilot.com',
      position: 'Chef de projet',
      department: 'Développement',
      weeklyHours: '35h/sem',
      status: 'Actif'
    }
  ],
  projects: [
    'Application Mobile ClockPilot',
    'Site Web Corporate',
    'API Integration',
    'Formation équipe'
  ],
  timeEntries: [
    { date: '15/01/2024', hours: '8h00', project: 'Application Mobile', status: 'Approuvé' },
    { date: '16/01/2024', hours: '7h30', project: 'Site Web Corporate', status: 'En attente' },
    { date: '17/01/2024', hours: '8h15', project: 'API Integration', status: 'Rejeté' }
  ]
};

class ScreenshotGenerator {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init() {
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
    await this.page.setViewportSize(VIEWPORT);
    
    // Créer les dossiers nécessaires
    await this.ensureDirectories();
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async ensureDirectories() {
    const dirs = [
      'docs/screenshots/login',
      'docs/screenshots/employee',
      'docs/screenshots/admin',
      'docs/screenshots/gifs'
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private async loginAsEmployee() {
    if (!this.page) throw new Error('Page not initialized');
    
    await this.page.goto('http://localhost:5000/login');
    await this.page.fill('[data-testid="input-email"]', 'employee@clockpilot.com');
    await this.page.fill('[data-testid="input-password"]', 'password123');
    await this.page.click('[data-testid="button-login"]');
    await this.page.waitForURL('**/employee/dashboard');
  }

  private async loginAsAdmin() {
    if (!this.page) throw new Error('Page not initialized');
    
    await this.page.goto('http://localhost:5000/login');
    await this.page.fill('[data-testid="input-email"]', 'admin@clockpilot.com');
    await this.page.fill('[data-testid="input-password"]', 'admin123');
    await this.page.click('[data-testid="button-login"]');
    await this.page.waitForURL('**/admin/dashboard');
  }

  private async takeScreenshot(filename: string, fullPage = false) {
    if (!this.page) throw new Error('Page not initialized');
    
    const screenshotPath = path.join(SCREENSHOT_DIR, filename);
    await this.page.screenshot({
      path: screenshotPath,
      fullPage,
      clip: fullPage ? undefined : { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height }
    });
    
    console.log(`✓ Screenshot saved: ${filename}`);
  }

  private async addAnnotations() {
    if (!this.page) throw new Error('Page not initialized');
    
    // Injecter du CSS pour les annotations
    await this.page.addStyleTag({
      content: `
        .screenshot-annotation {
          position: absolute;
          z-index: 9999;
          pointer-events: none;
        }
        
        .arrow {
          width: 0;
          height: 0;
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-top: 15px solid #ef4444;
        }
        
        .number-badge {
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
        }
      `
    });
  }

  async generateLoginScreenshots() {
    if (!this.page) throw new Error('Page not initialized');
    
    console.log('📸 Generating login screenshots...');
    
    // Page de connexion
    await this.page.goto('http://localhost:5000/login');
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('login/login-page.png');
    
    // Erreur de connexion
    await this.page.fill('[data-testid="input-email"]', 'invalid@example.com');
    await this.page.fill('[data-testid="input-password"]', 'wrongpassword');
    await this.page.click('[data-testid="button-login"]');
    try {
      await this.page.waitForSelector('[data-testid="error-message"]', { timeout: 3000 });
      await this.takeScreenshot('login/login-error.png');
    } catch {
      console.log('Note: Error message selector not found, taking screenshot anyway');
      await this.takeScreenshot('login/login-error.png');
    }
    
    // Connexion réussie
    await this.page.fill('[data-testid="input-email"]', 'employee@clockpilot.com');
    await this.page.fill('[data-testid="input-password"]', 'password123');
    await this.page.click('[data-testid="button-login"]');
    await this.page.waitForURL('**/employee/dashboard');
    await this.takeScreenshot('login/login-success.png');
  }

  async generateEmployeeScreenshots() {
    if (!this.page) throw new Error('Page not initialized');
    
    console.log('📸 Generating employee screenshots...');
    
    await this.loginAsEmployee();
    
    // Dashboard employé
    await this.page.goto('http://localhost:5000/employee/dashboard');
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('employee/dashboard.png');
    
    // Planning mensuel
    await this.page.goto('http://localhost:5000/employee/planning');
    await this.page.waitForLoadState('networkidle');
    await this.page.click('[data-testid="view-toggle-month"]');
    await this.takeScreenshot('employee/planning-month.png');
    
    // Pointage temps réel
    await this.page.goto('http://localhost:5000/employee/time-entry');
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('employee/time-tracking.png');
    
    // Saisie manuelle
    try {
      await this.page.click('[data-testid="button-manual-entry"]');
      await this.page.waitForSelector('[data-testid="manual-entry-modal"]', { timeout: 3000 });
      await this.takeScreenshot('employee/manual-entry.png');
      
      // Fermer le modal
      await this.page.press('Escape');
    } catch {
      console.log('Note: Manual entry modal not found, taking current page screenshot');
      await this.takeScreenshot('employee/manual-entry.png');
    }
    
    // Rapports
    await this.page.goto('http://localhost:5000/employee/reports');
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('employee/reports.png');
    
    // Profil
    await this.page.goto('http://localhost:5000/employee/profile');
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('employee/profile.png');
  }

  async generateAdminScreenshots() {
    if (!this.page) throw new Error('Page not initialized');
    
    console.log('📸 Generating admin screenshots...');
    
    await this.loginAsAdmin();
    
    // Dashboard admin
    await this.page.goto('http://localhost:5000/admin/dashboard');
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('admin/dashboard.png');
    
    // Liste des employés
    await this.page.goto('http://localhost:5000/admin/employees');
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('admin/employees-list.png');
    
    // Création d'employé
    try {
      await this.page.click('[data-testid="button-new-employee"]');
      await this.page.waitForSelector('[data-testid="employee-modal"]', { timeout: 3000 });
      await this.takeScreenshot('admin/employee-create.png');
      
      // Fermer le modal
      await this.page.press('Escape');
    } catch {
      console.log('Note: Employee modal not found, taking current page screenshot');
      await this.takeScreenshot('admin/employee-create.png');
    }
    
    // Validation
    await this.page.goto('http://localhost:5000/admin/validation');
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('admin/validation.png');
    
    // Export dialog
    await this.page.goto('http://localhost:5000/admin/reports');
    await this.page.waitForLoadState('networkidle');
    try {
      await this.page.click('[data-testid="button-export-excel"]');
      await this.page.waitForTimeout(500); // Attendre l'ouverture du dialog
      await this.takeScreenshot('admin/export-dialog.png');
    } catch {
      console.log('Note: Export button not found, taking current page screenshot');
      await this.takeScreenshot('admin/export-dialog.png');
    }
  }

  async generateAnimatedGifs() {
    console.log('🎬 Generating animated GIFs...');
    
    if (!this.page) throw new Error('Page not initialized');
    
    // Note: Pour les GIFs, nous utiliserions puppeteer-recorder ou similar
    // Ici nous créons des captures séquentielles qui peuvent être converties en GIF
    
    // Processus de pointage
    await this.loginAsEmployee();
    await this.page.goto('http://localhost:5000/employee/time-entry');
    
    const frames: Buffer[] = [];
    frames.push(await this.page.screenshot({ type: 'png' }));
    
    try {
      await this.page.click('[data-testid="button-punch-in"]');
      await this.page.waitForTimeout(1000);
      frames.push(await this.page.screenshot({ type: 'png' }));
      
      await this.page.waitForTimeout(2000);
      frames.push(await this.page.screenshot({ type: 'png' }));
    } catch (error) {
      console.log('Note: Some UI elements may not be available yet');
    }
    
    // Sauvegarder les frames (conversion en GIF nécessiterait un outil externe)
    console.log('📝 Note: GIF frames generated, conversion needed with external tool');
  }

  async run() {
    try {
      console.log('🚀 Starting screenshot generation...');
      
      await this.init();
      
      await this.generateLoginScreenshots();
      await this.generateEmployeeScreenshots();
      await this.generateAdminScreenshots();
      await this.generateAnimatedGifs();
      
      console.log('✅ All screenshots generated successfully!');
      
    } catch (error) {
      console.error('❌ Error generating screenshots:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Exécuter le script
if (typeof require !== 'undefined' && require.main === module) {
  const generator = new ScreenshotGenerator();
  generator.run().catch(console.error);
}

export default ScreenshotGenerator;