/**
 * Script pour lancer la génération de screenshots
 * Compatible avec Node.js et les packages installés
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runScreenshots() {
  console.log('🚀 Lancement de la génération de screenshots...');
  
  // Vérifier que le serveur est démarré
  console.log('📡 Vérification du serveur...');
  
  try {
    const response = await fetch('http://localhost:5000/health');
    if (!response.ok) {
      throw new Error('Server not responding');
    }
    console.log('✅ Serveur accessible');
  } catch (error) {
    console.log('⚠️  Serveur non accessible. Assurez-vous que ClockPilot est démarré sur le port 5000');
    console.log('   Commande: npm run dev');
    return;
  }
  
  // Lancer le script de génération
  const scriptPath = path.join(__dirname, 'generate-screenshots.ts');
  
  const child = spawn('npx', ['tsx', scriptPath], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  child.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Screenshots générés avec succès!');
      console.log('📁 Vérifiez le dossier docs/screenshots/');
      
      // Lancer l'optimisation des images
      console.log('🖼️  Optimisation des images...');
      const optimizeScript = path.join(__dirname, 'optimize-images.js');
      const optimizeChild = spawn('node', [optimizeScript], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      optimizeChild.on('close', (optimizeCode) => {
        if (optimizeCode === 0) {
          console.log('✅ Images optimisées avec succès!');
        } else {
          console.log('⚠️  Erreur lors de l\'optimisation des images');
        }
      });
      
    } else {
      console.log(`❌ Erreur lors de la génération (code: ${code})`);
    }
  });
  
  child.on('error', (error) => {
    console.error('❌ Erreur:', error.message);
  });
}

// Helper pour vérifier la santé du serveur
async function fetch(url) {
  const { default: https } = await import('https');
  const { default: http } = await import('http');
  const urlParts = new URL(url);
  
  return new Promise((resolve, reject) => {
    const client = urlParts.protocol === 'https:' ? https : http;
    
    const req = client.request({
      hostname: urlParts.hostname,
      port: urlParts.port || (urlParts.protocol === 'https:' ? 443 : 80),
      path: urlParts.pathname,
      method: 'GET',
      timeout: 5000
    }, (res) => {
      resolve({
        ok: res.statusCode >= 200 && res.statusCode < 300,
        status: res.statusCode
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    req.end();
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runScreenshots().catch(console.error);
}