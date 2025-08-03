import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Shield, Zap, HeadphonesIcon, RotateCcw } from 'lucide-react';

const guarantees = [
  {
    icon: Check,
    title: "Essai gratuit 14 jours",
    description: "Testez toutes les fonctionnalités sans engagement"
  },
  {
    icon: Zap,
    title: "Setup en 48h",
    description: "Notre équipe configure votre compte rapidement"
  },
  {
    icon: HeadphonesIcon,
    title: "Support français",
    description: "Équipe basée en France, réponse < 2h"
  },
  {
    icon: RotateCcw,
    title: "Résiliation libre",
    description: "Arrêtez quand vous voulez, sans frais"
  }
];

export const FinalCTASection: React.FC = () => {
  return (
    <section className="py-20 bg-blue-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold mb-6">
          Prêt à simplifier vos plannings ?
        </h2>
        
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Rejoignez les 200+ entreprises qui font confiance à ClockPilot 
          pour gérer leurs équipes en toute sérénité.
        </p>
        
        <div className="mb-12">
          <Button 
            size="lg" 
            className="px-12 py-4 text-lg font-semibold bg-white text-blue-600 hover:bg-gray-50 shadow-lg"
            data-testid="button-final-cta"
          >
            Démarrer l'essai gratuit maintenant
          </Button>
          <p className="text-blue-100 mt-3 text-sm">
            Sans carte bancaire • Configuration en 10 minutes
          </p>
        </div>
        
        {/* Guarantees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {guarantees.map((guarantee, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <guarantee.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">{guarantee.title}</h3>
              <p className="text-blue-100 text-sm leading-relaxed">
                {guarantee.description}
              </p>
            </div>
          ))}
        </div>
        
        {/* Trust Indicators */}
        <div className="mt-16 pt-8 border-t border-blue-500">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-blue-100">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm">Hébergé en France</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              <span className="text-sm">Conforme RGPD</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm">Certifié ISO 27001</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};