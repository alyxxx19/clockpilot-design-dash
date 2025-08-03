import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UploadButton } from '@/components/ui/upload-button';
import { useUpload, useRobustUpload } from '@/hooks/useUpload';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Upload, 
  User, 
  Building, 
  Trash2, 
  RefreshCw,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';

export const FileUploadDemo: React.FC = () => {
  const { user } = useAuth();
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(
    user?.employee?.avatarUrl || null
  );
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);

  // Avatar upload hook
  const avatarUpload = useRobustUpload('avatar', {
    onSuccess: (url) => {
      setCurrentAvatarUrl(url);
      setSelectedAvatarFile(null);
    },
    onError: (error) => {
      console.error('Avatar upload error:', error);
    }
  });

  // Logo upload hook (admin only)
  const logoUpload = useUpload('logo', {
    onSuccess: (url) => {
      setCurrentLogoUrl(url);
      setSelectedLogoFile(null);
    },
    onError: (error) => {
      console.error('Logo upload error:', error);
    }
  });

  const handleAvatarUpload = () => {
    if (selectedAvatarFile) {
      avatarUpload.upload(selectedAvatarFile);
    }
  };

  const handleLogoUpload = () => {
    if (selectedLogoFile) {
      logoUpload.upload(selectedLogoFile);
    }
  };

  const handleDeleteAvatar = () => {
    if (currentAvatarUrl) {
      const filename = currentAvatarUrl.split('/').pop();
      if (filename) {
        avatarUpload.deleteFile(filename);
        setCurrentAvatarUrl(null);
      }
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Système d'Upload de Fichiers</h2>
        <p className="text-muted-foreground mt-2">
          Démonstration complète du système d'upload avec Object Storage
        </p>
      </div>

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Avatar Utilisateur
          </CardTitle>
          <CardDescription>
            Uploadez votre photo de profil (max 5MB, formats: JPG, PNG, WebP)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Avatar Display */}
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={currentAvatarUrl || undefined} />
              <AvatarFallback className="text-2xl">
                {user?.employee?.firstName?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {user?.employee?.firstName} {user?.employee?.lastName}
                </span>
                {currentAvatarUrl && (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Avatar configuré
                  </Badge>
                )}
              </div>
              
              {currentAvatarUrl && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDeleteAvatar}
                    disabled={avatarUpload.isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {avatarUpload.isDeleting ? 'Suppression...' : 'Supprimer'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Upload Interface */}
          <UploadButton
            type="avatar"
            maxSizeMB={5}
            onFileSelect={setSelectedAvatarFile}
            currentImageUrl={currentAvatarUrl || undefined}
            showPreview={true}
          />

          {/* Upload Controls */}
          {selectedAvatarFile && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="text-sm">
                  <p className="font-medium">{selectedAvatarFile.name}</p>
                  <p className="text-muted-foreground">
                    {(selectedAvatarFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleAvatarUpload}
                  disabled={avatarUpload.isUploading}
                  size="sm"
                >
                  {avatarUpload.isUploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      Upload... {avatarUpload.uploadProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" />
                      Uploader
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAvatarFile(null)}
                  disabled={avatarUpload.isUploading}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Upload Progress & Status */}
          {avatarUpload.isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Upload en cours...</span>
                <span>{avatarUpload.uploadProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${avatarUpload.uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {avatarUpload.error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {avatarUpload.error}
              {avatarUpload.retryCount > 0 && (
                <span className="text-muted-foreground">
                  (Tentative {avatarUpload.retryCount}/3)
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logo Section (Admin Only) */}
      {user?.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Logo Entreprise
              <Badge variant="secondary">Admin</Badge>
            </CardTitle>
            <CardDescription>
              Uploadez le logo de l'entreprise (max 10MB, formats: JPG, PNG, SVG)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Logo Display */}
            {currentLogoUrl && (
              <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-lg bg-muted/20">
                <img
                  src={currentLogoUrl}
                  alt="Logo entreprise"
                  className="max-h-20 max-w-40 object-contain"
                />
              </div>
            )}

            <UploadButton
              type="logo"
              maxSizeMB={10}
              onFileSelect={setSelectedLogoFile}
              currentImageUrl={currentLogoUrl || undefined}
              showPreview={true}
            />

            {/* Upload Controls */}
            {selectedLogoFile && (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <p className="font-medium">{selectedLogoFile.name}</p>
                    <p className="text-muted-foreground">
                      {(selectedLogoFile.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleLogoUpload}
                    disabled={logoUpload.isUploading}
                    size="sm"
                  >
                    {logoUpload.isUploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        Upload... {logoUpload.uploadProgress}%
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-1" />
                        Uploader
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedLogoFile(null)}
                    disabled={logoUpload.isUploading}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {logoUpload.isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Upload en cours...</span>
                  <span>{logoUpload.uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${logoUpload.uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {logoUpload.error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {logoUpload.error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Technical Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Techniques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Avatars</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Taille max: 5MB</li>
                <li>• Formats: JPG, PNG, WebP</li>
                <li>• Redimensionnement: 256x256px</li>
                <li>• Compression automatique</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Logos</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Taille max: 10MB</li>
                <li>• Formats: JPG, PNG, SVG</li>
                <li>• Ratio conservé</li>
                <li>• Accès admin uniquement</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Fonctionnalités</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Drag & drop</li>
                <li>• Preview en temps réel</li>
                <li>• Progress bar</li>
                <li>• Retry automatique</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Stockage</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Object Storage (Replit)</li>
                <li>• Fallback local (dev)</li>
                <li>• Cache optimisé</li>
                <li>• URLs sécurisées</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};