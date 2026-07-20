import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ShieldCheck, Eye, Globe, TrendingUp, TrendingDown, ArrowRight,
  BarChart2, Zap, Users, Lock, CheckCircle2, Menu, X,
  DollarSign, Network, Wallet, RefreshCw, ArrowUpRight,
  AlertTriangle, Sparkles, Star, Activity, Cpu, Layers, ChevronRight, Play, Check, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

/* ═══════════════════════════════════════════
   PREMIUM CTC DESIGN SYSTEM & BRAND PALETTE
═══════════════════════════════════════════ */
const C = {
  bg:            '#FFFFFF',
  bgLavender:    'linear-gradient(180deg, #F9F7FF 0%, #F2ECFF 100%)',
  softPurpleBg:  '#FAF8FF',
  lavenderLight: '#F5F1FF',
  navy:          '#0B1020',
  purple:        '#7C3AED',
  violet:        '#8B5CF6',
  brightPurple:  '#A855F7',
  magenta:       '#D946EF',
  pinkHighlight: '#E879F9',
  borderSoft:    'rgba(124, 58, 237, 0.15)',
  borderSoftDark:'rgba(255, 255, 255, 0.1)',
  textNavy:      '#0B1020',
  muted:         '#475569',
  mutedLight:    '#94A3B8',
  green:         '#10B981',
  gold:          '#F59E0B',
  red:           '#EF4444',
  primaryGrad:   'linear-gradient(135deg, #7C3AED 0%, #A855F7 45%, #D946EF 100%)',
  textGrad:      'linear-gradient(90deg, #7C3AED 0%, #A855F7 35%, #D946EF 70%, #EC4899 100%)'
};

const EXPO_OUT = [0.16, 1, 0.3, 1];

/* ═══════════════════════════════════════════
   UTILITY & ANIMATION COMPONENTS
═══════════════════════════════════════════ */
function SectionHairline() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <div ref={ref} style={{ width: '100%', height: 1.5, position: 'relative', overflow: 'hidden' }}>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.8, ease: EXPO_OUT }}
        style={{
          width: '100%', height: '100%', originX: 0,
          background: 'linear-gradient(90deg, rgba(124, 58, 237, 0.25) 0%, rgba(217, 70, 239, 0.25) 100%)'
        }}
      />
    </div>
  );
}

function Reveal({ children, delay = 0, y = 24, style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay, ease: EXPO_OUT }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function Section({ id, children, style = {}, className = '' }) {
  return (
    <section id={id} className={className} style={{ position: 'relative', overflow: 'hidden', ...style }}>
      {children}
    </section>
  );
}

function AnimatedCounter({ from = 0, to, duration = 0.9, prefix = "", suffix = "", decimals = 1 }) {
  const [val, setVal] = useState(from);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let startTime;
    let animationFrame;

    const update = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(from + (to - from) * eased);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(update);
      }
    };

    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, from, to, duration]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {prefix}{val.toFixed(decimals)}{suffix}
    </span>
  );
}

function Preloader({ onComplete }) {
  useEffect(() => {
    onComplete();
  }, [onComplete]);
  return null;
}

