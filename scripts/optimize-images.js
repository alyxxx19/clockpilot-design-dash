/**
 * Script d'optimisation des images pour la documentation
 * Compresse les PNG et optimise les GIFs
 */

import sharp from 'sharp';
import imagemin from 'imagemin';
import imageminPngquant from 'imagemin-pngquant';
import imageminGifsicle from 'imagemin-gifsicle';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR = 'docs/screenshots';
const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 800;
const MAX_FILE_SIZE = 500 * 1024; // 500KB

async function optimizeImage(inputPath, outputPath) {
  try {
    const ext = path.extname(inputPath).toLowerCase();
    
    if (ext === '.png') {
      // Optimiser PNG avec Sharp puis pngquant
      await sharp(inputPath)
        .resize(TARGET_WIDTH, TARGET_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png({ quality: 90 })
        .toFile(outputPath + '.temp');
      
      // Compression avancée avec pngquant
      const optimized = await imagemin([outputPath + '.temp'], {
        destination: path.dirname(outputPath),
        plugins: [
          imageminPngquant({
            quality: [0.6, 0.8]
          })
        ]
      });
      
      // Nettoyer le fichier temporaire
      await fs.unlink(outputPath + '.temp');
      
      return optimized[0];
    } else if (ext === '.gif') {
      // Optimiser GIF
      const optimized = await imagemin([inputPath], {
        destination: path.dirname(outputPath),
        plugins: [
          imageminGifsicle({
            optimizationLevel: 3,
            colors: 64
          })
        ]
      });
      
      return optimized[0];
    }
  } catch (error) {
    console.error(`Erreur lors de l'optimisation de ${inputPath}:`, error);
  }
}

async function processDirectory(dir) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      await processDirectory(fullPath);
    } else if (file.isFile() && (file.name.endsWith('.png') || file.name.endsWith('.gif'))) {
      console.log(`Optimisation de ${fullPath}...`);
      
      const originalStats = await fs.stat(fullPath);
      console.log(`Taille originale: ${(originalStats.size / 1024).toFixed(2)} KB`);
      
      await optimizeImage(fullPath, fullPath);
      
      const optimizedStats = await fs.stat(fullPath);
      console.log(`Taille optimisée: ${(optimizedStats.size / 1024).toFixed(2)} KB`);
      
      const reduction = ((originalStats.size - optimizedStats.size) / originalStats.size * 100).toFixed(2);
      console.log(`Réduction: ${reduction}%\n`);
    }
  }
}

async function main() {
  try {
    console.log('🖼️  Optimisation des images de documentation...');
    await processDirectory(SCREENSHOTS_DIR);
    console.log('✅ Optimisation terminée!');
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}