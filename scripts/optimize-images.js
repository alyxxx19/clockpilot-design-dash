/**
 * Script d'optimisation des images pour la documentation
 * Compresse les PNG et optimise les GIFs
 */

import sharp from 'sharp';
import imageminModule from 'imagemin';
import imageminPngquantModule from 'imagemin-pngquant';
import imageminGifsicle from 'imagemin-gifsicle';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Handle different export patterns for downgraded dependencies
const imagemin = imageminModule.default || imageminModule;
const imageminPngquant = imageminPngquantModule.default || imageminPngquantModule;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 800;
const MAX_FILE_SIZE = 500 * 1024; // 500KB

async function optimizeImage(inputPath, outputPath) {
  try {
    const ext = path.extname(inputPath).toLowerCase();
    
    if (ext === '.png') {
      // Try Sharp + pngquant first, fallback to Sharp only if pngquant fails
      try {
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
      } catch (pngquantError) {
        // Fallback to Sharp-only optimization if pngquant fails
        console.warn(`pngquant failed for ${inputPath}, using Sharp-only optimization`);
        
        // Nettoyer le fichier temporaire si il existe
        try {
          await fs.unlink(outputPath + '.temp');
        } catch {}
        
        // Use a temporary output file to avoid Sharp input/output conflict
        const tempOptimized = outputPath + '.optimized';
        await sharp(inputPath)
          .resize(TARGET_WIDTH, TARGET_HEIGHT, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .png({ 
            quality: 80,
            compressionLevel: 9,
            effort: 10
          })
          .toFile(tempOptimized);
        
        // Replace original file with optimized version
        await fs.rename(tempOptimized, outputPath);
        
        return { outputPath };
      }
    } else if (ext === '.gif') {
      // Try gifsicle optimization, fallback to copy if it fails
      try {
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
      } catch (gifsicleError) {
        console.warn(`gifsicle failed for ${inputPath}, copying file without optimization`);
        await fs.copyFile(inputPath, outputPath);
        return { outputPath };
      }
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