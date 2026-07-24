import React from 'react';
import LandingNavbar from './landing/LandingNavbar';
import LandingHero from './landing/LandingHero';
import LiveMarketSection from './landing/LiveMarketSection';
import ServicesBento from './landing/ServicesBento';
import FeaturesSection from './landing/FeaturesSection';
import WhyChooseUs from './landing/WhyChooseUs';
import HowItWorks from './landing/HowItWorks';
import PerformanceMetrics from './landing/PerformanceMetrics';
import TestimonialsMarquee from './landing/TestimonialsMarquee';
import FAQAccordion from './landing/FAQAccordion';
import LandingFinalCTA from './landing/LandingFinalCTA';
import LandingFooter from './landing/LandingFooter';

const Landing = () => {
  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'hidden' }}>
      {/* ── Landing Page CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        :root {
          --lp-primary: #7C3AED;
          --lp-primary-light: #EDE9FE;
          --lp-secondary: #9333EA;
          --lp-accent: #A855F7;
          --lp-bg: #FAFAFA;
          --lp-bg-card: #FFFFFF;
          --lp-bg-section-alt: #F5F3FF;
          --lp-text-primary: #111827;
          --lp-text-secondary: #6B7280;
          --lp-text-muted: #9CA3AF;
          --lp-border: #E5E7EB;
          --lp-border-purple: rgba(124, 58, 237, 0.2);
          --lp-shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
          --lp-shadow-md: 0 4px 16px rgba(0,0,0,0.08);
          --lp-shadow-lg: 0 8px 32px rgba(0,0,0,0.1);
          --lp-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          --lp-font-display: var(--lp-font-sans);
          --lp-brand-gradient: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%);
        }

        .lp-text-gradient {
          background: var(--lp-brand-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .lp-glass-card {
          background: var(--lp-bg-card);
          border: 1px solid var(--lp-border);
          border-radius: 16px;
          box-shadow: var(--lp-shadow-md);
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }

        .lp-glass-card:hover {
          border-color: var(--lp-border-purple);
          box-shadow: var(--lp-shadow-lg);
          transform: translateY(-2px);
        }

        .lp-glass-pill {
          background: var(--lp-primary-light);
          border: 1px solid var(--lp-border-purple);
          border-radius: 9999px;
          padding: 6px 16px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--lp-primary);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          font-family: var(--lp-font-sans);
        }

        .lp-btn-primary {
          background: var(--lp-brand-gradient);
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          padding: 12px 28px;
          font-family: var(--lp-font-sans);
          font-weight: 600;
          font-size: 0.95rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);
          transition: all 0.25s ease;
          cursor: pointer;
        }

        .lp-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
          opacity: 0.92;
          color: #FFFFFF;
        }

        .lp-btn-secondary {
          background: #FFFFFF;
          color: var(--lp-text-primary);
          border: 1px solid var(--lp-border);
          border-radius: 10px;
          padding: 12px 28px;
          font-family: var(--lp-font-sans);
          font-weight: 600;
          font-size: 0.95rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          box-shadow: var(--lp-shadow-sm);
          transition: all 0.25s ease;
          cursor: pointer;
        }

        .lp-btn-secondary:hover {
          border-color: var(--lp-border-purple);
          background: var(--lp-primary-light);
          color: var(--lp-primary);
          transform: translateY(-1px);
        }

        @keyframes lp-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }

        @keyframes marqueeReverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }

        .lp-animate-float {
          animation: lp-float 5s ease-in-out infinite;
        }

        .lp-container {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .lp-section-padding {
          padding: 96px 0;
        }

        .lp-section-alt {
          background-color: #F4F2FF;
          border-top: 1px solid #E4E0FF;
          border-bottom: 1px solid #E4E0FF;
        }

        .lp-section-white {
          background-color: #FFFFFF;
        }

        @media (max-width: 768px) {
          .lp-section-padding { padding: 60px 0; }
          .lp-container { padding: 0 16px; }
        }
      `}</style>

      <LandingNavbar />
      <LandingHero />
      <LiveMarketSection />
      <ServicesBento />
      <FeaturesSection />
      <WhyChooseUs />
      <HowItWorks />
      <PerformanceMetrics />
      <TestimonialsMarquee />
      <FAQAccordion />
      <LandingFinalCTA />
      <LandingFooter />
    </div>
  );
};

export default Landing;