/* ═══════════════════════════════════════════
   01. FLOATING GLASS NAVBAR
═══════════════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { name: 'About', href: '#about' },
    { name: 'Copy Trading', href: '#copy-trading' },
    { name: 'Forex', href: '#forex' },
    { name: 'PAMM', href: '#pamm' },
    { name: 'Income', href: '#income' },
    { name: 'Packages', href: '#packages' }
  ];

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: scrolled ? '0.75rem 1.25rem' : '1.25rem 1.25rem',
        transition: 'all 0.35s ease'
      }}>
        <nav style={{
          maxWidth: 1240, margin: '0 auto',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 20,
          border: `1px solid ${C.borderSoft}`,
          padding: '0.65rem 1.4rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: scrolled ? '0 12px 35px rgba(11, 16, 32, 0.08)' : '0 6px 25px rgba(124, 58, 237, 0.05)',
          transition: 'all 0.3s ease'
        }}>
          {/* Premium Logo [↗] CTC */}
          <a href="#hero" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <motion.div
              whileHover={{ rotate: 5, scale: 1.05 }}
              style={{
                width: 38, height: 38, borderRadius: 12,
                background: C.primaryGrad,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(124, 58, 237, 0.35)'
              }}
            >
              <ArrowUpRight size={22} color="white" strokeWidth={2.8} />
            </motion.div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{
                fontWeight: 900, fontSize: '1.35rem', letterSpacing: '-0.03em', lineHeight: 1,
                background: C.textGrad,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>CTC</span>
              <span style={{ fontSize: '0.55rem', fontWeight: 800, color: C.muted, letterSpacing: '0.15em', marginTop: 2 }}>COPY TRADE</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }} className="hidden-mobile">
            {links.map(l => (
              <a
                key={l.name}
                href={l.href}
                className="nav-link-hover"
                style={{
                  color: C.navy, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700,
                  position: 'relative', padding: '0.4rem 0'
                }}
              >
                {l.name}
              </a>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} className="hidden-mobile">
            <Link to="/login" style={{
              color: C.navy, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 800,
              padding: '0.55rem 1.1rem', borderRadius: 10, transition: 'all 0.2s'
            }}>Login</Link>

            <motion.a
              whileHover={{ scale: 1.04, y: -1 }}
              href="#packages"
              className="btn-sheen"
              style={{
                background: C.primaryGrad,
                color: 'white', textDecoration: 'none', fontSize: '0.775rem', fontWeight: 800,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '0.7rem 1.5rem', borderRadius: 12,
                boxShadow: '0 6px 22px rgba(217, 70, 239, 0.35)'
              }}
            >
              START TRADING →
            </motion.a>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMenuOpen(true)} className="show-mobile" style={{
            background: 'none', border: 'none', color: C.navy, cursor: 'pointer', padding: 4
          }}>
            <Menu size={24} />
          </button>
        </nav>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3, ease: EXPO_OUT }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1001,
              background: '#FFFFFF', padding: '2rem 1.5rem',
              display: 'flex', flexDirection: 'column', gap: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: C.primaryGrad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowUpRight size={18} color="white" strokeWidth={2.8} />
                </div>
                <span style={{ fontWeight: 900, fontSize: '1.3rem', color: C.navy }}>CTC</span>
              </div>
              <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.navy }}>
                <X size={26} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
              {links.map(l => (
                <a key={l.name} href={l.href} onClick={() => setMenuOpen(false)} style={{
                  color: C.navy, textDecoration: 'none', fontSize: '1.15rem', fontWeight: 800
                }}>{l.name}</a>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '2rem', marginTop: 'auto' }}>
              <Link to="/login" onClick={() => setMenuOpen(false)} style={{
                textAlign: 'center', padding: '0.85rem', borderRadius: 12,
                border: `1.5px solid ${C.purple}`, textDecoration: 'none', fontWeight: 800, color: C.navy
              }}>Login</Link>
              <a href="#packages" onClick={() => setMenuOpen(false)} style={{
                textAlign: 'center', padding: '0.85rem', borderRadius: 12,
                background: C.primaryGrad, color: 'white', textDecoration: 'none', fontWeight: 800
              }}>Start Trading →</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ═══════════════════════════════════════════
   02. HERO SECTION — LIVE ENGINE SHOWCASE
═══════════════════════════════════════════ */
function HeroMarketCard() {
  const chartData = [
    { d: '00:00', v: 1000 },
    { d: '04:00', v: 1080 },
    { d: '08:00', v: 1140 },
    { d: '12:00', v: 1120 },
    { d: '16:00', v: 1210 },
    { d: '20:00', v: 1250 },
    { d: '24:00', v: 1280 }
  ];

  return (
    <div style={{ position: 'relative' }}>
      {/* Background Glowing Particles & Grid Accent */}
      <div style={{
        position: 'absolute', inset: -20, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.18) 0%, transparent 70%)',
        filter: 'blur(40px)'
      }} />

      {/* Floating Badge */}
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute', top: -18, right: 20, zIndex: 12,
          background: '#FFFFFF', border: `1.5px solid ${C.borderSoft}`,
          borderRadius: 100, padding: '0.45rem 1.1rem',
          boxShadow: '0 8px 25px rgba(124, 58, 237, 0.14)',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}
      >
        <Zap size={14} color={C.purple} />
        <span style={{ fontSize: '0.725rem', fontWeight: 800, color: C.navy }}>
          18ms Ultra-Low Latency
        </span>
      </motion.div>

      {/* Live Trading Dashboard Container */}
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{
          background: '#FFFFFF',
          border: `2px solid ${C.purple}`,
          borderRadius: 28,
          padding: '2.25rem',
          boxShadow: '0 25px 60px rgba(124, 58, 237, 0.12)',
          position: 'relative', zIndex: 10
        }}
      >
        {/* Header Status Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: C.green, animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: '0.725rem', fontWeight: 900, color: C.navy, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              LIVE EXECUTION ENGINE
            </span>
          </div>
          <span style={{
            fontSize: '0.65rem', fontWeight: 800, color: 'white',
            background: C.primaryGrad, padding: '0.3rem 0.85rem', borderRadius: 100,
            boxShadow: '0 4px 12px rgba(217, 70, 239, 0.25)'
          }}>
            ● Connected
          </span>
        </div>

        {/* Live Yield Counter */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
            ESTIMATED DAILY YIELD GENERATED
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 900, color: C.navy, lineHeight: 1 }}>+$1,280.50</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: C.green, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              <TrendingUp size={16} /> +<AnimatedCounter from={0} to={42.8} decimals={1} suffix="%" /> Today
            </span>
          </div>
        </div>

        {/* Live Interactive Area Chart */}
        <div style={{ height: 110, width: '100%', marginBottom: '1.5rem' }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={50}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="heroChartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.purple} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={C.purple} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={C.purple} strokeWidth={3} fill="url(#heroChartGlow)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Live Activity Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            LIVE ACTIVITY FEED
          </span>
          {[
            { text: 'EUR/USD mirrored position', profit: '+1.4%', status: 'Executed' },
            { text: 'BTC/USDT scalp copied', profit: '+2.1%', status: 'Executed' },
            { text: 'Profit dividend dispatched', profit: '+$340.00', status: 'Settled' }
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                background: C.softPurpleBg, border: `1px solid ${C.borderSoft}`,
                borderRadius: 12, padding: '0.65rem 0.95rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={15} color={C.purple} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: C.navy }}>{item.text}</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 900, color: C.green }}>{item.profit}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function HeroSection() {
  return (
    <Section id="hero" style={{ padding: '8.5rem 1.25rem 5rem', background: C.bg, position: 'relative' }}>
      {/* Background Soft Glow */}
      <div style={{
        position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 400, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, rgba(217, 70, 239, 0.06) 50%, transparent 70%)',
        filter: 'blur(90px)'
      }} />

      <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '3.5rem', alignItems: 'center' }} className="hero-grid">

          {/* Left Column */}
          <div>
            <Reveal>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: C.softPurpleBg, border: `1.5px solid ${C.borderSoft}`,
                borderRadius: 100, padding: '0.45rem 1.1rem', marginBottom: '1.5rem',
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.06)'
              }}>
                <TrendingUp size={14} color={C.purple} />
                <span style={{ fontSize: '0.725rem', color: C.purple, fontWeight: 800, letterSpacing: '0.1em' }}>
                  AUTOMATED COPY TRADING ECOSYSTEM
                </span>
              </div>
            </Reveal>

            {/* Headline with Text Gradient */}
            <div style={{ marginBottom: '1.5rem' }}>
              <Reveal delay={0.08}>
                <h1 style={{ fontSize: 'clamp(2.85rem, 5.5vw, 4.4rem)', fontWeight: 900, lineHeight: 1.05, color: C.navy, letterSpacing: '-0.03em' }}>
                  Trade Smart.
                </h1>
              </Reveal>
              <Reveal delay={0.16}>
                <h1 style={{
                  fontSize: 'clamp(2.85rem, 5.5vw, 4.4rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em',
                  background: C.textGrad,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                  Earn Daily.
                </h1>
              </Reveal>
            </div>

            <Reveal delay={0.24}>
              <p style={{ color: C.muted, fontSize: '1.05rem', lineHeight: 1.7, maxWidth: 520, marginBottom: '2.25rem', fontWeight: 500 }}>
                Automatically mirror verified provider portfolios in real time. Generate daily dividend distributions directly into your account — 100% automated infrastructure.
              </p>
            </Reveal>

            {/* Action Buttons */}
            <Reveal delay={0.32}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center' }} className="cta-btn-group">
                <motion.a
                  whileHover={{ scale: 1.04, y: -2 }}
                  href="#packages"
                  className="btn-sheen"
                  style={{
                    background: C.primaryGrad,
                    color: 'white', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem',
                    padding: '0.95rem 2.25rem', borderRadius: 14,
                    boxShadow: '0 8px 25px rgba(217, 70, 239, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '0.6rem'
                  }}
                >
                  Start Copy Trading <ArrowRight size={18} />
                </motion.a>

                <motion.a
                  whileHover={{ scale: 1.04, y: -2, background: C.purple, color: '#FFFFFF' }}
                  href="#how-it-works"
                  style={{
                    background: '#FFFFFF', border: `2px solid ${C.purple}`,
                    color: C.purple, textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem',
                    padding: '0.95rem 2.25rem', borderRadius: 14,
                    boxShadow: '0 4px 15px rgba(124, 58, 237, 0.12)', transition: 'all 0.2s ease'
                  }}
                >
                  How It Works
                </motion.a>
              </div>
            </Reveal>

            {/* Rating Bar */}
            <Reveal delay={0.42}>
              <div style={{
                marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '0.75rem 1.25rem', background: C.softPurpleBg, border: `1px solid ${C.borderSoft}`,
                borderRadius: 16, maxWidth: 420
              }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <Star key={i} size={16} fill={C.gold} color={C.gold} />
                  ))}
                </div>
                <span style={{ fontSize: '0.775rem', color: C.muted, fontWeight: 700 }}>
                  Trusted by <strong style={{ color: C.navy }}>10,000+</strong> active copiers worldwide
                </span>
              </div>
            </Reveal>
          </div>

          {/* Right Column Showcase */}
          <div>
            <Reveal delay={0.2}>
              <HeroMarketCard />
            </Reveal>
          </div>

        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   03. TRUST STRIP TICKER
