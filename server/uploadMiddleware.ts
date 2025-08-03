import multer from 'multer';
import sharp from 'sharp';
import mime from 'mime-types';
import { ObjectStorageService } from './objectStorage';
import { fallbackUploadService } from './fallbackUpload';

// File type validation
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const allowedLogoTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];

// Size limits
const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const LOGO_MAX_SIZE = 10 * 1024 * 1024; // 10MB

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
export const createFileFilter = (allowedTypes: string[], maxSize: number) => {
  return (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error(`Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`));
    }
    
    // Size will be checked by multer limits
    cb(null, true);
  };
};

// Avatar upload configuration
export const avatarUpload = multer({
  storage,
  limits: {
    fileSize: AVATAR_MAX_SIZE,
    files: 1,
  },
  fileFilter: createFileFilter(allowedImageTypes, AVATAR_MAX_SIZE),
});

// Logo upload configuration  
export const logoUpload = multer({
  storage,
  limits: {
    fileSize: LOGO_MAX_SIZE,
    files: 1,
  },
  fileFilter: createFileFilter(allowedLogoTypes, LOGO_MAX_SIZE),
});

// Image processing functions
export class ImageProcessor {
  static async processAvatar(buffer: Buffer, mimetype: string): Promise<Buffer> {
    // Skip processing for SVG files
    if (mimetype === 'image/svg+xml') {
      return buffer;
    }

    try {
      // Resize to 256x256 and optimize
      return await sharp(buffer)
        .resize(256, 256, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 }) // Convert to JPEG for consistency
        .toBuffer();
    } catch (error) {
      console.error('Error processing avatar:', error);
      throw new Error('Erreur lors du traitement de l\'image');
    }
  }

  static async processLogo(buffer: Buffer, mimetype: string): Promise<Buffer> {
    // Skip processing for SVG files
    if (mimetype === 'image/svg+xml') {
      return buffer;
    }

    try {
      // Resize maintaining aspect ratio, max 512px width/height
      const metadata = await sharp(buffer).metadata();
      
      let resizeOptions: any = {
        fit: 'inside',
        withoutEnlargement: true
      };

      // Determine dimensions
      if (metadata.width && metadata.height) {
        const maxDimension = Math.max(metadata.width, metadata.height);
        if (maxDimension > 512) {
          if (metadata.width > metadata.height) {
            resizeOptions.width = 512;
          } else {
            resizeOptions.height = 512;
          }
        }
      }

      return await sharp(buffer)
        .resize(resizeOptions)
        .png({ quality: 90 }) // Convert to PNG for logos
        .toBuffer();
    } catch (error) {
      console.error('Error processing logo:', error);
      throw new Error('Erreur lors du traitement du logo');
    }
  }
}

// Upload service
export class UploadService {
  private objectStorage: ObjectStorageService;

  constructor() {
    this.objectStorage = new ObjectStorageService();
  }

  async uploadAvatar(file: Express.Multer.File, userId: number): Promise<string> {
    try {
      // Try Object Storage first
      try {
        // Process the image
        const processedBuffer = await ImageProcessor.processAvatar(file.buffer, file.mimetype);
        
        // Generate filename
        const extension = 'jpg'; // Always save avatars as JPEG
        const filename = `avatar_${userId}_${Date.now()}.${extension}`;
        
        // Upload to object storage
        const objectPath = await this.objectStorage.uploadFile(
          processedBuffer,
          filename,
          'avatars',
          'image/jpeg'
        );

        return objectPath;
      } catch (objectStorageError) {
        console.warn('Object Storage unavailable, using fallback:', objectStorageError);
        
        // Fallback to local storage
        return await fallbackUploadService.uploadAvatar(file, userId);
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw new Error('Erreur lors de l\'upload de l\'avatar');
    }
  }

  async uploadLogo(file: Express.Multer.File, companyId?: string): Promise<string> {
    try {
      // Try Object Storage first
      try {
        // Process the image (skip for SVG)
        let processedBuffer: Buffer;
        let contentType: string;
        let extension: string;

        if (file.mimetype === 'image/svg+xml') {
          processedBuffer = file.buffer;
          contentType = 'image/svg+xml';
          extension = 'svg';
        } else {
          processedBuffer = await ImageProcessor.processLogo(file.buffer, file.mimetype);
          contentType = 'image/png';
          extension = 'png';
        }
        
        // Generate filename
        const filename = `logo_${companyId || 'default'}_${Date.now()}.${extension}`;
        
        // Upload to object storage
        const objectPath = await this.objectStorage.uploadFile(
          processedBuffer,
          filename,
          'logos',
          contentType
        );

        return objectPath;
      } catch (objectStorageError) {
        console.warn('Object Storage unavailable, using fallback:', objectStorageError);
        
        // Fallback to local storage
        return await fallbackUploadService.uploadLogo(file, companyId);
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      throw new Error('Erreur lors de l\'upload du logo');
    }
  }

  async deleteFile(objectPath: string): Promise<void> {
    try {
      // Try Object Storage first
      try {
        await this.objectStorage.deleteFile(objectPath);
      } catch (objectStorageError) {
        console.warn('Object Storage unavailable for deletion, using fallback:', objectStorageError);
        
        // Fallback to local storage
        await fallbackUploadService.deleteFile(objectPath);
      }
    } catch (error) {
      console.error('File deletion error:', error);
      throw new Error('Erreur lors de la suppression du fichier');
    }
  }

  // Generate presigned URL for direct upload (alternative method)
  async getUploadURL(type: 'avatar' | 'logo'): Promise<{ uploadURL: string; objectPath: string }> {
    try {
      const directory = type === 'avatar' ? 'avatars' : 'logos';
      return await this.objectStorage.getObjectEntityUploadURL(directory);
    } catch (error) {
      console.warn('Object Storage unavailable for presigned URL:', error);
      
      // For fallback, return a mock response (client would need to handle this)
      throw new Error('Presigned URLs not available in fallback mode. Use direct upload instead.');
    }
  }
}

// Error handling middleware
export const handleMulterError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Fichier trop volumineux',
        code: 'FILE_TOO_LARGE',
        maxSize: error.field === 'avatar' ? '5MB' : '10MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Trop de fichiers',
        code: 'TOO_MANY_FILES'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Champ de fichier inattendu',
        code: 'UNEXPECTED_FIELD'
      });
    }
  }
  
  if (error.message.includes('Type de fichier non autorisé')) {
    return res.status(400).json({
      error: error.message,
      code: 'INVALID_FILE_TYPE'
    });
  }
  
  console.error('Upload error:', error);
  res.status(500).json({
    error: 'Erreur lors de l\'upload',
    code: 'UPLOAD_ERROR'
  });
};

export default UploadService;