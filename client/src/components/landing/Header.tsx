import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' 
          : 'bg-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">ClockPilot</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('features')}
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              data-testid="nav-features"
            >
              Fonctionnalités
            </button>
            <button 
              onClick={() => scrollToSection('pricing')}
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              data-testid="nav-pricing"
            >
              Tarifs
            </button>
            <button 
              onClick={() => scrollToSection('faq')}
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              data-testid="nav-faq"
            >
              FAQ
            </button>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex">
            <Link to="/login">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 font-medium"
                data-testid="header-cta-button"
              >
                Essai gratuit
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            data-testid="mobile-menu-button"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 bg-white">
            <nav className="space-y-4">
              <button 
                onClick={() => scrollToSection('features')}
                className="block w-full text-left px-4 py-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
                data-testid="mobile-nav-features"
              >
                Fonctionnalités
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="block w-full text-left px-4 py-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
                data-testid="mobile-nav-pricing"
              >
                Tarifs
              </button>
              <button 
                onClick={() => scrollToSection('faq')}
                className="block w-full text-left px-4 py-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
                data-testid="mobile-nav-faq"
              >
                FAQ
              </button>
              <div className="px-4 pt-2">
                <Link to="/login">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 font-medium"
                    data-testid="mobile-cta-button"
                  >
                    Essai gratuit
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};