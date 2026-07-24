import React from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import LiveMarketSection from './components/LiveMarketSection';
import ServicesBento from './components/ServicesBento';
import FeaturesSection from './components/FeaturesSection';
import WhyChooseUs from './components/WhyChooseUs';
import HowItWorks from './components/HowItWorks';
import PerformanceMetrics from './components/PerformanceMetrics';
import TestimonialsMarquee from './components/TestimonialsMarquee';
import FAQAccordion from './components/FAQAccordion';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';

function App() {
  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'hidden' }}>
      <Navbar />
      <HeroSection />
      <LiveMarketSection />
      <ServicesBento />
      <FeaturesSection />
      <WhyChooseUs />
      <HowItWorks />
      <PerformanceMetrics />
      <TestimonialsMarquee />
      <FAQAccordion />
      <FinalCTA />
      <Footer />
    </div>
  );
}

export default App;
