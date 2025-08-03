import React from 'react';
import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { SocialProofSection } from '@/components/landing/SocialProofSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { SectorsSection } from '@/components/landing/SectorsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { FinalCTASection } from '@/components/landing/FinalCTASection';
import { Footer } from '@/components/landing/Footer';
import '@/styles/landing.css';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Add top padding to account for fixed header */}
      <div className="pt-16">
        <HeroSection />
        <ProblemSection />
        
        <div id="features">
          <FeaturesSection />
        </div>
        
        <SocialProofSection />
        
        <div id="pricing">
          <PricingSection />
        </div>
        
        <div id="sectors">
          <SectorsSection />
        </div>
        
        <div id="faq">
          <FAQSection />
        </div>
        
        <FinalCTASection />
      </div>
      
      <Footer />
    </div>
  );
};