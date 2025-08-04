'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Shield, 
  FileText, 
  AlertTriangle, 
  BarChart3,
  CheckCircle,
  Star,
  ArrowRight,
  Users,
  Smartphone,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

// Basic UI Components (in a real Next.js app, these would be from shadcn/ui)
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'default',
  className = '',
  href,
  ...props 
}: any) => {
  const baseClasses = `inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 transform hover:scale-105`;
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
  };
  const sizes = {
    default: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg',
    sm: 'px-4 py-2 text-sm'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${className}`}>
    {children}
  </span>
);

// Animation Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

export default function LandingPage() {
  const [email, setEmail] = useState('');

  const problems = [
    {
      icon: FileText,
      title: "Excel chronophage",
      description: "Fini les heures perdues dans des tableaux complexes et les erreurs de calcul"
    },
    {
      icon: AlertTriangle,
      title: "Erreurs de paie",
      description: "Éliminez les erreurs coûteuses avec un suivi automatisé et précis"
    },
    {
      icon: Shield,
      title: "Non-conformité légale",
      description: "Respectez automatiquement le code du travail français et évitez les sanctions"
    }
  ];

  const features = [
    {
      icon: Calendar,
      title: "Planning visuel",
      description: "Interface intuitive pour créer et modifier les plannings en glisser-déposer"
    },
    {
      icon: Smartphone,
      title: "Pointage mobile",
      description: "Application mobile pour pointer en temps réel avec géolocalisation"
    },
    {
      icon: CheckCircle,
      title: "Validation automatique",
      description: "Vérification automatique des heures et alertes en cas d'anomalie"
    },
    {
      icon: FileText,
      title: "Exports comptables",
      description: "Génération automatique des fichiers Excel et PDF pour la comptabilité"
    },
    {
      icon: AlertTriangle,
      title: "Alertes légales",
      description: "Surveillance en temps réel du respect des temps de repos et durées maximales"
    },
    {
      icon: BarChart3,
      title: "Rapports détaillés",
      description: "Tableaux de bord complets pour analyser la productivité et les coûts"
    }
  ];

  const testimonials = [
    {
      name: "Marie Dubois",
      company: "Boulangerie Moderne",
      role: "Directrice RH",
      quote: "ClockPilot nous a fait gagner 10h par semaine sur la gestion des plannings. L'interface est très intuitive.",
      avatar: "/api/placeholder/60/60"
    },
    {
      name: "Pierre Martin",
      company: "Restaurant Le Gourmet",
      role: "Gérant",
      quote: "Fini les erreurs de paie ! Le système détecte automatiquement les heures supplémentaires et les pauses.",
      avatar: "/api/placeholder/60/60"
    },
    {
      name: "Sophie Laurent",
      company: "Clinique Saint-Paul",
      role: "Responsable Administrative",
      quote: "La conformité légale est assurée automatiquement. Plus de stress avec les contrôles d'inspection du travail.",
      avatar: "/api/placeholder/60/60"
    }
  ];

  const plans = [
    {
      name: "Starter",
      price: "9€",
      description: "Parfait pour les petites équipes",
      features: [
        "Jusqu'à 10 employés",
        "Planning de base",
        "Pointage mobile",
        "Exports Excel",
        "Support email"
      ]
    },
    {
      name: "Pro",
      price: "15€",
      description: "Pour les entreprises en croissance",
      features: [
        "Employés illimités",
        "Planning avancé",
        "Validation automatique",
        "Alertes légales",
        "Rapports détaillés",
        "Support prioritaire"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Sur devis",
      description: "Solution sur mesure",
      features: [
        "Tout du plan Pro",
        "Intégrations personnalisées",
        "Formation équipe",
        "Déploiement sur site",
        "Support dédié"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ClockPilot
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="secondary" href="/login" size="sm">
                Connexion
              </Button>
              <Button href="/register" size="sm">
                Essai gratuit
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="space-y-8"
            >
              <div className="space-y-6">
                <Badge className="bg-blue-100 text-blue-800">
                  ✨ Nouveau : Conformité automatique au code du travail
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Gérez vos plannings{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    sans effort
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  La solution tout-en-un pour optimiser la gestion des temps, assurer la conformité légale française 
                  et simplifier vos processus RH. Économisez jusqu'à 15h par semaine.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" href="/register" className="group">
                  Démarrer l'essai gratuit
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => window.open('https://calendly.com/clockpilot-demo', '_blank')}
                >
                  Voir une démo
                </Button>
              </div>

              <div className="flex items-center space-x-8 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>14 jours gratuits</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Sans engagement</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Support français</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 shadow-2xl">
                <div className="bg-white rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Planning Équipe</h3>
                    <Badge className="bg-green-100 text-green-800">En ligne</Badge>
                  </div>
                  <div className="space-y-3">
                    {['Marie D.', 'Pierre M.', 'Sophie L.'].map((name, i) => (
                      <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {name.split(' ')[0][0]}
                          </div>
                          <span className="font-medium">{name}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {i === 0 ? 'Pointé • 08:30' : i === 1 ? 'Pause • 12:15' : 'Prévu • 14:00'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Fini les problèmes de gestion des temps
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nous résolvons les défis quotidiens que rencontrent les entreprises françaises
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-8"
          >
            {problems.map((problem, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="p-8 text-center h-full">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <problem.icon className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{problem.title}</h3>
                  <p className="text-gray-600">{problem.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Une solution complète et intuitive
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Toutes les fonctionnalités dont vous avez besoin pour optimiser la gestion de vos équipes
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="p-8 h-full hover:shadow-xl">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Ils nous font confiance
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez comment ClockPilot transforme la gestion des temps dans les entreprises françaises
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="p-8 h-full">
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 mb-6 italic">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                      <div className="text-sm text-blue-600">{testimonial.company}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Tarifs transparents et adaptés
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choisissez le plan qui correspond à votre entreprise. Pas de frais cachés, pas d'engagement.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-8"
          >
            {plans.map((plan, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className={`p-8 h-full relative ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white px-4 py-1">
                        Le plus populaire
                      </Badge>
                    </div>
                  )}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      {plan.price !== 'Sur devis' && (
                        <span className="text-gray-600">/employé/mois</span>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    className="w-full"
                    href={plan.name === 'Enterprise' ? 'mailto:contact@clockpilot.fr' : '/register'}
                  >
                    {plan.name === 'Enterprise' ? 'Nous contacter' : 'Commencer'}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="space-y-8"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Prêt à simplifier vos RH ?
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Rejoignez les centaines d'entreprises qui ont déjà optimisé leur gestion des temps avec ClockPilot
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Votre email professionnel"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  if (email) {
                    window.location.href = `/register?email=${encodeURIComponent(email)}`;
                  }
                }}
                className="whitespace-nowrap"
              >
                Démarrer gratuitement
              </Button>
            </div>

            <div className="flex justify-center items-center space-x-8 text-blue-100 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Installation en 5 minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Support 7j/7</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>RGPD compliant</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">ClockPilot</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Confidentialité
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                CGU
              </Link>
              <Link href="mailto:contact@clockpilot.fr" className="hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            © 2025 ClockPilot. Tous droits réservés. Fait avec ❤️ en France.
          </div>
        </div>
      </footer>
    </div>
  );
}