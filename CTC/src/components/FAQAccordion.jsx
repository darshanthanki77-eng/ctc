import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

const FAQAccordion = () => {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    { q: 'How does NEXUS achieve 0.002ms execution latency?', a: 'NEXUS uses direct memory access (DMA) kernel acceleration with FPGA hardware offloading, bypassing standard EVM stack delays to process matching logic at raw hardware speeds.' },
    { q: 'Is NEXUS a non-custodial protocol?', a: 'Yes, 100%. You retain full ownership of your private keys and smart wallet assets at all times. NEXUS operates entirely via automated zero-knowledge proofs.' },
    { q: 'How does the Neural AI engine prevent front-running?', a: 'Our AI routing engine injects private mempool relays and zk-encrypted batching. Arbitrage bots cannot inspect or reorder your transactions prior to state finality.' },
    { q: 'What blockchains are supported?', a: 'NEXUS natively bridges across Ethereum, Arbitrum, Optimism, Solana, Sui, Avalanche, Polygon, Base, and custom enterprise subnets.' },
    { q: 'What are the minimum capital requirements?', a: 'There are zero artificial minimums. Both individual providers and institutional funds access the same high-speed API endpoints and execution pools.' },
  ];

  return (
    <section id="faq" className="section-padding section-alt">
      <div className="container" style={{ maxWidth: '820px' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <div className="glass-pill" style={{ marginBottom: '14px' }}>
            <HelpCircle size={14} /> FAQ
          </div>
          <h2 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.9rem)', marginBottom: '14px' }}>
            Clear Answers for <span className="text-gradient">Complex Finance</span>
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className="glass-card" onClick={() => setOpenIdx(isOpen ? null : idx)} style={{
                padding: '20px 24px', cursor: 'pointer',
                borderColor: isOpen ? '#7C3AED' : '#E5E7EB',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <h3 style={{ fontSize: '1rem', color: '#111827', fontWeight: 600, margin: 0 }}>{faq.q}</h3>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: isOpen ? '#EDE9FE' : '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'transform 0.25s ease',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>
                    <ChevronDown size={16} color={isOpen ? '#7C3AED' : '#9CA3AF'} />
                  </div>
                </div>
                {isOpen && (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #F3F4F6', color: '#6B7280', fontSize: '0.925rem', lineHeight: 1.65 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQAccordion;