═══════════════════════════════════════════ */
function TrustStrip() {
  const list = [
    { text: '100% Automated Execution' },
    { text: 'Audited Smart Contracts' },
    { text: 'Daily USDT Dividend Settlement' },
    { text: 'Real-Time Portfolio Mirroring' },
    { text: '10,000+ Active Investors' },
    { text: 'Binance Smart Chain Infrastructure' }
  ];

  return (
    <div style={{
      background: C.softPurpleBg, padding: '1.25rem 0', overflow: 'hidden', position: 'relative',
      borderTop: `1px solid rgba(168, 85, 247, 0.15)`,
      borderBottom: `1px solid rgba(217, 70, 239, 0.15)`
    }}>
      <div style={{ display: 'flex', gap: '3.5rem', whiteSpace: 'nowrap' }} className="marquee-track">
        {[...list, ...list, ...list].map((item, i) => (
          <span key={i} style={{
            fontSize: '0.775rem', fontWeight: 800, letterSpacing: '0.1em', color: C.muted,
            display: 'inline-flex', alignItems: 'center', gap: '0.65rem'
          }}>
            <Zap size={15} color={C.purple} />
            <span style={{ color: C.navy }}>{item.text}</span>
            <span style={{ color: C.magenta, margin: '0 0.5rem' }}>◈</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   04. GLOBAL FINANCIAL ECOSYSTEM SECTION
═══════════════════════════════════════════ */
function AboutSection() {
  const cards = [
    { num: '01', icon: ShieldCheck, title: 'SECURE INFRASTRUCTURE', desc: 'Protected by institutional-grade smart contracts and multi-layered encryption protocols.' },
    { num: '02', icon: Eye, title: 'FULL TRANSPARENCY', desc: 'Real-time on-chain verifiable audit trails, open yield metrics, and visible portfolio logs.' },
    { num: '03', icon: Globe, title: 'GLOBAL CONNECTIVITY', desc: 'Instant Web3 connection connecting global investors to top-tier forex liquidity providers.' },
    { num: '04', icon: Zap, title: 'INTELLIGENT ROUTING', desc: 'Automated order execution algorithm mirroring master trader positions within 18 milliseconds.' }
  ];

  return (
    <Section id="about" style={{ padding: '6.5rem 1.25rem', background: C.bgLavender }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 650, margin: '0 auto 4rem' }}>
          <Reveal>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em', color: C.purple, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              DECENTRALIZED ARCHITECTURE
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 900, color: C.navy, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '1rem' }}>
              A Global Financial Ecosystem
            </h2>
            <p style={{ fontSize: '0.95rem', color: C.muted, lineHeight: 1.65, fontWeight: 500, margin: 0 }}>
              We bridge traditional forex copy trading logic with smart decentralized infrastructure, delivering a seamless automated yield experience.
            </p>
          </Reveal>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }} className="about-grid">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                  background: '#FFFFFF', border: `1.5px solid ${C.borderSoft}`, borderRadius: 24,
                  padding: '2rem 1.6rem', height: '100%', display: 'flex', flexDirection: 'column',
                  boxShadow: '0 10px 30px rgba(124, 58, 237, 0.06)', cursor: 'pointer', position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 14,
                    background: C.primaryGrad,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 6px 18px rgba(124, 58, 237, 0.25)'
                  }}>
                    <c.icon size={22} color="white" />
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 900, color: C.mutedLight }}>{c.num}</span>
                </div>

                <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: C.navy, letterSpacing: '0.05em', marginBottom: '0.65rem', textTransform: 'uppercase' }}>
                  {c.title}
                </h3>
                <p style={{ fontSize: '0.825rem', color: C.muted, lineHeight: 1.6, fontWeight: 500, margin: '0 0 1.5rem 0' }}>
                  {c.desc}
                </p>

                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: `1px dashed ${C.borderSoft}`, display: 'flex', justifyContent: 'flex-end' }}>
                  <ArrowRight size={16} color={C.purple} />
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   05. COPY TRADING SECTION — PROCESS & LIVE FEED
═══════════════════════════════════════════ */
function CopyTradingSection() {
  const [activeStrategy, setActiveStrategy] = useState(0);

  const strategies = [
    {
      name: 'Master Alpha Quant', badge: 'High Yield Scalper', winRate: 94.2, copiers: '1,420 Copiers', masterProfit: 42500, totalVolume: '$2.8M Copied', recentTrade: 'Bought EUR/USD at 1.0854 (+1.4% Profit)', latency: '18ms',
      chart: [{ d: 'Mon', v: 38000 }, { d: 'Tue', v: 39200 }, { d: 'Wed', v: 40100 }, { d: 'Thu', v: 41000 }, { d: 'Fri', v: 41800 }, { d: 'Sat', v: 42100 }, { d: 'Sun', v: 42500 }]
    },
    {
      name: 'Whale Scalp Pro', badge: 'Aggressive Forex', winRate: 91.8, copiers: '2,850 Copiers', masterProfit: 98400, totalVolume: '$5.4M Copied', recentTrade: 'Sold GBP/JPY at 192.40 (+2.1% Profit)', latency: '14ms',
      chart: [{ d: 'Mon', v: 82000 }, { d: 'Tue', v: 85400 }, { d: 'Wed', v: 89000 }, { d: 'Thu', v: 92100 }, { d: 'Fri', v: 94800 }, { d: 'Sat', v: 96500 }, { d: 'Sun', v: 98400 }]
    },
    {
      name: 'Macro Trend Master', badge: 'Low Risk Balanced', winRate: 96.0, copiers: '980 Copiers', masterProfit: 31200, totalVolume: '$1.9M Copied', recentTrade: 'Bought USD/JPY at 154.20 (+0.9% Profit)', latency: '22ms',
      chart: [{ d: 'Mon', v: 28000 }, { d: 'Tue', v: 28600 }, { d: 'Wed', v: 29200 }, { d: 'Thu', v: 29900 }, { d: 'Fri', v: 30400 }, { d: 'Sat', v: 30800 }, { d: 'Sun', v: 31200 }]
    }
  ];

  const current = strategies[activeStrategy];

  const journeySteps = [
    { num: '01', tag: 'SELECT', title: 'Follow Verified Masters', desc: 'Browse provider portfolios with audited ROI records and real-time win rates.' },
    { num: '02', tag: 'ALLOCATE', title: 'Proportional Safety', desc: 'Smart contracts match your capital balance proportionally with zero over-exposure risk.' },
    { num: '03', tag: 'MIRROR', title: '18ms Low Latency Execution', desc: 'Synchronous execution mirrors master orders directly into your sub-account in real time.' }
  ];

  return (
    <Section id="copy-trading" style={{ padding: '6.5rem 1.25rem', background: C.bg }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '3.5rem', alignItems: 'center' }} className="hero-grid">
          
          {/* Left Column Journey Steps */}
          <div>
            <Reveal>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: C.softPurpleBg, border: `1.5px solid ${C.purple}`,
                borderRadius: 100, padding: '0.45rem 1.1rem', marginBottom: '1.5rem'
              }}>
                <Zap size={14} color={C.purple} />
                <span style={{ fontSize: '0.725rem', color: C.purple, fontWeight: 800, letterSpacing: '0.1em' }}>
                  AUTOMATED TRADING PIPELINE
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, lineHeight: 1.1, color: C.navy, letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>
                You don't need to trade alone.
              </h2>
            </Reveal>

            <Reveal delay={0.16}>
              <h2 style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '1.25rem',
                background: C.textGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>
                Mirror Master Profits Live.
              </h2>
            </Reveal>

            <Reveal delay={0.24}>
              <p style={{ fontSize: '0.95rem', color: C.muted, lineHeight: 1.7, marginBottom: '2rem', fontWeight: 500 }}>
                Our network replicates trades automatically from verified provider portfolios directly to your account. Select a strategy profile, input capital parameters, and watch the system manage the rest.
              </p>
            </Reveal>

            {/* Numbered Process Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
              {journeySteps.map((step, idx) => (
                <Reveal key={step.num} delay={0.3 + idx * 0.08}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    style={{
                      background: C.softPurpleBg, border: `1.5px solid ${C.borderSoft}`, borderRadius: 18, padding: '1.1rem 1.35rem',
                      display: 'flex', alignItems: 'center', gap: '1.1rem', boxShadow: '0 6px 20px rgba(124, 58, 237, 0.04)'
                    }}
                  >
                    <div style={{
                      width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: C.primaryGrad,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '0.85rem'
                    }}>
                      {step.num}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: C.purple, letterSpacing: '0.1em' }}>{step.tag}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: C.navy }}>• {step.title}</span>
                      </div>
                      <p style={{ fontSize: '0.775rem', color: C.muted, fontWeight: 500, margin: '2px 0 0 0', lineHeight: 1.5 }}>{step.desc}</p>
                    </div>
                  </motion.div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.55}>
              <motion.a
                whileHover={{ scale: 1.04, y: -2 }}
                href="#packages"
                className="btn-sheen"
                style={{
                  background: C.primaryGrad,
                  color: 'white', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem',
                  padding: '0.95rem 2.25rem', borderRadius: 14, boxShadow: '0 8px 25px rgba(217, 70, 239, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '0.6rem'
                }}
              >
                Copy Master Traders Now <ArrowRight size={18} />
              </motion.a>
            </Reveal>
          </div>

          {/* Right Column Master Strategy Terminal */}
          <div>
            <Reveal delay={0.2}>
              <div style={{ background: '#FFFFFF', border: `2px solid ${C.purple}`, borderRadius: 28, padding: '2.25rem', boxShadow: '0 20px 50px rgba(124, 58, 237, 0.1)', position: 'relative' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={18} color={C.purple} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 900, color: C.navy, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        MASTER STRATEGY TERMINAL
                      </span>
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: C.purple, background: C.lavenderLight, padding: '0.3rem 0.85rem', borderRadius: 100 }}>
                      Live Mirror Engine
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', background: C.lavenderLight, padding: '0.4rem', borderRadius: 16 }}>
                    {strategies.map((s, idx) => (
                      <button
                        key={s.name}
                        onClick={() => setActiveStrategy(idx)}
                        style={{
                          flex: 1, padding: '0.6rem 0.5rem', borderRadius: 12, border: 'none',
                          background: activeStrategy === idx ? C.primaryGrad : 'transparent',
                          color: activeStrategy === idx ? 'white' : C.muted,
                          fontWeight: activeStrategy === idx ? 900 : 700, fontSize: '0.725rem', cursor: 'pointer', transition: 'all 0.25s', textAlign: 'center'
                        }}
                      >
                        {s.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStrategy}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: C.navy, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {current.name} <CheckCircle2 size={18} color={C.purple} />
                        </h3>
                        <span style={{ fontSize: '0.725rem', fontWeight: 700, color: C.muted }}>
                          {current.badge} • {current.copiers}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', display: 'block' }}>WIN RATE</span>
                        <span style={{ fontSize: '1.15rem', fontWeight: 900, color: C.green }}>
                          <AnimatedCounter from={80} to={current.winRate} suffix="%" />
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }} className="stats-3col">
                      <div style={{ background: C.softPurpleBg, border: `1.5px solid ${C.borderSoft}`, borderRadius: 14, padding: '0.8rem 0.5rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', display: 'block' }}>Master Profit</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 900, color: C.navy, marginTop: 4, display: 'block' }}>
                          $<AnimatedCounter from={10000} to={current.masterProfit} decimals={0} />
                        </span>
                      </div>
                      <div style={{ background: C.softPurpleBg, border: `1.5px solid ${C.borderSoft}`, borderRadius: 14, padding: '0.8rem 0.5rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', display: 'block' }}>Volume Copied</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 900, color: C.navy, marginTop: 4, display: 'block' }}>{current.totalVolume}</span>
                      </div>
                      <div style={{ background: C.softPurpleBg, border: `1.5px solid ${C.borderSoft}`, borderRadius: 14, padding: '0.8rem 0.5rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', display: 'block' }}>Copy Latency</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 900, color: C.navy, marginTop: 4, display: 'block' }}>{current.latency}</span>
                      </div>
                    </div>

                    <div style={{ height: 95, width: '100%', marginBottom: '1.25rem' }}>
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={50}>
                        <AreaChart data={current.chart}>
                          <defs>
                            <linearGradient id="strategyGlow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={C.purple} stopOpacity={0.25} />
                              <stop offset="100%" stopColor={C.purple} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="v" stroke={C.purple} strokeWidth={2.5} fill="url(#strategyGlow)" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1.5px solid #10B981', borderRadius: 14, padding: '0.85rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
                      <p style={{ fontSize: '0.75rem', color: '#065F46', fontWeight: 700, margin: 0, lineHeight: 1.4 }}>
                        <strong>Latest Mirror Execution:</strong> {current.recentTrade}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </Reveal>
          </div>

        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   06. HOW IT WORKS — 5-STEP DYNAMIC PANEL
