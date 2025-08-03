import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface UploadOptions {
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

interface UploadResult {
  success: boolean;
  avatarUrl?: string;
  logoUrl?: string;
  message: string;
}

export function useUpload(type: 'avatar' | 'logo', options: UploadOptions = {}) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      const formData = new FormData();
      formData.append(type, file);

      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total);
            setUploadProgress(progress);
            options.onProgress?.(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } else {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || 'Upload failed'));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during upload'));
        };

        // Add auth token
        const token = localStorage.getItem('token');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.open('POST', `/api/upload/${type}`);
        xhr.send(formData);
      });
    },
    onMutate: () => {
      setIsUploading(true);
      setUploadProgress(0);
    },
    onSuccess: (data) => {
      setIsUploading(false);
      setUploadProgress(100);
      
      const url = type === 'avatar' ? data.avatarUrl : data.logoUrl;
      if (url) {
        options.onSuccess?.(url);
      }

      // Invalidate relevant queries
      if (type === 'avatar') {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        queryClient.invalidateQueries({ queryKey: ['employee'] });
      }

      toast({
        title: "Upload réussi",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      setIsUploading(false);
      setUploadProgress(0);
      
      const errorMessage = error.message || 'Erreur lors de l\'upload';
      options.onError?.(errorMessage);

      toast({
        title: "Erreur d'upload",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (filename: string) => {
      const response = await apiClient.delete(`/api/upload/${type}s/${filename}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      if (type === 'avatar') {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        queryClient.invalidateQueries({ queryKey: ['employee'] });
      }

      toast({
        title: "Fichier supprimé",
        description: "Le fichier a été supprimé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de suppression",
        description: error.response?.data?.error || 'Erreur lors de la suppression',
        variant: "destructive",
      });
    },
  });

  // Direct upload method
  const upload = useCallback((file: File) => {
    uploadMutation.mutate(file);
  }, [uploadMutation]);

  // Delete file method
  const deleteFile = useCallback((filename: string) => {
    deleteMutation.mutate(filename);
  }, [deleteMutation]);

  // Reset state
  const reset = useCallback(() => {
    setUploadProgress(0);
    setIsUploading(false);
  }, []);

  return {
    upload,
    deleteFile,
    reset,
    isUploading,
    uploadProgress,
    isDeleting: deleteMutation.isPending,
    error: uploadMutation.error?.message || deleteMutation.error?.message,
  };
}

// Presigned URL upload hook (alternative method)
export function usePresignedUpload(type: 'avatar' | 'logo', options: UploadOptions = {}) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const getPresignedUrlMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/api/upload/presigned', { type });
      return response.data;
    },
  });

  const uploadToPresignedUrl = useCallback(async (file: File, uploadURL: string) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(progress);
          options.onProgress?.(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error('Upload to storage failed'));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during upload'));
      };

      xhr.open('PUT', uploadURL);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }, [options]);

  const upload = useCallback(async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Get presigned URL
      const { uploadURL, objectPath } = await getPresignedUrlMutation.mutateAsync();
      
      // Upload to presigned URL
      await uploadToPresignedUrl(file, uploadURL);
      
      setUploadProgress(100);
      setIsUploading(false);

      options.onSuccess?.(objectPath);

      // Invalidate relevant queries
      if (type === 'avatar') {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        queryClient.invalidateQueries({ queryKey: ['employee'] });
      }

      toast({
        title: "Upload réussi",
        description: "Le fichier a été uploadé avec succès",
      });

    } catch (error: any) {
      setIsUploading(false);
      setUploadProgress(0);
      
      const errorMessage = error.message || 'Erreur lors de l\'upload';
      options.onError?.(errorMessage);

      toast({
        title: "Erreur d'upload",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [getPresignedUrlMutation, uploadToPresignedUrl, options, type, queryClient, toast]);

  return {
    upload,
    isUploading,
    uploadProgress,
    error: getPresignedUrlMutation.error?.message,
  };
}

// Combined hook with retry logic
export function useRobustUpload(type: 'avatar' | 'logo', options: UploadOptions = {}) {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const standardUpload = useUpload(type, {
    ...options,
    onError: (error) => {
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        // Retry after a delay
        setTimeout(() => {
          // Could implement retry logic here
        }, 1000 * (retryCount + 1));
      } else {
        options.onError?.(error);
      }
    }
  });

  const presignedUpload = usePresignedUpload(type, options);

  // Try standard upload first, fallback to presigned URL
  const upload = useCallback(async (file: File) => {
    try {
      await standardUpload.upload(file);
    } catch (error) {
      console.warn('Standard upload failed, trying presigned URL...', error);
      await presignedUpload.upload(file);
    }
  }, [standardUpload, presignedUpload]);

  return {
    upload,
    deleteFile: standardUpload.deleteFile,
    reset: standardUpload.reset,
    isUploading: standardUpload.isUploading || presignedUpload.isUploading,
    uploadProgress: standardUpload.uploadProgress || presignedUpload.uploadProgress,
    isDeleting: standardUpload.isDeleting,
    error: standardUpload.error || presignedUpload.error,
    retryCount,
  };
}