import React from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: "Marie Dubois",
    company: "Dubois Construction",
    role: "Directrice RH",
    content: "ClockPilot nous a fait gagner 15h par semaine sur la gestion des plannings. Plus d'erreurs de paie depuis 6 mois !",
    avatar: "MD",
    rating: 5
  },
  {
    id: 2,
    name: "Thomas Martin",
    company: "Services Pro",
    role: "Gérant",
    content: "Nos équipes mobiles adorent pouvoir pointer depuis le terrain. La géolocalisation nous évite les fraudes.",
    avatar: "TM",
    rating: 5
  },
  {
    id: 3,
    name: "Sophie Laurent",
    company: "Laurent & Associés",
    role: "Responsable Administrative",
    content: "Interface très intuitive, support client réactif. La conformité légale automatique est un vrai plus.",
    avatar: "SL",
    rating: 5
  }
];

export const SocialProofSection: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Adopté par plus de 200 entreprises
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Découvrez pourquoi nos clients recommandent ClockPilot à leurs confrères.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              {/* Content */}
              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "{testimonial.content}"
              </p>
              
              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                  <p className="text-sm font-medium text-blue-600">{testimonial.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">200+</div>
            <div className="text-gray-600">Entreprises clientes</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">5000+</div>
            <div className="text-gray-600">Employés utilisateurs</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">98%</div>
            <div className="text-gray-600">Satisfaction client</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">15h</div>
            <div className="text-gray-600">Économisées/semaine</div>
          </div>
        </div>
      </div>
    </section>
  );
};