import React, { useState } from 'react';
import { User, Bell, Lock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+33 6 12 34 56 78',
    department: 'Développement',
    position: 'Développeur Frontend'
  });

  const [notifications, setNotifications] = useState({
    emailReminders: true,
    pushNotifications: true,
    weeklyReports: false,
    taskDeadlines: true
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileSave = () => {
    toast({
      title: "Profil mis à jour",
      description: "Vos informations ont été enregistrées avec succès",
    });
  };

  const handleNotificationSave = () => {
    toast({
      title: "Préférences sauvegardées",
      description: "Vos préférences de notification ont été mises à jour",
    });
  };

  const handlePasswordChange = () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Mot de passe modifié",
      description: "Votre mot de passe a été mis à jour avec succès",
    });

    setPasswords({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  // Réinitialiser les préférences
  const handleResetPreferences = () => {
    setNotifications({
      emailReminders: true,
      pushNotifications: true,
      weeklyReports: false,
      taskDeadlines: true
    });
    toast({
      title: "Préférences réinitialisées",
      description: "Les paramètres par défaut ont été restaurés",
    });
  };

  // Exporter les données
  const handleExportData = () => {
    toast({
      title: "Export en cours",
      description: "Vos données personnelles sont en cours d'export",
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground">Gérez vos informations personnelles et préférences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informations du profil */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Informations du profil</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="department">Département</Label>
                <Input
                  id="department"
                  value={profile.department}
                  onChange={(e) => setProfile(prev => ({ ...prev, department: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="position">Poste</Label>
                <Input
                  id="position"
                  value={profile.position}
                  onChange={(e) => setProfile(prev => ({ ...prev, position: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <Button onClick={handleProfileSave} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </Button>
            </CardContent>
          </Card>

          {/* Préférences de notification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Rappels par email</p>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des rappels pour les pointages
                  </p>
                </div>
                <Switch
                  checked={notifications.emailReminders}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, emailReminders: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notifications push</p>
                  <p className="text-sm text-muted-foreground">
                    Notifications en temps réel sur l'application
                  </p>
                </div>
                <Switch
                  checked={notifications.pushNotifications}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, pushNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Rapports hebdomadaires</p>
                  <p className="text-sm text-muted-foreground">
                    Recevoir un résumé de vos heures chaque semaine
                  </p>
                </div>
                <Switch
                  checked={notifications.weeklyReports}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, weeklyReports: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Échéances des tâches</p>
                  <p className="text-sm text-muted-foreground">
                    Être alerté des tâches qui arrivent à échéance
                  </p>
                </div>
                <Switch
                  checked={notifications.taskDeadlines}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, taskDeadlines: checked }))
                  }
                />
              </div>

              <Button onClick={handleNotificationSave} variant="outline" className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder les préférences
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Changement de mot de passe */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Sécurité</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md space-y-4">
              <div>
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <Button 
                onClick={handlePasswordChange}
                disabled={!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword}
              >
                <Lock className="mr-2 h-4 w-4" />
                Changer le mot de passe
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informations sur le compte */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Informations du compte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-muted-foreground">Type de compte</p>
                <p className="font-medium">Employé</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date de création</p>
                <p className="font-medium">15 janvier 2024</p>
              </div>
              <div>
                <p className="text-muted-foreground">Dernière connexion</p>
                <p className="font-medium">Aujourd'hui à 08:30</p>
              </div>
              <div>
                <p className="text-muted-foreground">Statut</p>
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Actif
                </span>
              </div>
            </div>
              
              <div className="pt-4 border-t border-border">
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={handleResetPreferences}>
                    Réinitialiser les préférences
                  </Button>
                  <Button variant="outline" onClick={handleExportData}>
                    Exporter mes données
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};