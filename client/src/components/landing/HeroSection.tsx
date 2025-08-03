import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const HeroSection: React.FC = () => {
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800 border-blue-200">
            🇫🇷 Conforme au droit du travail français
          </Badge>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Enfin un planning qui marche :<br />
            <span className="text-blue-600">fini les tableaux Excel</span><br />
            et les emails sans fin
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            ClockPilot simplifie la gestion des plannings de vos équipes. 
            Planification visuelle, validation automatique et conformité légale garantie.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/login">
              <Button 
                size="lg" 
                className="px-8 py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg"
                data-testid="button-free-trial"
              >
                Essai gratuit 14 jours
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg font-semibold border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
              data-testid="button-demo"
            >
              Voir la démo 2min
            </Button>
          </div>
        </div>
        
        {/* Hero Image Placeholder */}
        <div className="mt-16 relative">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Planning Équipe</h3>
                <div className="text-sm bg-white/20 px-3 py-1 rounded-full">Semaine 45</div>
              </div>
              <div className="grid grid-cols-7 gap-2 text-sm">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                  <div key={day} className="text-center font-medium">{day}</div>
                ))}
                {Array.from({ length: 7 }, (_, i) => (
                  <div key={i} className="bg-white/10 rounded p-2 h-16 flex items-center justify-center text-xs">
                    {i < 5 ? '8h-17h' : '-'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};