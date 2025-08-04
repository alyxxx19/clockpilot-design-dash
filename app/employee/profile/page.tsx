'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Camera, 
  Shield, 
  Settings, 
  Download, 
  Trash2, 
  Eye, 
  EyeOff,
  Phone,
  Mail,
  MapPin,
  Globe,
  Bell,
  Moon,
  Sun,
  Smartphone,
  Monitor,
  Save,
  Upload,
  RefreshCw,
  Lock,
  Key,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as z from 'zod';

// Basic UI Components for Next.js (in a real app, these would be from shadcn/ui)
const Tabs = ({ defaultValue, children, onValueChange }: any) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onValueChange?.(value);
  };

  return (
    <div className="w-full">
      {React.Children.map(children, child => 
        React.cloneElement(child, { activeTab, onTabChange: handleTabChange })
      )}
    </div>
  );
};

const TabsList = ({ children, activeTab, onTabChange }: any) => (
  <div className="inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500">
    {React.Children.map(children, child => 
      React.cloneElement(child, { activeTab, onTabChange })
    )}
  </div>
);

const TabsTrigger = ({ value, children, activeTab, onTabChange }: any) => (
  <button
    onClick={() => onTabChange(value)}
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
      activeTab === value 
        ? 'bg-white text-gray-950 shadow-sm' 
        : 'text-gray-600 hover:text-gray-900'
    }`}
  >
    {children}
  </button>
);

const TabsContent = ({ value, children, activeTab }: any) => (
  activeTab === value ? (
    <div className="mt-6 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
      {children}
    </div>
  ) : null
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col space-y-1.5 p-6 pb-4">{children}</div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);

const CardDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-gray-600">{children}</p>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary',
  size = 'default',
  className = '',
  ...props 
}: any) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-gray-200 bg-white hover:bg-gray-50',
    ghost: 'hover:bg-gray-100'
  };
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3',
    lg: 'h-11 px-8'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className = '', ...props }: any) => (
  <input
    className={`flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

const Label = ({ children, className = '', ...props }: any) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>
    {children}
  </label>
);

const Avatar = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>
    {children}
  </div>
);

const AvatarImage = ({ src, alt = '', className = '' }: { src?: string; alt?: string; className?: string }) => (
  src ? <img src={src} alt={alt} className={`aspect-square h-full w-full object-cover ${className}`} /> : null
);

const AvatarFallback = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex h-full w-full items-center justify-center rounded-full bg-gray-100 ${className}`}>
    {children}
  </div>
);

const Switch = ({ checked, onCheckedChange, disabled = false }: any) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange?.(!checked)}
    disabled={disabled}
    className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
      checked ? 'bg-blue-600' : 'bg-gray-200'
    }`}
  >
    <div className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
      checked ? 'translate-x-5' : 'translate-x-0'
    }`} />
  </button>
);

const Select = ({ value, onValueChange, children, disabled = false }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>{value || 'Sélectionner...'}</span>
        <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          {React.Children.map(children, child => 
            React.cloneElement(child, { 
              onSelect: (val: string) => {
                onValueChange(val);
                setIsOpen(false);
              }
            })
          )}
        </div>
      )}
    </div>
  );
};

const SelectItem = ({ value, children, onSelect }: any) => (
  <button
    type="button"
    onClick={() => onSelect(value)}
    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
  >
    {children}
  </button>
);

const Badge = ({ children, variant = 'default', className = '' }: any) => {
  const variants = {
    default: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    destructive: 'bg-red-100 text-red-800'
  };
  
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Alert = ({ children, variant = 'default', className = '' }: any) => {
  const variants = {
    default: 'border-gray-200 bg-white text-gray-950',
    destructive: 'border-red-200 bg-red-50 text-red-800'
  };
  
  return (
    <div className={`relative w-full rounded-lg border p-4 ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

const AlertDescription = ({ children }: { children: React.ReactNode }) => (
  <div className="text-sm">{children}</div>
);

// Toast simulation
const useToast = () => ({
  toast: ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
    console.log(`Toast: ${title}${description ? ` - ${description}` : ''}`);
    // In a real Next.js app, you'd use a proper toast library
  }
});

// Validation schemas
const personalInfoSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  address: z.string().optional()
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string().min(1, 'Confirmation requise')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"]
});

// Mock user data - In real app, this would come from auth context
const mockUser = {
  id: 1,
  email: 'marie.dubois@clockpilot.fr',
  firstName: 'Marie',
  lastName: 'Dubois',
  phone: '+33 6 12 34 56 78',
  address: '123 Rue de la République, 75001 Paris',
  avatarUrl: null,
  isLdapUser: false,
  preferences: {
    language: 'fr',
    emailNotifications: true,
    pushNotifications: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    theme: 'light'
  },
  sessions: [
    { id: '1', device: 'Chrome - Windows', location: 'Paris, France', lastActive: new Date(), current: true },
    { id: '2', device: 'Mobile - iOS', location: 'Paris, France', lastActive: new Date(Date.now() - 86400000), current: false }
  ]
};

