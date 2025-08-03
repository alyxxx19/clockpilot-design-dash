import fs from 'fs/promises';
import path from 'path';
import { ImageProcessor } from './uploadMiddleware';

/**
 * Fallback upload service for local development when Object Storage is not available
 */
export class FallbackUploadService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadsDir();
  }

  private async ensureUploadsDir() {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(path.join(this.uploadsDir, 'avatars'), { recursive: true });
      await fs.mkdir(path.join(this.uploadsDir, 'logos'), { recursive: true });
    }
  }

  async uploadAvatar(file: Express.Multer.File, userId: number): Promise<string> {
    try {
      await this.ensureUploadsDir();
      
      // Process the image
      const processedBuffer = await ImageProcessor.processAvatar(file.buffer, file.mimetype);
      
      // Generate filename
      const extension = 'jpg'; // Always save avatars as JPEG
      const filename = `avatar_${userId}_${Date.now()}.${extension}`;
      const filePath = path.join(this.uploadsDir, 'avatars', filename);
      
      // Save file
      await fs.writeFile(filePath, processedBuffer);
      
      // Return public URL
      return `/uploads/avatars/${filename}`;
    } catch (error) {
      console.error('Fallback avatar upload error:', error);
      throw new Error('Erreur lors de l\'upload de l\'avatar');
    }
  }

  async uploadLogo(file: Express.Multer.File, companyId?: string): Promise<string> {
    try {
      await this.ensureUploadsDir();
      
      // Process the image (skip for SVG)
      let processedBuffer: Buffer;
      let extension: string;

      if (file.mimetype === 'image/svg+xml') {
        processedBuffer = file.buffer;
        extension = 'svg';
      } else {
        processedBuffer = await ImageProcessor.processLogo(file.buffer, file.mimetype);
        extension = 'png';
      }
      
      // Generate filename
      const filename = `logo_${companyId || 'default'}_${Date.now()}.${extension}`;
      const filePath = path.join(this.uploadsDir, 'logos', filename);
      
      // Save file
      await fs.writeFile(filePath, processedBuffer);
      
      // Return public URL
      return `/uploads/logos/${filename}`;
    } catch (error) {
      console.error('Fallback logo upload error:', error);
      throw new Error('Erreur lors de l\'upload du logo');
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      // Convert URL path to file system path
      const relativePath = filePath.startsWith('/uploads/') 
        ? filePath.substring('/uploads/'.length)
        : filePath;
      
      const fullPath = path.join(this.uploadsDir, relativePath);
      
      // Check if file exists
      try {
        await fs.access(fullPath);
        await fs.unlink(fullPath);
      } catch (error) {
        console.warn('File not found for deletion:', fullPath);
      }
    } catch (error) {
      console.error('Fallback file deletion error:', error);
      throw new Error('Erreur lors de la suppression du fichier');
    }
  }

  // Cleanup old files (can be called periodically)
  async cleanupOldFiles(maxAgeHours: number = 24 * 7): Promise<void> {
    try {
      const maxAge = Date.now() - (maxAgeHours * 60 * 60 * 1000);
      
      for (const subdir of ['avatars', 'logos']) {
        const dir = path.join(this.uploadsDir, subdir);
        
        try {
          const files = await fs.readdir(dir);
          
          for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = await fs.stat(filePath);
            
            if (stats.mtime.getTime() < maxAge) {
              await fs.unlink(filePath);
              console.log(`Cleaned up old file: ${filePath}`);
            }
          }
        } catch (error) {
          console.warn(`Failed to cleanup directory ${dir}:`, error);
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// Export singleton instance
export const fallbackUploadService = new FallbackUploadService();