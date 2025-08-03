import React, { useState } from 'react';
import { Check, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const features = [
  "Planning visuel drag & drop",
  "Pointage mobile géolocalisé",
  "Validation automatique des heures",
  "Exports paie (Sage, Cegid, Excel)",
  "Conformité droit du travail français",
  "Gestion des congés et absences",
  "Rapports et tableaux de bord",
  "Support client réactif",
  "Sauvegardes automatiques",
  "API pour intégrations"
];

export const PricingSection: React.FC = () => {
  const [employees, setEmployees] = useState([10]);
  
  const monthlyCost = employees[0] * 19;
  const monthlySavings = employees[0] * 60;
  const annualSavings = monthlySavings * 12;
  const roi = Math.round(((annualSavings - (monthlyCost * 12)) / (monthlyCost * 12)) * 100);

  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Tarif simple et transparent
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Un seul plan, toutes les fonctionnalités incluses. Pas de surprise, pas de frais cachés.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Pricing Card */}
          <div className="bg-white text-gray-900 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Plan Professionnel</h3>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl font-bold text-blue-600">19€</span>
                <span className="text-gray-600">HT / employé / mois</span>
              </div>
              <p className="text-gray-600 mt-2">Soit 22,80€ TTC</p>
            </div>
            
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
            
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold"
              data-testid="button-start-trial"
            >
              Démarrer l'essai gratuit
            </Button>
            
            <p className="text-center text-gray-600 mt-4 text-sm">
              14 jours gratuits • Sans engagement • Résiliation libre
            </p>
          </div>
          
          {/* ROI Calculator */}
          <div className="bg-gray-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Calculator className="w-8 h-8 text-blue-400" />
              <h3 className="text-2xl font-bold">Calculateur ROI</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">
                  Nombre d'employés : {employees[0]}
                </label>
                <Slider
                  value={employees}
                  onValueChange={setEmployees}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                  data-testid="slider-employees"
                />
                <div className="flex justify-between text-sm text-gray-400 mt-2">
                  <span>1</span>
                  <span>100+</span>
                </div>
              </div>
              
              <div className="bg-gray-700 rounded-xl p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-300">Coût mensuel ClockPilot :</span>
                  <span className="font-semibold text-blue-400">{monthlyCost}€ HT</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-300">Économies mensuelles* :</span>
                  <span className="font-semibold text-green-400">{monthlySavings}€</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-300">Économies annuelles :</span>
                  <span className="font-semibold text-green-400">{annualSavings.toLocaleString()}€</span>
                </div>
                
                <hr className="border-gray-600" />
                
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">ROI annuel :</span>
                  <span className="font-bold text-green-400">+{roi}%</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-400">
                * Basé sur 60€ d'économies par employé/mois (temps RH économisé, réduction des erreurs de paie, optimisation des plannings)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};