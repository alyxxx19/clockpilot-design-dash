import React from 'react';
import { AdminSidebar } from '@/components/layouts/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Settings as SettingsIcon,
  Building,
  Clock,
  Mail,
  Shield,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const Settings: React.FC = () => {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Paramètres sauvegardés",
      description: "Les modifications ont été enregistrées avec succès.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      {/* Main Content */}
      <main className="ml-64 min-h-screen p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground mt-1">Configuration générale du système</p>
        </div>

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="company">Entreprise</TabsTrigger>
            <TabsTrigger value="work-time">Horaires</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informations de l'entreprise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nom de l'entreprise</Label>
                    <Input id="companyName" defaultValue="Clock Pilot Industries" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siret">SIRET</Label>
                    <Input id="siret" defaultValue="12345678901234" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Textarea id="address" defaultValue="123 Rue de l'Innovation&#10;75001 Paris, France" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" defaultValue="01 23 45 67 89" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue="contact@clockpilot.com" />
                  </div>
                </div>
                <Button onClick={handleSave}>Sauvegarder les informations</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="work-time" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Configuration des horaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Heure de début standard</Label>
                    <Input id="startTime" type="time" defaultValue="08:00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Heure de fin standard</Label>
                    <Input id="endTime" type="time" defaultValue="17:00" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Jours de travail</h3>
                  <div className="grid grid-cols-7 gap-4">
                    {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Switch id={day} defaultChecked={!['Samedi', 'Dimanche'].includes(day)} />
                        <Label htmlFor={day} className="text-sm">{day}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="breakDuration">Durée de pause (minutes)</Label>
                    <Input id="breakDuration" type="number" defaultValue="60" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overtimeRate">Taux heures supplémentaires</Label>
                    <Select defaultValue="1.5">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1.25">+25%</SelectItem>
                        <SelectItem value="1.5">+50%</SelectItem>
                        <SelectItem value="2">+100%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button onClick={handleSave}>Sauvegarder les horaires</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Paramètres de notification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notifications de retard</Label>
                      <p className="text-sm text-muted-foreground">
                        Envoyer une notification en cas de retard d'un employé
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notifications d'absence</Label>
                      <p className="text-sm text-muted-foreground">
                        Alerter en cas d'absence non déclarée
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Rappels de pointage</Label>
                      <p className="text-sm text-muted-foreground">
                        Rappeler aux employés de pointer en fin de journée
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Rapports hebdomadaires</Label>
                      <p className="text-sm text-muted-foreground">
                        Envoyer un résumé hebdomadaire automatiquement
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notificationEmail">Email de notification</Label>
                  <Input id="notificationEmail" defaultValue="admin@clockpilot.com" />
                </div>
                
                <Button onClick={handleSave}>Sauvegarder les notifications</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Paramètres de sécurité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Authentification à deux facteurs</Label>
                      <p className="text-sm text-muted-foreground">
                        Exiger une double authentification pour les administrateurs
                      </p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Expiration des sessions</Label>
                      <p className="text-sm text-muted-foreground">
                        Déconnecter automatiquement après inactivité
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Durée de session (heures)</Label>
                    <Input id="sessionTimeout" type="number" defaultValue="8" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passwordPolicy">Politique de mot de passe</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Faible (6 caractères min)</SelectItem>
                        <SelectItem value="medium">Moyenne (8 caractères, majuscules)</SelectItem>
                        <SelectItem value="high">Élevée (12 caractères, symboles)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button onClick={handleSave}>Sauvegarder la sécurité</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestion des utilisateurs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-inscription des employés</Label>
                      <p className="text-sm text-muted-foreground">
                        Permettre aux employés de créer leur compte
                      </p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Validation des comptes</Label>
                      <p className="text-sm text-muted-foreground">
                        Exiger une validation admin pour les nouveaux comptes
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultRole">Rôle par défaut</Label>
                  <Select defaultValue="employee">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employé</SelectItem>
                      <SelectItem value="supervisor">Superviseur</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={handleSave}>Sauvegarder les paramètres</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};