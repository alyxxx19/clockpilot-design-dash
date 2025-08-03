import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

const faqs = [
  {
    id: 1,
    question: "ClockPilot est-il conforme au droit du travail français ?",
    answer: "Absolument ! ClockPilot intègre toutes les règles du Code du travail : durée légale, heures supplémentaires, repos obligatoires, conventions collectives. Notre système vérifie automatiquement la conformité de vos plannings et vous alerte en cas d'anomalie."
  },
  {
    id: 2,
    question: "Puis-je exporter les données vers ma solution de paie ?",
    answer: "Oui, ClockPilot exporte vers tous les logiciels de paie du marché (Sage, Cegid, Silae, etc.) ainsi qu'en Excel. Les exports incluent les heures normales, supplémentaires, congés et absences, prêts à être importés dans votre logiciel de paie."
  },
  {
    id: 3,
    question: "Mes données sont-elles sécurisées ?",
    answer: "La sécurité est notre priorité. Vos données sont hébergées en France (certifié HDS), chiffrées et sauvegardées quotidiennement. ClockPilot est conforme RGPD et nos serveurs sont certifiés ISO 27001."
  },
  {
    id: 4,
    question: "Quel support technique proposez-vous ?",
    answer: "Notre équipe support est basée en France et répond en moins de 2h en moyenne. Nous proposons : support par email, téléphone, chat, formation à distance, documentation complète et webinaires mensuels."
  },
  {
    id: 5,
    question: "Comment se passe la migration depuis mon système actuel ?",
    answer: "Notre équipe vous accompagne gratuitement dans la migration. Nous récupérons vos données existantes (employés, plannings, historiques) et configurons ClockPilot selon vos besoins. La transition se fait en moins de 48h."
  }
];

export const FAQSection: React.FC = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Questions fréquentes
          </h2>
          <p className="text-xl text-gray-600">
            Tout ce que vous devez savoir sur ClockPilot
          </p>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq) => {
            const isOpen = openItems.includes(faq.id);
            
            return (
              <div key={faq.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  data-testid={`faq-button-${faq.id}`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0">
                    {isOpen ? (
                      <X className="w-5 h-5 text-gray-500" />
                    ) : (
                      <Plus className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </button>
                
                {isOpen && (
                  <div className="px-6 pb-6">
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-gray-700 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Vous avez d'autres questions ?
          </p>
          <button className="text-blue-600 font-semibold hover:text-blue-700 transition-colors" data-testid="button-contact-support">
            Contactez notre équipe →
          </button>
        </div>
      </div>
    </section>
  );
};