export default function EmployeeProfile() {
  const { toast } = useToast();
  const [user, setUser] = useState(mockUser);
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || '',
    address: user.address || ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [preferences, setPreferences] = useState(user.preferences);

  // Handle avatar file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximale est de 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Upload avatar
  const handleAvatarUpload = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUser(prev => ({ ...prev, avatarUrl: previewUrl }));
      setSelectedFile(null);
      setPreviewUrl(null);
      
      toast({
        title: "Photo mise à jour",
        description: "Votre photo de profil a été mise à jour avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur d'upload",
        description: "Impossible de mettre à jour la photo",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  // Save personal info
  const handleSavePersonalInfo = async () => {
    try {
      personalInfoSchema.parse(personalInfo);
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUser(prev => ({ ...prev, ...personalInfo }));
      
      toast({
        title: "Informations mises à jour",
        description: "Vos informations personnelles ont été sauvegardées"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erreur de validation",
          description: error.errors[0].message,
          variant: "destructive"
        });
      }
    }
    setLoading(false);
  };

  // Change password
  const handleChangePassword = async () => {
    try {
      passwordSchema.parse(passwordForm);
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été modifié avec succès"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erreur de validation",
          description: error.errors[0].message,
          variant: "destructive"
        });
      }
    }
    setLoading(false);
  };

  // Save preferences
  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUser(prev => ({ ...prev, preferences }));
      
      toast({
        title: "Préférences sauvegardées",
        description: "Vos préférences ont été mises à jour"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les préférences",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  // Export user data (GDPR)
  const handleExportData = async () => {
    setLoading(true);
    try {
      // Simulate export generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const userData = {
        profile: user,
        exportDate: new Date().toISOString(),
        note: "Export des données personnelles conformément au RGPD"
      };
      
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mes-donnees-clockpilot-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export terminé",
        description: "Vos données ont été téléchargées"
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      return;
    }
    
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Compte supprimé",
        description: "Votre compte a été supprimé avec succès"
      });
      
      // In real app, redirect to login
      window.location.href = '/login';
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le compte",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-gray-600">
            Gérez vos informations personnelles et vos préférences
          </p>
        </div>

        {/* Profile Tabs */}
        <Tabs defaultValue="personal" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Personnel
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Sécurité
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Préférences
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Données
            </TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal">
            <div className="space-y-6">
              {/* Avatar Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Photo de profil</CardTitle>
                  <CardDescription>
                    Uploadez une photo de profil pour personnaliser votre compte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={previewUrl || user.avatarUrl || undefined} />
                      <AvatarFallback className="text-2xl">
                        {user.firstName[0]}{user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-4">
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="avatar-upload"
                        />
                        <label htmlFor="avatar-upload">
                          <Button variant="outline" className="cursor-pointer">
                            <Camera className="h-4 w-4 mr-2" />
                            Changer la photo
                          </Button>
                        </label>
                      </div>
                      
                      {selectedFile && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                          <div className="flex-1 text-sm">
                            <p className="font-medium">{selectedFile.name}</p>
                            <p className="text-gray-600">
                              {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>
                          <Button 
                            onClick={handleAvatarUpload}
                            disabled={loading}
                            size="sm"
                          >
                            {loading ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                Upload...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-1" />
                                Sauvegarder
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFile(null);
                              setPreviewUrl(null);
                            }}
                          >
                            Annuler
                          </Button>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500">
                        JPG, PNG ou WebP. Taille max: 5MB. Résolution recommandée: 300x300px.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>
                    Vos informations de base utilisées dans l'application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input
                        id="firstName"
                        value={personalInfo.firstName}
                        onChange={(e: any) => setPersonalInfo(prev => ({ ...prev, firstName: e.target.value }))}
                        disabled={user.isLdapUser}
                      />
                      {user.isLdapUser && (
                        <p className="text-xs text-gray-500">
                          Géré par l'annuaire LDAP
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        value={personalInfo.lastName}
                        onChange={(e: any) => setPersonalInfo(prev => ({ ...prev, lastName: e.target.value }))}
                        disabled={user.isLdapUser}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={personalInfo.email}
                        onChange={(e: any) => setPersonalInfo(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-10"
                        disabled={user.isLdapUser}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={personalInfo.phone}
                        onChange={(e: any) => setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
                        className="pl-10"
                        placeholder="+33 6 12 34 56 78"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="address"
                        value={personalInfo.address}
                        onChange={(e: any) => setPersonalInfo(prev => ({ ...prev, address: e.target.value }))}
                        className="pl-10"
                        placeholder="123 Rue de la République, 75001 Paris"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button onClick={handleSavePersonalInfo} disabled={loading}>
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Sauvegarder
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              {/* Change Password */}
              <Card>
                <CardHeader>
                  <CardTitle>Changer le mot de passe</CardTitle>
                  <CardDescription>
                    Mettez à jour votre mot de passe pour sécuriser votre compte
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e: any) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e: any) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Minimum 8 caractères avec majuscules, minuscules et chiffres
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e: any) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button onClick={handleChangePassword} disabled={loading}>
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Modification...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Changer le mot de passe
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 2FA Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Authentification à deux facteurs (2FA)</CardTitle>
                  <CardDescription>
                    Renforcez la sécurité de votre compte avec la double authentification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Authentification par SMS</p>
                        <p className="text-sm text-gray-600">
                          Recevez un code par SMS lors de la connexion
                        </p>
                      </div>
                    </div>
                    <Badge variant="warning">Bientôt disponible</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Active Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle>Sessions actives</CardTitle>
                  <CardDescription>
                    Gérez les appareils connectés à votre compte
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Monitor className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{session.device}</p>
                            {session.current && (
                              <Badge variant="success">Session actuelle</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {session.location} • Dernière activité: {format(session.lastActive, 'PPp', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      {!session.current && (
                        <Button variant="outline" size="sm">
                          Déconnecter
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <div className="space-y-6">
              {/* Language & Region */}
              <Card>
                <CardHeader>
                  <CardTitle>Langue et région</CardTitle>
                  <CardDescription>
                    Personnalisez l'affichage selon vos préférences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Langue</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Select
                          value={preferences.language === 'fr' ? 'Français' : 'English'}
                          onValueChange={(value: string) => 
                            setPreferences(prev => ({ 
                              ...prev, 
                              language: value === 'Français' ? 'fr' : 'en' 
                            }))
                          }
                        >
                          <SelectItem value="Français">Français</SelectItem>
                          <SelectItem value="English">English</SelectItem>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Format de date</Label>
                      <Select
                        value={preferences.dateFormat}
                        onValueChange={(value: string) => 
                          setPreferences(prev => ({ ...prev, dateFormat: value }))
                        }
                      >
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Format d'heure</Label>
                    <Select
                      value={preferences.timeFormat}
                      onValueChange={(value: string) => 
                        setPreferences(prev => ({ ...prev, timeFormat: value }))
                      }
                    >
                      <SelectItem value="24h">24 heures (14:30)</SelectItem>
                      <SelectItem value="12h">12 heures (2:30 PM)</SelectItem>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Choisissez comment vous souhaitez être notifié
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Notifications par email</p>
                        <p className="text-sm text-gray-600">
                          Recevez des emails pour les mises à jour importantes
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked: boolean) => 
                        setPreferences(prev => ({ ...prev, emailNotifications: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Notifications push</p>
                        <p className="text-sm text-gray-600">
                          Notifications en temps réel dans le navigateur
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.pushNotifications}
                      onCheckedChange={(checked: boolean) => 
                        setPreferences(prev => ({ ...prev, pushNotifications: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Theme */}
              <Card>
                <CardHeader>
                  <CardTitle>Apparence</CardTitle>
                  <CardDescription>
                    Personnalisez l'apparence de l'application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {preferences.theme === 'light' ? (
                        <Sun className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Moon className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium">Thème sombre</p>
                        <p className="text-sm text-gray-600">
                          Interface sombre pour réduire la fatigue oculaire
                        </p>
                      </div>
                    </div>
                    <Badge variant="warning">Bientôt disponible</Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="pt-4">
                <Button onClick={handleSavePreferences} disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder les préférences
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data">
            <div className="space-y-6">
              {/* Export Data */}
              <Card>
                <CardHeader>
                  <CardTitle>Exporter mes données</CardTitle>
                  <CardDescription>
                    Téléchargez toutes vos données personnelles (conformité RGPD)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        L'export inclut vos informations personnelles, historique de pointages, 
                        et toutes les données associées à votre compte.
                      </AlertDescription>
                    </Alert>
                    
                    <Button onClick={handleExportData} disabled={loading}>
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger mes données
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Delete Account */}
              <Card>
                <CardHeader>
                  <CardTitle>Supprimer mon compte</CardTitle>
                  <CardDescription>
                    Suppression définitive de votre compte et de toutes vos données
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Cette action est irréversible. Toutes vos données seront 
                        définitivement supprimées de nos serveurs.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Avant de supprimer votre compte :
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1 ml-4">
                        <li>• Exportez vos données si nécessaire</li>
                        <li>• Terminez vos projets en cours</li>
                        <li>• Prévenez votre équipe si vous êtes manager</li>
                      </ul>
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAccount}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Suppression...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer définitivement mon compte
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}