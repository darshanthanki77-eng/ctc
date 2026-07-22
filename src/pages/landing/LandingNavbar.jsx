import React, { useState, useEffect } from 'react';
import { Cpu, ArrowRight, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Market', href: '#market' },
    { label: 'Services', href: '#services' },
    { label: 'Features', href: '#features' },
    { label: 'Why Us', href: '#why-us' },
    { label: 'Performance', href: '#performance' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      transition: 'all 0.3s ease',
      padding: scrolled ? '10px 0' : '16px 0',
      backgroundColor: scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: scrolled ? '1px solid #E5E7EB' : '1px solid transparent',
      boxShadow: scrolled ? '0 2px 12px rgba(0,0,0,0.06)' : 'none',
    }}>
      <div className="lp-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--lp-brand-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Cpu size={18} color="#FFFFFF" />
          </div>
          <span style={{ fontFamily: 'var(--lp-font-display)', fontWeight: 700, fontSize: '1.2rem', color: '#111827' }}>
            CTC<span className="lp-text-gradient">.AI</span>
          </span>
        </a>

        {/* Nav Links */}
        <nav className="lp-desktop-nav" style={{ display: 'none', alignItems: 'center', gap: '28px' }}>
          {navItems.map((item, idx) => (
            <a key={idx} href={item.href} style={{
              color: '#6B7280', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#7C3AED'}
              onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
            >{item.label}</a>
          ))}
        </nav>

        {/* CTA + Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="lp-hide-mobile" style={{
            fontSize: '0.75rem', padding: '5px 12px', borderRadius: '999px',
            background: '#ECFDF5', color: '#059669', fontWeight: 600, border: '1px solid #A7F3D0',
            display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            Live
          </span>

          <Link to="/login" className="lp-btn-primary" style={{ padding: '9px 22px', fontSize: '0.875rem', textDecoration: 'none' }}>
            Launch App <ArrowRight size={15} />
          </Link>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lp-mobile-toggle" style={{
            display: 'none', background: 'transparent', border: '1px solid #E5E7EB',
            borderRadius: '8px', padding: '7px', cursor: 'pointer', color: '#374151',
          }}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#FFFFFF', borderBottom: '1px solid #E5E7EB',
          padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          {navItems.map((item, idx) => (
            <a key={idx} href={item.href} onClick={() => setMobileMenuOpen(false)} style={{
              color: '#374151', textDecoration: 'none', fontSize: '1rem', fontWeight: 500,
              paddingBottom: '12px', borderBottom: '1px solid #F3F4F6',
            }}>{item.label}</a>
          ))}
        </div>
      )}

      <style>{`
        @media (min-width: 900px) { .lp-desktop-nav { display: flex !important; } .lp-mobile-toggle { display: none !important; } }
        @media (max-width: 899px) { .lp-mobile-toggle { display: flex !important; } .lp-hide-mobile { display: none !important; } }
      `}</style>
    </header>
  );
};

export default LandingNavbar;
