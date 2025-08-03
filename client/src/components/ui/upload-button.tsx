import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  Check, 
  AlertCircle, 
  Image as ImageIcon,
  File,
  Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadButtonProps {
  onFileSelect: (file: File) => void;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxSize?: number;
  maxSizeMB?: number;
  type?: 'avatar' | 'logo' | 'file';
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  showPreview?: boolean;
  currentImageUrl?: string;
}

interface FileWithPreview extends File {
  preview?: string;
}

export const UploadButton: React.FC<UploadButtonProps> = ({
  onFileSelect,
  onUploadComplete,
  onUploadError,
  accept = 'image/*',
  maxSize,
  maxSizeMB = 5,
  type = 'file',
  disabled = false,
  className,
  children,
  showPreview = true,
  currentImageUrl
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [dragActive, setDragActive] = useState(false);

  // Calculate max size in bytes
  const maxSizeBytes = maxSize || maxSizeMB * 1024 * 1024;

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSizeBytes) {
      return `Le fichier est trop volumineux. Taille maximale: ${maxSizeMB}MB`;
    }

    if (accept && !accept.split(',').some(acceptType => {
      const trimmed = acceptType.trim();
      if (trimmed.includes('*')) {
        return file.type.includes(trimmed.replace('*', ''));
      }
      return file.type === trimmed;
    })) {
      return `Type de fichier non accepté. Types autorisés: ${accept}`;
    }

    return null;
  }, [accept, maxSizeBytes, maxSizeMB]);

  // Create preview for image files
  const createPreview = useCallback((file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      onUploadError?.(error);
      setUploadStatus('error');
      return;
    }

    const fileWithPreview = Object.assign(file, { preview: undefined });
    setSelectedFile(fileWithPreview);
    setUploadStatus('idle');
    setUploadProgress(0);

    if (showPreview) {
      createPreview(file);
    }

    onFileSelect(file);
  }, [validateFile, onFileSelect, showPreview, createPreview, onUploadError]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(currentImageUrl || null);
    setUploadProgress(0);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Simulate upload progress (would be replaced with actual upload logic)
  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadStatus('success');
          onUploadComplete?.('/fake-url/' + selectedFile?.name);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'avatar':
        return <Camera className="h-4 w-4" />;
      case 'logo':
        return <ImageIcon className="h-4 w-4" />;
      default:
        return <Upload className="h-4 w-4" />;
    }
  };

  // Get accept string based on type
  const getAccept = () => {
    switch (type) {
      case 'avatar':
        return 'image/jpeg,image/png,image/webp';
      case 'logo':
        return 'image/jpeg,image/png,image/svg+xml';
      default:
        return accept;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Button/Drop Zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        data-testid={`upload-button-${type}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAccept()}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
          data-testid={`file-input-${type}`}
        />
        
        <div className="flex flex-col items-center gap-2">
          {getIcon()}
          {children || (
            <>
              <p className="text-sm text-muted-foreground">
                Cliquez ou glissez-déposez votre fichier ici
              </p>
              <p className="text-xs text-muted-foreground">
                Max {maxSizeMB}MB • {getAccept().split(',').join(', ')}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Preview & Status */}
      {(selectedFile || preview) && showPreview && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Image Preview */}
              {preview && (
                <div className="flex-shrink-0">
                  <img
                    src={preview}
                    alt="Preview"
                    className={cn(
                      "rounded-lg object-cover",
                      type === 'avatar' ? "w-16 h-16" : "w-20 h-20"
                    )}
                  />
                </div>
              )}

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium truncate">
                    {selectedFile?.name || 'Image actuelle'}
                  </span>
                  {selectedFile && (
                    <Badge variant="outline" className="text-xs">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)}MB
                    </Badge>
                  )}
                </div>

                {/* Progress Bar */}
                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Upload en cours... {uploadProgress}%
                    </p>
                  </div>
                )}

                {/* Status */}
                {uploadStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Upload réussi!</span>
                  </div>
                )}

                {uploadStatus === 'error' && (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Erreur d'upload</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {selectedFile && !isUploading && uploadStatus !== 'success' && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      simulateUpload();
                    }}
                    disabled={disabled}
                    data-testid="button-upload"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                  }}
                  disabled={disabled || isUploading}
                  data-testid="button-clear"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};