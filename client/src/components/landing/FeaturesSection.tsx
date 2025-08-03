import React from 'react';
import { Check, Calendar, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    id: 1,
    title: "Planning Visuel",
    badge: "Intuitif",
    icon: Calendar,
    description: "Créez et modifiez vos plannings en quelques clics avec notre interface drag & drop.",
    benefits: [
      "Vue calendrier claire et intuitive",
      "Drag & drop pour déplacer les créneaux",
      "Codes couleur par équipe ou projet",
      "Détection automatique des conflits"
    ],
    imagePosition: "right"
  },
  {
    id: 2,
    title: "Saisie Simplifiée",
    badge: "Rapide",
    icon: Clock,
    description: "Vos employés pointent en un clic, où qu'ils soient. Fini les feuilles de temps perdues.",
    benefits: [
      "Pointage mobile géolocalisé",
      "Saisie des heures en temps réel",
      "Photos de justificatifs intégrées",
      "Mode hors-ligne disponible"
    ],
    imagePosition: "left"
  },
  {
    id: 3,
    title: "Validation Intelligente",
    badge: "Fiable",
    icon: CheckCircle,
    description: "Notre système vérifie automatiquement la conformité et détecte les anomalies.",
    benefits: [
      "Contrôle automatique des heures sup",
      "Alertes pour les pauses obligatoires",
      "Vérification de la durée légale",
      "Export paie prêt à l'emploi"
    ],
    imagePosition: "right"
  }
];

export const FeaturesSection: React.FC = () => {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Tout ce qu'il faut, rien de trop
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Des fonctionnalités pensées pour les vrais besoins des entreprises françaises.
          </p>
        </div>
        
        <div className="space-y-24">
          {features.map((feature) => (
            <div 
              key={feature.id} 
              className={`flex flex-col lg:flex-row items-center gap-12 ${
                feature.imagePosition === 'left' ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-medium">
                    {feature.badge}
                  </Badge>
                </div>
                
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                
                <ul className="space-y-3">
                  {feature.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Image Placeholder */}
              <div className="flex-1">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
                  <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">{feature.title}</h4>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white/20 rounded-lg h-8 animate-pulse"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};