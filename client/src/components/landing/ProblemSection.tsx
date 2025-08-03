import React from 'react';
import { Table2, MousePointer, Siren } from 'lucide-react';

const problems = [
  {
    icon: Table2,
    title: "Plannings chaotiques",
    emoji: "😤",
    description: "Tableaux Excel perdus, versions multiples, conflits d'horaires... Vos équipes perdent du temps précieux."
  },
  {
    icon: MousePointer,
    title: "Validation manuelle fastidieuse",
    emoji: "⏰",
    description: "Heures passées à vérifier, corriger et valider manuellement chaque planning. L'erreur humaine guette."
  },
  {
    icon: Siren,
    title: "Erreurs de paie fréquentes",
    emoji: "💸",
    description: "Heures supplémentaires oubliées, congés mal comptabilisés... Ces erreurs coûtent cher."
  }
];

export const ProblemSection: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Stop aux galères de planning
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Vous reconnaissez ces situations ? Il est temps de passer à ClockPilot.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <div key={index} className="text-center group">
              <div className="mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200 transition-colors">
                  <span className="text-3xl">{problem.emoji}</span>
                </div>
                <problem.icon className="w-8 h-8 text-red-600 mx-auto" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {problem.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};