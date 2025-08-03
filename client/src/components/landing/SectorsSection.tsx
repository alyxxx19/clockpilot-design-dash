import React from 'react';
import { HardHat, Briefcase, Store, Factory } from 'lucide-react';

const sectors = [
  {
    icon: HardHat,
    title: "BTP & Construction",
    description: "Gestion des équipes mobiles, chantiers multiples et horaires variables. Pointage géolocalisé pour sécuriser les présences.",
    benefits: ["Pointage sur chantier", "Gestion multi-sites", "Heures supplémentaires BTP"]
  },
  {
    icon: Briefcase,
    title: "Services & Consultance",
    description: "Suivi du temps par projet, facturation client précise et gestion des déplacements. Parfait pour les SSII et cabinets.",
    benefits: ["Temps par projet", "Facturation précise", "Gestion télétravail"]
  },
  {
    icon: Store,
    title: "Commerce & Retail",
    description: "Plannings par points de vente, gestion des roulements et respect des conventions collectives. Idéal pour les chaînes.",
    benefits: ["Multi-magasins", "Roulements équipes", "Conventions retail"]
  },
  {
    icon: Factory,
    title: "PME Industrielles",
    description: "Organisation des équipes en 2x8 ou 3x8, gestion des astreintes et respect strict de la réglementation industrielle.",
    benefits: ["Equipes postées", "Gestion astreintes", "Conformité industrie"]
  }
];

export const SectorsSection: React.FC = () => {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Adapté à votre secteur d'activité
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            ClockPilot s'adapte aux spécificités de votre métier et aux contraintes de votre secteur.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sectors.map((sector, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                  <sector.icon className="w-7 h-7 text-blue-600" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {sector.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {sector.description}
                  </p>
                  
                  <div className="space-y-2">
                    {sector.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Votre secteur n'est pas listé ? Contactez-nous pour une démonstration personnalisée.
          </p>
          <button className="text-blue-600 font-semibold hover:text-blue-700 transition-colors" data-testid="button-contact-demo">
            Demander une démo →
          </button>
        </div>
      </div>
    </section>
  );
};