═══════════════════════════════════════════ */
function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { num: '01', title: 'CHOOSE TIER', label: 'Package Selection', desc: 'Browse package tiers ($100 to $25,000+) and pick the allocation rate matching your capital targets.', previewText: '$1,500 - $4,999 • 1.2% Daily Allocation Rate' },
    { num: '02', title: 'ALLOCATE USDT', label: 'USDT Transfer', desc: 'Transfer USDT directly to your non-custodial Smart Contract allocation wallet on Binance Smart Chain.', previewText: 'Smart Contract Escrow • 100% Non-Custodial' },
    { num: '03', title: 'CONNECT PORTFOLIO', label: 'Web3 Terminal', desc: 'Connect your Web3 dashboard terminal to initiate automatic trade signal reception.', previewText: 'MetaMask / TrustWallet Connected' },
    { num: '04', title: 'AUTO MIRROR', label: 'Trade Replication', desc: 'Pro master trader orders execute synchronously across your connected sub-account in real time.', previewText: '18ms Synchronous Copy Execution Engine' },
    { num: '05', title: 'DAILY DISPATCH', label: 'Dividend Settlement', desc: 'Earned dividends automatically credit into your platform balance ready for compounding or withdrawal.', previewText: 'Daily Automated USDT Payout Dispatched' }
  ];

  const current = steps[activeStep];

  return (
    <Section id="how-it-works" style={{ padding: '6.5rem 1.25rem', background: C.bgLavender }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 650, margin: '0 auto 3.5rem' }}>
          <Reveal>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em', color: C.purple, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              INTERACTIVE USER JOURNEY
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 900, color: C.navy, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
              How Copy Trading Works
            </h2>
            <p style={{ fontSize: '0.925rem', color: C.muted, fontWeight: 500, margin: 0 }}>
              Click through the 5-step automated workflow below to explore the strategy lifecycle.
            </p>
          </Reveal>
        </div>

        {/* Step Selector Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
          {steps.map((s, idx) => (
            <button
              key={s.num}
              onClick={() => setActiveStep(idx)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.65rem 1.35rem', borderRadius: 100,
                border: `1.5px solid ${activeStep === idx ? C.purple : C.borderSoft}`,
                background: activeStep === idx ? C.primaryGrad : '#FFFFFF',
                color: activeStep === idx ? 'white' : C.navy,
                fontWeight: 800, fontSize: '0.775rem', cursor: 'pointer', transition: 'all 0.25s',
                boxShadow: activeStep === idx ? '0 8px 22px rgba(217, 70, 239, 0.3)' : '0 4px 15px rgba(0,0,0,0.03)'
              }}
            >
              <span>{s.num}</span>
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Step Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            style={{
              background: '#FFFFFF', border: `2px solid ${C.purple}`, borderRadius: 28,
              padding: '3rem 2.5rem', boxShadow: '0 20px 50px rgba(124, 58, 237, 0.08)',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center'
            }}
            className="hero-grid"
          >
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 900, color: C.purple, letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                STEP {current.num} • {current.label}
              </span>
              <h3 style={{ fontSize: '1.85rem', fontWeight: 900, color: C.navy, marginBottom: '1rem', lineHeight: 1.2 }}>
                {current.title}
              </h3>
              <p style={{ fontSize: '0.95rem', color: C.muted, lineHeight: 1.7, fontWeight: 500, marginBottom: '2rem' }}>
                {current.desc}
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: C.softPurpleBg, border: `1px solid ${C.borderSoft}`, padding: '0.65rem 1.1rem', borderRadius: 12 }}>
                <CheckCircle2 size={16} color={C.green} />
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: C.navy }}>{current.previewText}</span>
              </div>
            </div>

            {/* Simulated Interactive Visual */}
            <div style={{ background: C.softPurpleBg, border: `1.5px solid ${C.borderSoft}`, borderRadius: 20, padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: C.primaryGrad, margin: '0 auto 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 25px rgba(217, 70, 239, 0.35)' }}>
                <Zap size={30} color="white" />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: C.navy, marginBottom: '0.5rem' }}>
                {current.title} Simulated Engine
              </h4>
              <p style={{ fontSize: '0.8rem', color: C.muted, margin: 0, fontWeight: 500 }}>
                Automated smart contract verification active on BSC Mainnet.
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   07. FOREX SECTION — MARKET TERMINAL (SIMPLE & CLEAN)
═══════════════════════════════════════════ */
function ForexSection() {
  const sessions = [
    { name: 'TOKYO', active: false, time: '00:00 - 09:00 GMT' },
    { name: 'SYDNEY', active: false, time: '22:00 - 07:00 GMT' },
    { name: 'LONDON', active: true, time: '08:00 - 17:00 GMT' },
    { name: 'NEW YORK', active: true, time: '13:00 - 22:00 GMT' }
  ];

  const tickers = [
    { pair: 'EUR / USD', flag: '🇪🇺🇺🇸', price: '1.0854', change: '+0.34%', trend: 'up' },
    { pair: 'GBP / USD', flag: '🇬🇧🇺🇸', price: '1.2640', change: '+0.52%', trend: 'up' },
    { pair: 'USD / JPY', flag: '🇺🇸🇯🇵', price: '154.20', change: '-0.18%', trend: 'down' },
    { pair: 'EUR / GBP', flag: '🇪🇺🇬🇧', price: '0.8586', change: '-0.12%', trend: 'down' }
  ];

  return (
    <Section id="forex" style={{ padding: '5.5rem 1.25rem', background: C.bg }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        
        {/* Simple Section Header */}
        <div style={{ textAlign: 'center', maxWidth: 650, margin: '0 auto 3rem' }}>
          <Reveal>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em', color: C.purple, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              GLOBAL LIQUIDITY TERMINAL
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 900, color: C.navy, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
              24/5 Forex Market Access
            </h2>
            <p style={{ fontSize: '0.95rem', color: C.muted, lineHeight: 1.6, fontWeight: 500, margin: 0 }}>
              Connect directly into institutional market sessions with real-time liquidity routing.
            </p>
          </Reveal>
        </div>

        {/* 1. Clean Market Session Pills Bar */}
        <Reveal delay={0.08}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }} className="forex-stats-grid">
            {sessions.map((s) => (
              <div
                key={s.name}
                style={{
                  background: s.active ? C.softPurpleBg : '#FFFFFF',
                  border: `1.5px solid ${s.active ? C.purple : C.borderSoft}`,
                  borderRadius: 16,
                  padding: '1.1rem 1rem',
                  textAlign: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.45rem', marginBottom: 4 }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: s.active ? C.green : C.mutedLight,
                    animation: s.active ? 'pulse 1.5s infinite' : 'none'
                  }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: s.active ? C.navy : C.muted }}>
                    {s.name}
                  </span>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: C.muted, display: 'block' }}>
                  {s.time}
                </span>
              </div>
            ))}
          </div>
        </Reveal>

        {/* 2. Clean Currency Pair Tickers (No Graphs) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }} className="forex-stats-grid">
          {tickers.map((t, idx) => (
            <Reveal key={t.pair} delay={0.12 + idx * 0.06}>
              <motion.div
                whileHover={{ y: -3 }}
                style={{
                  background: '#FFFFFF',
                  border: `1.5px solid ${C.borderSoft}`,
                  borderRadius: 18,
                  padding: '1.35rem 1.25rem',
                  boxShadow: '0 4px 15px rgba(124, 58, 237, 0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.825rem', fontWeight: 900, color: C.navy, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>{t.flag}</span> {t.pair}
                  </span>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 900,
                    color: t.trend === 'up' ? C.green : C.red,
                    background: t.trend === 'up' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    padding: '0.2rem 0.55rem', borderRadius: 100
                  }}>
                    {t.change}
                  </span>
                </div>

                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: C.navy, lineHeight: 1 }}>
                  {t.price}
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>

      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   08. PAMM SECTION — CAPITAL SIMULATOR
═══════════════════════════════════════════ */
function PAMMSection() {
  const [allocation, setAllocation] = useState(2500);

  const poolShare = ((allocation / 12800000) * 100).toFixed(4);
  const estDaily = (allocation * 0.012).toFixed(2);

  return (
    <Section id="pamm" style={{ padding: '6.5rem 1.25rem', background: C.bgLavender }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '3.5rem', alignItems: 'center' }} className="hero-grid">

          {/* Left Column Flow Concept */}
          <div>
            <Reveal>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em', color: C.purple, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                INSTITUTIONAL POOLED ASSETS
              </span>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 900, color: C.navy, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
                PAMM Asset Management
              </h2>
              <p style={{ fontSize: '0.95rem', color: C.muted, lineHeight: 1.7, fontWeight: 500, marginBottom: '2rem' }}>
                Participate in institutional percentage allocation management modules. Pooled investor capital replicates master strategy decisions with automatic proportional dividend distribution.
              </p>
            </Reveal>

            {/* Capital Flow Visual */}
            <Reveal delay={0.15}>
              <div style={{ background: '#FFFFFF', border: `1.5px solid ${C.borderSoft}`, borderRadius: 20, padding: '1.5rem', boxShadow: '0 8px 25px rgba(124, 58, 237, 0.05)' }}>
                <div style={{ textAlign: 'center', padding: '0.65rem', background: C.primaryGrad, color: 'white', fontWeight: 900, fontSize: '0.8rem', borderRadius: 10, marginBottom: '1.25rem' }}>
                  MASTER STRATEGY POOL ($12.8M)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }} className="stats-3col">
                  {['Investor 1', 'Investor 2', 'Investor 3'].map((inv, idx) => (
                    <div key={inv} style={{ background: C.softPurpleBg, border: `1px solid ${C.borderSoft}`, borderRadius: 10, padding: '0.65rem 0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: C.navy, display: 'block' }}>{inv}</span>
                      <span style={{ fontSize: '0.65rem', color: C.purple, fontWeight: 700 }}>Proportional Share</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right Column Interactive Allocation Simulator */}
          <div>
            <Reveal delay={0.2}>
              <div style={{ background: '#FFFFFF', border: `2px solid ${C.purple}`, borderRadius: 28, padding: '2.5rem', boxShadow: '0 20px 50px rgba(124, 58, 237, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 900, color: C.navy, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    YOUR CAPITAL ALLOCATION SIMULATOR
                  </span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: C.purple, background: C.lavenderLight, padding: '0.3rem 0.75rem', borderRadius: 100 }}>
                    PAMM Module
                  </span>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: C.muted }}>Allocation Capital</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: C.navy }} className="font-mono">${allocation.toLocaleString()} USDT</span>
                  </div>

                  <input
                    type="range"
                    min="100"
                    max="25000"
                    step="100"
                    value={allocation}
                    onChange={(e) => setAllocation(Number(e.target.value))}
                    style={{ width: '100%', accentColor: C.purple, cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: C.softPurpleBg, border: `1.5px solid ${C.borderSoft}`, borderRadius: 16, padding: '1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', display: 'block' }}>Pool Share</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: C.navy, marginTop: 4, display: 'block' }}>{poolShare}%</span>
                  </div>

                  <div style={{ background: C.softPurpleBg, border: `1.5px solid ${C.borderSoft}`, borderRadius: 16, padding: '1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', display: 'block' }}>Est. Daily Allocation</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: C.green, marginTop: 4, display: 'block' }}>+${estDaily} / DAY</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.675rem', color: C.mutedLight, textAlign: 'center', margin: 0, fontWeight: 500 }}>
                  *Illustrative estimate based on current master strategy historical performance metrics.
                </p>
              </div>
            </Reveal>
          </div>

        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   09. INCOME PATHWAYS SECTION
