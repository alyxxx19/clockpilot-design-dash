import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, BarChart3, Calendar, Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Clock,
    title: 'Gestion du temps',
    description: 'Pointage simple et précis pour tous vos employés'
  },
  {
    icon: Users,
    title: 'Équipes',
    description: 'Gérez facilement les horaires de vos équipes'
  },
  {
    icon: BarChart3,
    title: 'Rapports',
    description: 'Analyses détaillées et tableaux de bord'
  },
  {
    icon: Calendar,
    title: 'Planning',
    description: 'Planification avancée des horaires de travail'
  },
  {
    icon: Shield,
    title: 'Sécurité',
    description: 'Données sécurisées et conformes RGPD'
  },
  {
    icon: CheckCircle,
    title: 'Simplicité',
    description: 'Interface intuitive et facile à utiliser'
  }
];

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Clock Pilot</span>
            </div>
            <Link to="/login">
              <Button variant="outline" className="font-medium">
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
            Gestion du temps
            <br />
            <span className="text-muted-foreground">simplifiée</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Clock Pilot vous aide à gérer efficacement le temps de travail de vos équipes 
            avec une interface moderne et intuitive. Pointage, planning et rapports en un seul endroit.
          </p>
          <div className="space-x-4">
            <Link to="/login">
              <Button size="lg" className="px-8 py-3 text-lg">
                Commencer gratuitement
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
              Voir la démo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Des fonctionnalités pensées pour simplifier la gestion du temps de travail
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border bg-card hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">Clock Pilot</span>
          </div>
          <p className="text-center text-muted-foreground mt-4">
            © 2024 Clock Pilot. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};