import React from 'react';
import { Star, ShieldCheck } from 'lucide-react';

const TestimonialsMarquee = () => {
  const row1 = [
    { name: 'Alexander Vance', role: 'Managing Partner, Vance Capital', text: 'NEXUS transformed our algorithmic liquidity execution. Sub-millisecond latency and zero MEV slippage saved us millions.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80' },
    { name: 'Elena Rostova', role: 'Head of Quant, Aether Fund', text: 'The neural predictive model is unlike anything in modern DeFi. Yield predictions align with mathematical precision.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80' },
    { name: 'Dr. Marcus Thorne', role: 'Chief AI Architect, Neural Labs', text: 'zk-SNARK encryption combined with autonomous routing makes NEXUS the premier institutional protocol.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80' },
  ];

  const row2 = [
    { name: 'Sarah Chen', role: 'Co-Founder, CyberVentures', text: 'Integrating NEXUS took our trading desk from zero to $800M volume in under 30 days. Phenomenal infrastructure.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80' },
    { name: 'David K. Miller', role: 'VP of Digital Assets, Meridian Bank', text: 'Finally an enterprise-ready protocol with strict compliance, zero-downtime SLAs, and non-custodial privacy.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80' },
    { name: 'Sophia Sterling', role: 'Director of Treasury, Apex Crypto', text: 'Managing multi-chain liquidity feels seamless. It sets the new standard for fintech design and execution.', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=80&q=80' },
  ];

  const TestimonialCard = ({ item }) => (
    <div className="glass-card" style={{ width: '360px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', flexShrink: 0 }}>
      <div style={{ display: 'flex', gap: '3px' }}>
        {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#FBBF24" color="#FBBF24" />)}
      </div>
      <p style={{ color: '#374151', fontSize: '0.9rem', lineHeight: 1.6 }}>"{item.text}"</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src={item.avatar} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #EDE9FE' }} />
        <div>
          <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {item.name} <ShieldCheck size={14} color="#7C3AED" />
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{item.role}</div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="section-padding section-white" style={{ overflow: 'hidden' }}>
      <div className="container" style={{ marginBottom: '52px' }}>
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}>
          <div className="glass-pill" style={{ marginBottom: '14px' }}>Institutional Endorsements</div>
          <h2 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.9rem)', marginBottom: '14px' }}>
            Trusted by <span className="text-gradient">Industry Pioneers</span>
          </h2>
          <p style={{ color: '#6B7280', fontSize: '1.05rem' }}>Leading fund managers, researchers, and founders building on NEXUS.</p>
        </div>
      </div>

      <div style={{ overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '20px', width: 'max-content', animation: 'marquee 35s linear infinite' }}>
          {[...row1, ...row1, ...row1].map((item, i) => <TestimonialCard key={i} item={item} />)}
        </div>
      </div>

      <div style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '20px', width: 'max-content', animation: 'marqueeReverse 35s linear infinite' }}>
          {[...row2, ...row2, ...row2].map((item, i) => <TestimonialCard key={i} item={item} />)}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsMarquee;