═══════════════════════════════════════════ */
/* ═══════════════════════════════════════════
   09. INCOME PATHWAYS SECTION
═══════════════════════════════════════════ */
function IncomeEcosystem() {
  const supportingStreams = [
    { icon: Network, title: 'Multi-Level Commission', tag: 'Team Referral', desc: 'Earn percentage-based referral commissions across your active network downline.' },
    { icon: Zap, title: 'Fastrack Acceleration', tag: 'Speed Bonus', desc: 'Unlock bonus payout accelerators upon achieving initial team volume targets.' },
    { icon: RefreshCw, title: 'Auto Compounding Engine', tag: 'Yield Multiplier', desc: 'Automatically reinvest daily yield dividends to accelerate long-term capital growth.' },
    { icon: Sparkles, title: 'Promotional Milestone Pool', tag: 'Global Leader Pool', desc: 'Qualify for global pool distributions based on top monthly performance benchmarks.' }
  ];

  return (
    <Section id="income" style={{ padding: '6.5rem 1.25rem', background: C.bg }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 650, margin: '0 auto 4rem' }}>
          <Reveal>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em', color: C.purple, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              MULTI-CHANNEL REVENUE
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 900, color: C.navy, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
              Integrated Income Pathways
            </h2>
            <p style={{ fontSize: '0.95rem', color: C.muted, lineHeight: 1.65, fontWeight: 500, margin: 0 }}>
              Maximize returns through daily copy trading dividends, team referrals, compounding strategies, and performance milestone bonuses.
            </p>
          </Reveal>
        </div>

        {/* 1. TOP HERO FEATURED CARD (Primary Income Stream) */}
        <Reveal delay={0.08}>
          <motion.div
            whileHover={{ y: -4 }}
            style={{
              background: '#FFFFFF',
              border: `2.5px solid ${C.purple}`,
              borderRadius: 28,
              padding: '2.5rem',
              marginBottom: '2rem',
              boxShadow: '0 20px 50px rgba(124, 58, 237, 0.1)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', alignItems: 'center' }} className="hero-grid">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 16, background: C.primaryGrad,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 6px 20px rgba(217, 70, 239, 0.3)'
                  }}>
                    <DollarSign size={26} color="white" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.675rem', fontWeight: 900, color: C.purple, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block' }}>
                      PRIMARY INCOME STREAM ★
                    </span>
                    <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: C.navy, margin: 0, lineHeight: 1.2 }}>
                      Daily Copy Trading Dividend
                    </h3>
                  </div>
                </div>

                <p style={{ fontSize: '0.925rem', color: C.muted, lineHeight: 1.65, fontWeight: 500, margin: '0 0 1.5rem 0' }}>
                  Earn automated daily strategy returns ranging from 1.0% to 1.5% allocated directly into your connected wallet based on your strategy package allocation tier.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ background: C.softPurpleBg, border: `1.5px solid ${C.borderSoft}`, borderRadius: 12, padding: '0.65rem 1.1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={16} color={C.green} />
                    <span style={{ fontSize: '0.825rem', fontWeight: 800, color: C.navy }}>Daily Automated Settlement</span>
                  </div>
                  <div style={{ background: C.softPurpleBg, border: `1.5px solid ${C.borderSoft}`, borderRadius: 12, padding: '0.65rem 1.1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={16} color={C.purple} />
                    <span style={{ fontSize: '0.825rem', fontWeight: 800, color: C.navy }}>USDT Payout Ready</span>
                  </div>
                </div>
              </div>

              {/* Right Side Stat Visual */}
              <div style={{ background: C.softPurpleBg, border: `1.5px solid ${C.borderSoft}`, borderRadius: 22, padding: '1.75rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>
                  ESTIMATED DAILY YIELD TARGET
                </span>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: C.green, marginBottom: '0.5rem', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
                  Up to 1.5% <span style={{ fontSize: '1rem', color: C.navy }}>/ Day</span>
                </div>
                <div style={{ background: '#FFFFFF', border: `1px solid ${C.borderSoft}`, borderRadius: 100, padding: '0.45rem 1rem', display: 'inline-block' }}>
                  <span style={{ fontSize: '0.725rem', fontWeight: 800, color: C.purple }}>100% Automated Infrastructure</span>
                </div>
              </div>
            </div>
          </motion.div>
        </Reveal>

        {/* 2. BOTTOM 4-COLUMN SUPPORTING CARDS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }} className="forex-stats-grid">
          {supportingStreams.map((item, idx) => (
            <Reveal key={item.title} delay={0.15 + idx * 0.08}>
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                  background: '#FFFFFF', border: `1.5px solid ${C.borderSoft}`, borderRadius: 22,
                  padding: '1.75rem 1.4rem', height: '100%', display: 'flex', flexDirection: 'column',
                  boxShadow: '0 10px 30px rgba(124, 58, 237, 0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 14, background: C.lavenderLight, border: `1px solid ${C.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <item.icon size={22} color={C.purple} />
                  </div>
                  <span style={{ fontSize: '0.625rem', fontWeight: 800, color: C.purple, background: C.softPurpleBg, border: `1px solid ${C.borderSoft}`, padding: '0.25rem 0.65rem', borderRadius: 100 }}>
                    {item.tag}
                  </span>
                </div>

                <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: C.navy, marginBottom: '0.65rem', lineHeight: 1.25 }}>
                  {item.title}
                </h4>

                <p style={{ fontSize: '0.825rem', color: C.muted, lineHeight: 1.6, fontWeight: 500, margin: 0 }}>
                  {item.desc}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>

      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   10. PACKAGE TIERS SECTION
═══════════════════════════════════════════ */
function PackagesSection() {
  const packages = [
    { name: 'STARTER', level: 'Begin', range: '$100 — $1,499', rate: '1.0%', period: 'DAILY ALLOCATION', popular: false },
    { name: 'ADVANCED', level: 'Scale', range: '$1,500 — $4,999', rate: '1.2%', period: 'DAILY ALLOCATION', popular: false },
    { name: 'PROFESSIONAL', level: 'Accelerate', range: '$5,000 — $24,999', rate: '1.4%', period: 'DAILY ALLOCATION', popular: true },
    { name: 'ELITE', level: 'Institutional', range: '$25,000+', rate: '1.5%', period: 'DAILY ALLOCATION', popular: false }
  ];

  return (
    <Section id="packages" style={{ padding: '6.5rem 1.25rem', background: C.bgLavender }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 650, margin: '0 auto 4rem' }}>
          <Reveal>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em', color: C.purple, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              CAPITAL STRATEGY TIERS
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 900, color: C.navy, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
              Select Your Strategy Package
            </h2>
            <p style={{ fontSize: '0.95rem', color: C.muted, lineHeight: 1.65, fontWeight: 500, margin: 0 }}>
              Choose the capital allocation tier that matches your investment target and unlock automated daily dividend distribution.
            </p>
          </Reveal>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', alignItems: 'center' }} className="about-grid">
          {packages.map((pkg, idx) => (
            <Reveal key={pkg.name} delay={idx * 0.08}>
              <motion.div
                whileHover={{ y: pkg.popular ? -8 : -5, scale: pkg.popular ? 1.03 : 1.015 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                  background: '#FFFFFF',
                  border: pkg.popular ? `2.5px solid ${C.purple}` : `1.5px solid ${C.borderSoft}`,
                  borderRadius: 24,
                  padding: pkg.popular ? '2.5rem 1.6rem' : '2.2rem 1.5rem',
                  boxShadow: pkg.popular ? '0 20px 45px rgba(124, 58, 237, 0.18)' : '0 10px 30px rgba(124, 58, 237, 0.06)',
                  position: 'relative', textAlign: 'center'
                }}
              >
                {pkg.popular && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: C.primaryGrad, color: 'white',
                    fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.12em',
                    padding: '0.35rem 1rem', borderRadius: 100,
                    boxShadow: '0 4px 15px rgba(217, 70, 239, 0.35)'
                  }}>
                    ★ MOST POPULAR
                  </div>
                )}

                <span style={{ fontSize: '0.675rem', fontWeight: 900, color: C.purple, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  {pkg.level}
                </span>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: C.navy, marginBottom: '0.5rem' }}>
                  {pkg.name}
                </h3>

                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: C.muted, marginBottom: '1.5rem' }}>
                  {pkg.range}
                </div>

                <div style={{ background: C.softPurpleBg, border: `1px solid ${C.borderSoft}`, borderRadius: 16, padding: '1.25rem 0.5rem', marginBottom: '1.75rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900, color: C.navy, lineHeight: 1, display: 'block', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
                    {pkg.rate}
                  </span>
                  <span style={{ fontSize: '0.625rem', fontWeight: 800, color: C.muted, letterSpacing: '0.08em', marginTop: 4, display: 'block' }}>
                    {pkg.period}
                  </span>
                </div>

                <Link
                  to="/register"
                  className="btn-sheen"
                  style={{
                    display: 'block', width: '100%',
                    background: pkg.popular ? C.primaryGrad : '#FFFFFF',
                    border: pkg.popular ? 'none' : `2px solid ${C.purple}`,
                    color: pkg.popular ? 'white' : C.purple,
                    textDecoration: 'none', fontWeight: 800, fontSize: '0.825rem',
                    padding: '0.85rem 0', borderRadius: 12,
                    boxShadow: pkg.popular ? '0 6px 20px rgba(217, 70, 239, 0.3)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  Select Package →
                </Link>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   11. COMPLIANCE SECTION
═══════════════════════════════════════════ */
function ComplianceSection() {
  const rules = [
    { icon: ShieldCheck, title: 'AML / KYC COMPLIANCE', desc: 'Strict identity verification protocols ensuring clean capital sources and international regulatory alignment.' },
    { icon: Lock, title: 'DEPOSIT BALANCES', desc: 'Non-custodial user balances secured via smart contract escrow with withdrawal permissions strictly held by user keys.' },
    { icon: Activity, title: 'MARKET SLIPPAGE CONTROL', desc: 'Slippage controls cap execution deviations to protect capital during volatile economic news events.' },
    { icon: CheckCircle2, title: 'CONTRACT DISCLOSURES', desc: 'Open audit reports and strategy risk disclosures accessible to all platform participants prior to allocation.' }
  ];

  return (
    <Section style={{ padding: '6.5rem 1.25rem', background: C.bg }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 650, margin: '0 auto 4rem' }}>
          <Reveal>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em', color: C.purple, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              RISK & GOVERNANCE
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 900, color: C.navy, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
              Compliance & Platform Governance
            </h2>
            <p style={{ fontSize: '0.95rem', color: C.muted, lineHeight: 1.65, fontWeight: 500, margin: 0 }}>
              Operating with institutional integrity through clear risk management guidelines and verified Web3 security standards.
            </p>
          </Reveal>
        </div>

        {/* 2x2 Clean Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }} className="about-grid">
          {rules.map((rule, idx) => (
            <Reveal key={rule.title} delay={idx * 0.08}>
              <div style={{
                background: C.softPurpleBg, border: `1.5px solid ${C.borderSoft}`, borderRadius: 20,
                padding: '1.75rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start'
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: C.primaryGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <rule.icon size={22} color="white" />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: C.navy, marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                    {rule.title}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: C.muted, lineHeight: 1.6, fontWeight: 500, margin: 0 }}>
                    {rule.desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <a href="#compliance" style={{
            fontSize: '0.825rem', fontWeight: 800, color: C.purple, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
          }}>
            View Full Risk Disclosure & Legal Terms →
          </a>
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   12. FINAL CALL TO ACTION SECTION
═══════════════════════════════════════════ */
function FinalCTA() {
  return (
    <Section style={{
      padding: '7rem 1.25rem',
      background: `radial-gradient(circle at 50% 100%, rgba(217, 70, 239, 0.18) 0%, transparent 55%), ${C.lavenderLight}`,
      color: C.navy, textAlign: 'center', position: 'relative'
    }}>
      <div style={{ maxWidth: 750, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <Reveal y={24}>
          <span style={{
            fontSize: '0.725rem', fontWeight: 800, letterSpacing: '0.2em',
            color: C.purple, textTransform: 'uppercase', display: 'block', marginBottom: '0.85rem'
          }}>
            SECURED AUTOMATED DEFI ECOSYSTEM
          </span>

          <h2 style={{
            fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            fontWeight: 900, color: C.navy,
            lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1.25rem'
          }}>
            Your Capital. Your Strategy. Your Next Move.
          </h2>

          <p style={{
            fontSize: '1rem', color: C.muted, maxWidth: 520,
            margin: '0 auto 2.5rem', lineHeight: 1.7, fontWeight: 500
          }}>
            Connect to verified copy trading strategies. Track yield distributions in real time. Take full control of your financial growth today.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }} className="cta-btn-group">
            <motion.div whileHover={{ scale: 1.04, y: -2 }}>
              <Link to="/register" className="btn-sheen" style={{
                background: C.primaryGrad,
                color: '#FFFFFF', textDecoration: 'none', fontWeight: 800, fontSize: '0.875rem',
                padding: '0.95rem 2.25rem', borderRadius: 14,
                boxShadow: '0 8px 25px rgba(217, 70, 239, 0.35)', display: 'inline-block'
              }}>
                Create Your Account
              </Link>
            </motion.div>

            <motion.a
              whileHover={{ scale: 1.04, y: -2, background: C.purple, color: '#FFFFFF' }}
              href="#how-it-works"
              style={{
                background: '#FFFFFF', border: `2px solid ${C.purple}`,
                color: C.purple, textDecoration: 'none', fontWeight: 800, fontSize: '0.875rem',
                padding: '0.95rem 2.25rem', borderRadius: 14,
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.12)', transition: 'all 0.2s ease'
              }}
            >
              How It Works
            </motion.a>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   13. DEEP NAVY FOOTER
═══════════════════════════════════════════ */
function Footer() {
  return (
    <footer style={{ background: C.navy, color: '#FFFFFF', padding: '4.5rem 1.25rem 2rem', position: 'relative' }}>
      {/* Top Gradient Border Bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: C.primaryGrad }} />

      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr', gap: '3rem', paddingBottom: '3.5rem', borderBottom: `1px solid ${C.borderSoftDark}` }} className="footer-grid">
          
          {/* Brand Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.primaryGrad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowUpRight size={20} color="white" strokeWidth={2.8} />
              </div>
              <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#FFFFFF', letterSpacing: '-0.02em' }}>CTC Copy Trade</span>
            </div>
            <p style={{ color: C.mutedLight, fontSize: '0.825rem', lineHeight: 1.75, maxWidth: 300, fontWeight: 400, margin: 0 }}>
              Automated copy trading infrastructure delivering institutional forex strategy replication through audited BSC smart contracts.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4 style={{ fontSize: '0.7rem', fontWeight: 900, color: C.pinkHighlight, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
              Platform
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['About Ecosystem', 'Copy Trading', 'Forex Sessions', 'PAMM Management', 'Strategy Packages'].map(item => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} style={{ color: C.mutedLight, textDecoration: 'none', fontSize: '0.825rem', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'}
                  onMouseLeave={e => e.currentTarget.style.color = C.mutedLight}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h4 style={{ fontSize: '0.7rem', fontWeight: 900, color: C.pinkHighlight, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
              Resources
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['How It Works', 'Audit Reports', 'BSC Smart Contract', 'API Documentation', 'Platform Support'].map(item => (
                <a key={item} href="#resources" style={{ color: C.mutedLight, textDecoration: 'none', fontSize: '0.825rem', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'}
                  onMouseLeave={e => e.currentTarget.style.color = C.mutedLight}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Column 4: Legal & Compliance */}
          <div>
            <h4 style={{ fontSize: '0.7rem', fontWeight: 900, color: C.pinkHighlight, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
              Legal
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['Terms of Service', 'Privacy Policy', 'Risk Disclosure', 'AML / KYC Policy', 'Security Standard'].map(item => (
                <a key={item} href="#legal" style={{ color: C.mutedLight, textDecoration: 'none', fontSize: '0.825rem', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'}
                  onMouseLeave={e => e.currentTarget.style.color = C.mutedLight}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div style={{ paddingTop: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: C.mutedLight }}>
            © 2026 CTC Copy Trade. All rights reserved.
          </span>
          <span style={{ fontSize: '0.7rem', color: C.mutedLight, maxWidth: 420, textAlign: 'right', lineHeight: 1.5 }}>
            Trading & strategy replication involves capital risk. Invest only what you can afford to risk.
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   ROOT LANDING PAGE COMPONENT
═══════════════════════════════════════════ */
export default function Landing() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      background: '#FFFFFF', color: C.navy, minHeight: '100vh',
      overflowX: 'hidden'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        .font-mono { font-family: 'Inter', system-ui, -apple-system, sans-serif !important; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.25); } }
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        .marquee-track { animation: marquee 28s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
        @keyframes sheen { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        .btn-sheen { position: relative; overflow: hidden; }
        .btn-sheen::after {
          content: ''; position: absolute; top: 0; left: 0; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
          transform: skewX(-20deg); animation: sheen 3.5s infinite;
        }
        .nav-link-hover::after {
          content: ''; position: absolute; bottom: 0; left: 0; width: 0; height: 2.5px;
          background: linear-gradient(90deg, #7C3AED, #D946EF); transition: width 0.25s ease;
        }
        .nav-link-hover:hover::after { width: 100%; }
        .hero-grid { grid-template-columns: 1.1fr 0.9fr !important; }
        .about-grid { grid-template-columns: repeat(4, 1fr) !important; }
        .footer-grid { grid-template-columns: 1.8fr 1fr 1fr 1fr !important; }
        .forex-stats-grid { grid-template-columns: repeat(4, 1fr) !important; }
        .stats-3col { grid-template-columns: repeat(3, 1fr) !important; }
        .hidden-mobile { display: flex !important; }
        .show-mobile { display: none !important; }

        @media (max-width: 950px) {
          .about-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .forex-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 2rem !important; }
        }
        @media (max-width: 850px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (max-width: 768px) {
          section { padding-top: 4rem !important; padding-bottom: 4rem !important; padding-left: 1rem !important; padding-right: 1rem !important; }
        }
        @media (max-width: 550px) {
          section { padding-top: 3.25rem !important; padding-bottom: 3.25rem !important; padding-left: 0.85rem !important; padding-right: 0.85rem !important; }
          .about-grid { grid-template-columns: 1fr !important; }
          .forex-stats-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .stats-3col { grid-template-columns: 1fr !important; gap: 0.5rem !important; }
          .cta-btn-group { flex-direction: column !important; width: 100% !important; }
          .cta-btn-group a, .cta-btn-group button, .cta-btn-group div { width: 100% !important; text-align: center !important; justify-content: center !important; }
          h1 { font-size: 2.2rem !important; }
          h2 { font-size: 1.85rem !important; }
        }
      `}</style>

      <Preloader onComplete={() => setLoaded(true)} />

      {/* Sticky Floating Glass Navbar */}
      <Navbar />

      {/* 01. Hero Showcase */}
      <HeroSection />

      <SectionHairline />

      {/* 02. Trust Ticker */}
      <TrustStrip />

      <SectionHairline />

      {/* 03. Global Financial Ecosystem */}
      <AboutSection />

      <SectionHairline />

      {/* 04. Copy Trading Showcase */}
      <CopyTradingSection />

      <SectionHairline />

      {/* 05. How Copy Trading Works */}
      <HowItWorksSection />

      <SectionHairline />

      {/* 06. Forex Market Sessions */}
      <ForexSection />

      <SectionHairline />

      {/* 07. PAMM Asset Management */}
      <PAMMSection />

      <SectionHairline />

      {/* 08. Income Pathways */}
      <IncomeEcosystem />

      <SectionHairline />

      {/* 09. Package Tiers */}
      <PackagesSection />

      <SectionHairline />

      {/* 10. Compliance & Governance */}
      <ComplianceSection />

      <SectionHairline />

      {/* 11. Final CTA */}
      <FinalCTA />

      {/* 12. Deep Navy Footer */}
      <Footer />
    </div>
  );
}
