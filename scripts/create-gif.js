/**
 * Script pour créer des GIFs à partir de séquences d'images
 * Utilise gifsicle pour l'optimisation
 */

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createGif(inputPattern, outputPath, options = {}) {
  const {
    delay = 100, // Délai entre frames en centisecondes
    colors = 64, // Nombre de couleurs
    width = 800, // Largeur max
    optimize = true
  } = options;
  
  return new Promise((resolve, reject) => {
    let command = `convert ${inputPattern} -delay ${delay} -loop 0`;
    
    if (width) {
      command += ` -resize ${width}x`;
    }
    
    command += ` "${outputPath}"`;
    
    if (optimize) {
      command += ` && gifsicle --optimize=3 --colors=${colors} "${outputPath}" -o "${outputPath}"`;
    }
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(outputPath);
      }
    });
  });
}

async function createWorkflowGifs() {
  const gifsDir = 'docs/screenshots/gifs';
  
  // Créer le dossier s'il n'existe pas
  await fs.mkdir(gifsDir, { recursive: true });
  
  console.log('🎬 Création des GIFs de workflow...');
  
  // Exemples de création de GIFs
  // Ces commandes seraient adaptées selon les séquences d'images disponibles
  
  const workflows = [
    {
      name: 'punch-process',
      description: 'Processus de pointage',
      frames: [
        'punch-step1.png',
        'punch-step2.png', 
        'punch-step3.png'
      ]
    },
    {
      name: 'validation-flow',
      description: 'Flux de validation',
      frames: [
        'validation-step1.png',
        'validation-step2.png',
        'validation-step3.png'
      ]
    },
    {
      name: 'drag-drop-planning',
      description: 'Drag & drop planning',
      frames: [
        'planning-step1.png',
        'planning-step2.png',
        'planning-step3.png'
      ]
    },
    {
      name: 'export-generation',
      description: 'Génération d\'export',
      frames: [
        'export-step1.png',
        'export-step2.png',
        'export-step3.png'
      ]
    }
  ];
  
  for (const workflow of workflows) {
    try {
      console.log(`📹 Création de ${workflow.name}.gif - ${workflow.description}`);
      
      // Pour le moment, créer un GIF placeholder
      // En production, on utiliserait les vraies séquences d'images
      const placeholderPath = path.join(gifsDir, `${workflow.name}.gif`);
      
      // Créer un GIF simple avec ImageMagick (si disponible)
      // Sinon, créer un fichier placeholder
      try {
        await createSimpleGif(placeholderPath, workflow.description);
        console.log(`✅ ${workflow.name}.gif créé`);
      } catch (error) {
        console.log(`⚠️  Création placeholder pour ${workflow.name}.gif`);
        await createPlaceholderGif(placeholderPath, workflow.description);
      }
      
    } catch (error) {
      console.error(`❌ Erreur pour ${workflow.name}:`, error.message);
    }
  }
  
  console.log('✅ GIFs de workflow créés!');
}

async function createSimpleGif(outputPath, description) {
  // Créer un GIF simple avec des frames de couleur unie
  return new Promise((resolve, reject) => {
    const command = `convert -size 400x300 xc:lightblue xc:lightgreen xc:lightblue -delay 100 -loop 0 "${outputPath}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(outputPath);
      }
    });
  });
}

async function createPlaceholderGif(outputPath, description) {
  // Créer un fichier texte de placeholder si ImageMagick n'est pas disponible
  const placeholder = `# ${path.basename(outputPath)}

${description}

Ce GIF sera généré automatiquement lors de la capture des workflows.

Pour générer les vrais GIFs :
1. Capturer les séquences d'actions avec Playwright
2. Convertir en GIF avec imagemagick ou ffmpeg
3. Optimiser avec gifsicle

Commande exemple :
convert frame*.png -delay 100 -loop 0 ${path.basename(outputPath)}
gifsicle --optimize=3 --colors=64 ${path.basename(outputPath)} -o ${path.basename(outputPath)}
`;

  await fs.writeFile(outputPath + '.md', placeholder);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createWorkflowGifs().catch(console.error);
}