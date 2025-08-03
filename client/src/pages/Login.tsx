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
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        toast({
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté"
        });
        
        // Navigate to home, let App.tsx redirect based on role  
        navigate('/', { replace: true });
      } else {
        toast({
          title: "Erreur de connexion",
          description: result.error || "Email ou mot de passe incorrect",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    
    // Auto-submit the form for demo login
    setLoading(true);
    try {
      const result = await login(demoEmail, demoPassword);
      if (result.success) {
        toast({
          title: "Connexion démo réussie",
          description: "Vous êtes connecté avec un compte de démonstration"
        });
        
        // Navigate to home, let App.tsx redirect based on role
        navigate('/', { replace: true });
      } else {
        toast({
          title: "Erreur de connexion démo",
          description: result.error || "Impossible de se connecter avec le compte démo",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la connexion démo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
                disabled={loading}
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
                  onClick={() => handleDemoLogin('admin@clockpilot.com', 'password123')}
                  disabled={loading}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Compte Admin (admin@clockpilot.com)
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-sm"
                  onClick={() => handleDemoLogin('employee@clockpilot.com', 'password123')}
                  disabled={loading}
                >
                  <User className="w-4 h-4 mr-2" />
                  Compte Employé (employee@clockpilot.com)
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