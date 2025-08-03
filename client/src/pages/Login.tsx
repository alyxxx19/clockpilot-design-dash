import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un rôle",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const success = await login(email, password, selectedRole);
      if (success) {
        toast({
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté"
        });
        navigate(selectedRole === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
      } else {
        toast({
          title: "Erreur de connexion",
          description: "Email ou mot de passe incorrect",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string, role: UserRole) => {
    setEmail(demoEmail);
    setPassword('demo');
    setSelectedRole(role);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">Clock Pilot</span>
          </Link>
          <p className="mt-2 text-muted-foreground">Connectez-vous à votre espace</p>
        </div>

        {/* Role Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Choisissez votre rôle</Label>
          <div className="grid grid-cols-2 gap-4">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedRole === 'admin' ? 'ring-2 ring-primary bg-accent' : ''
              }`}
              onClick={() => setSelectedRole('admin')}
            >
              <CardContent className="p-4 text-center">
                <Shield className="w-8 h-8 mx-auto mb-2 text-foreground" />
                <h3 className="font-medium text-card-foreground">Administrateur</h3>
                <p className="text-sm text-muted-foreground mt-1">Gestion complète</p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedRole === 'employee' ? 'ring-2 ring-primary bg-accent' : ''
              }`}
              onClick={() => setSelectedRole('employee')}
            >
              <CardContent className="p-4 text-center">
                <User className="w-8 h-8 mx-auto mb-2 text-foreground" />
                <h3 className="font-medium text-card-foreground">Employé</h3>
                <p className="text-sm text-muted-foreground mt-1">Saisie des heures</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Connexion</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="mt-1"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !selectedRole}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>

            {/* Demo Buttons */}
            <div className="mt-6 space-y-2">
              <p className="text-sm text-muted-foreground text-center">Comptes de démonstration :</p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full text-sm"
                  onClick={() => handleDemoLogin('demo-admin@clockpilot.com', 'admin')}
                >
                  demo-admin@clockpilot.com
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-sm"
                  onClick={() => handleDemoLogin('demo-employee@clockpilot.com', 'employee')}
                >
                  demo-employee@clockpilot.com
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};