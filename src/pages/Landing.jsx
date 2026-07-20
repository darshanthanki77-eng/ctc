import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform, useInView } from 'framer-motion';
import {
  ShieldCheck, Eye, Globe, TrendingUp, TrendingDown, ArrowRight,
  BarChart2, Zap, Users, Lock, CheckCircle2, Menu, X,
  DollarSign, Network, Wallet, RefreshCw, ArrowUpRight,
  AlertTriangle, Sparkles, Star, Activity, Cpu, Layers, ChevronRight, Play, Check, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

/* ═══════════════════════════════════════════
   PREMIUM CTC BRAND PALETTE & EASINGS
═══════════════════════════════════════════ */
const C = {
  bg:         '#FFFFFF', // Clean White Surface (Odd Sections)
  bgLavender: 'linear-gradient(180deg, #F4EFFF 0%, #EAE0FF 100%)', // Soft Lavender Surface (Even Sections)
  darkSlate:  '#0F172A', // Dark Noir Slate for Final CTA & Preloader
  borderBrand:'#7C3AED', // Royal CTC Purple Border
  borderPink: '#F310FD', // Dynamic CTC Pink Border
  borderSoft: '#E2D9F7', // Soft visible purple border tint
  text:       '#0F172A', // Slate 900
  muted:      '#475569', // Slate 600
  mutedLight: '#94A3B8', // Slate 400
  purple:     '#7C3AED', // Royal CTC Purple
  pink:       '#F310FD', // Dynamic CTC Pink
  gold:       '#F59E0B', // Amber Gold
  green:      '#10B981', // Emerald Green
  red:        '#EF4444', // Red
};

// Custom Easing Curves from Motion Spec
const EXPO_OUT = [0.16, 1, 0.3, 1];

/* ═══════════════════════════════════════════
   CONNECTIVE HAIRLINE TRANSITION COMPONENT
═══════════════════════════════════════════ */
function SectionHairline() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <div ref={ref} style={{ width: '100%', height: 1.5, background: 'transparent', position: 'relative', overflow: 'hidden' }}>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.8, ease: EXPO_OUT }}
        style={{
          width: '100%', height: '100%', originX: 0,
          background: 'linear-gradient(90deg, rgba(124, 58, 237, 0.4) 0%, rgba(243, 16, 253, 0.4) 100%)'
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════
   SCROLL REVEAL UTILITY (ONCE: TRUE)
═══════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════
   ANIMATED NUMBER COUNTER (TABULAR NUMS)
═══════════════════════════════════════════ */
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
      // Ease out cubic
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
    <span ref={ref} className="font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}{val.toFixed(decimals)}{suffix}
    </span>
  );
}

/* ═══════════════════════════════════════════
   00. PRELOADER — TERMINAL BOOTUP
═══════════════════════════════════════════ */
function Preloader({ onComplete }) {
  const [exit, setExit] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExit(true);
      setTimeout(() => onComplete(), 450);
    }, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!exit && (
        <motion.div
          key="preloader"
          exit={{ y: '-100%' }}
          transition={{ duration: 0.45, ease: EXPO_OUT }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: C.darkSlate, color: 'white',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}
        >
          {/* Animated Squiggle Price Line */}
          <div style={{ width: 140, height: 60, marginBottom: '1.25rem', position: 'relative' }}>
            <svg width="140" height="60" viewBox="0 0 140 60" fill="none">
              <defs>
                <linearGradient id="loaderGrad" x1="0" y1="0" x2="140" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor={C.purple} />
                  <stop offset="100%" stopColor={C.pink} />
                </linearGradient>
              </defs>
              <motion.path
                d="M 10,45 Q 35,5 60,35 T 110,15 T 130,25"
                stroke="url(#loaderGrad)"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, ease: EXPO_OUT }}
              />
            </svg>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(243, 16, 253, 0.4)'
            }}>
              <TrendingUp size={20} color="white" />
            </div>
            <span style={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: '0.1em' }}>CTC</span>
          </motion.div>

          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: C.mutedLight, letterSpacing: '0.25em', marginTop: 8 }}>
            INITIALIZING CORE TERMINAL...
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════
   01. NAVBAR — GLASSMORPHISM FIXED
═══════════════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = ['About', 'Copy Trading', 'Forex', 'PAMM', 'Income'];

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: scrolled ? '0.75rem 2rem' : '1.25rem 2rem',
        background: scrolled ? 'rgba(255, 255, 255, 0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? `1.5px solid ${C.borderSoft}` : '1px solid transparent',
        transition: 'all 0.3s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: scrolled ? '0 4px 20px rgba(124, 58, 237, 0.06)' : 'none'
      }}>
        <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <a href="#hero" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(124, 58, 237, 0.25)'
            }}>
              <TrendingUp size={20} color="white" />
            </div>
            <span style={{
              fontWeight: 900, fontSize: '1.3rem', letterSpacing: '-0.02em',
              background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>CTC</span>
          </a>

          {/* Desktop links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }} className="hidden-mobile">
            {links.map(l => (
              <a
                key={l}
                href={`#${l.toLowerCase().replace(' ', '-')}`}
                className="nav-link-hover"
                style={{
                  color: C.muted, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 700,
                  position: 'relative', paddingBottom: 4
                }}
              >
                {l}
              </a>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }} className="hidden-mobile">
            <Link to="/login" style={{
              color: C.muted, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 700,
              padding: '0.5rem 1rem'
            }}>Login</Link>
            <motion.a
              whileHover={{ scale: 1.04 }}
              href="#packages"
              style={{
                background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
                color: 'white', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 800,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '0.7rem 1.6rem', borderRadius: 10,
                boxShadow: '0 4px 15px rgba(243, 16, 253, 0.3)'
              }}
            >START TRADING →</motion.a>
          </div>

          {/* Mobile button */}
          <button onClick={() => setMenuOpen(true)} className="show-mobile" style={{
            background: 'none', border: 'none', color: C.text, cursor: 'pointer'
          }}>
            <Menu size={24} />
          </button>
        </div>
      </nav>

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
              background: '#FFFFFF', padding: '2rem',
              display: 'flex', flexDirection: 'column', gap: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 900, fontSize: '1.25rem', color: C.purple }}>CTC</span>
              <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
              {links.map(l => (
                <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`} onClick={() => setMenuOpen(false)} style={{
                  color: C.text, textDecoration: 'none', fontSize: '1.1rem', fontWeight: 800
                }}>{l}</a>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem', paddingTop: '2rem', marginTop: 'auto' }}>
              <Link to="/login" onClick={() => setMenuOpen(false)} style={{
                flex: 1, textAlign: 'center', padding: '0.85rem', borderRadius: 10,
                border: `1.5px solid ${C.purple}`, textDecoration: 'none', fontWeight: 800, color: C.text
              }}>Login</Link>
              <a href="#packages" onClick={() => setMenuOpen(false)} style={{
                flex: 1, textAlign: 'center', padding: '0.85rem', borderRadius: 10,
                background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
                color: 'white', textDecoration: 'none', fontWeight: 800
              }}>Start Trading</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ═══════════════════════════════════════════
   02. SECTION 1 — HERO SHOWCASE (WHITE)
═══════════════════════════════════════════ */
function HeroMarketCard() {
  const chartData = [
    { day: 'Mon', v: 1000 },
    { day: 'Tue', v: 1080 },
    { day: 'Wed', v: 1140 },
    { day: 'Thu', v: 1120 },
    { day: 'Fri', v: 1210 },
    { day: 'Sat', v: 1250 },
    { day: 'Sun', v: 1280 }
  ];

  return (
    <div style={{ position: 'relative' }}>
      {/* Floating Top Badge */}
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute', top: -18, right: 15, zIndex: 10,
          background: '#FFFFFF', border: 'none',
          borderRadius: 100, padding: '0.45rem 1.1rem',
          boxShadow: '0 8px 25px rgba(124, 58, 237, 0.14)',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}
      >
        <Zap size={14} color={C.purple} />
        <span style={{ fontSize: '0.725rem', fontWeight: 800, color: C.text }}>
          100% Auto Copy Mirroring
        </span>
      </motion.div>

      {/* Main Crisp Showcase Card */}
      <motion.div
        whileHover={{ y: -8, scale: 1.015 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{
          background: '#FFFFFF',
          border: `2px solid ${C.purple}`,
          borderRadius: 24,
          padding: '2.25rem',
          boxShadow: '0 20px 45px rgba(124, 58, 237, 0.12)',
          position: 'relative',
          cursor: 'pointer'
        }}
      >
        {/* Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: C.green, animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: C.muted, letterSpacing: '0.05em' }}>
              COPY TRADE PORTFOLIO
            </span>
          </div>
          <span style={{
            fontSize: '0.65rem', fontWeight: 800, color: 'white',
            background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
            padding: '0.25rem 0.75rem', borderRadius: 100
          }}>
            BSC Smart Contract
          </span>
        </div>

        {/* Big Clean Yield Number */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
            ESTIMATED DAILY YIELD GENERATED
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 900, color: C.text, lineHeight: 1 }}>+$1,280.50</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: C.green, display: 'flex', alignItems: 'center', gap: 2 }}>
              <TrendingUp size={16} /> +<AnimatedCounter from={0} to={42.8} decimals={1} suffix="%" />
            </span>
          </div>
        </div>

        {/* Smooth Area Chart */}
        <div style={{ height: 110, width: '100%', marginBottom: '1.5rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="heroChartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.purple} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={C.purple} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={C.purple} strokeWidth={3} fill="url(#heroChartGlow)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Master Trader List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            TOP MIRRORED MASTER TRADERS
          </span>
          {[
            { name: 'Master Alpha Quant', copiers: '1,420 Copiers', roi: '+68.4% ROI' },
            { name: 'Master Scalp Trader', copiers: '980 Copiers', roi: '+42.8% ROI' }
          ].map(t => (
            <motion.div
              key={t.name}
              whileHover={{ scale: 1.02 }}
              style={{
                background: '#F8F9FD', border: `1.5px solid ${C.borderSoft}`,
                borderRadius: 14, padding: '0.85rem 1.1rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: C.text, display: 'block' }}>{t.name}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: C.muted }}>{t.copiers}</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 900, color: C.green }}>{t.roi}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function HeroSection() {
  return (
    <Section id="hero" style={{ padding: '8.5rem 1.5rem 5.5rem', background: C.bg }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '3.5rem', alignItems: 'center' }} className="hero-grid">

          {/* Left Column */}
          <div>
            <Reveal>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: '#F8F9FD', border: `1.5px solid ${C.borderSoft}`,
                borderRadius: 100, padding: '0.45rem 1.1rem', marginBottom: '1.5rem',
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.06)'
              }}>
                <TrendingUp size={14} color={C.purple} />
                <span style={{ fontSize: '0.725rem', color: C.purple, fontWeight: 800, letterSpacing: '0.1em' }}>
                  AUTOMATED COPY TRADING PLATFORM
                </span>
              </div>
            </Reveal>

            {/* Split Headline beat */}
            <div style={{ marginBottom: '1.5rem' }}>
              <Reveal delay={0.08}>
                <h1 style={{ fontSize: 'clamp(2.85rem, 5.5vw, 4.5rem)', fontWeight: 900, lineHeight: 1.05, color: C.text, letterSpacing: '-0.03em' }}>
                  Trade Smart.
                </h1>
              </Reveal>
              <Reveal delay={0.20}>
                <h1 style={{
                  fontSize: 'clamp(2.85rem, 5.5vw, 4.5rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em',
                  background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                  Earn Daily.
                </h1>
              </Reveal>
            </div>

            <Reveal delay={0.28}>
              <p style={{ color: C.muted, fontSize: '1.05rem', lineHeight: 1.7, maxWidth: 500, marginBottom: '2.25rem', fontWeight: 500 }}>
                Automatically mirror top master trader portfolios in real time. Generate daily returns directly into your account on Binance Smart Chain — 100% automated.
              </p>
            </Reveal>

            {/* CTAs */}
            <Reveal delay={0.36}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center' }}>
                <motion.a
                  whileHover={{ scale: 1.04, y: -2 }}
                  href="#packages"
                  className="btn-sheen"
                  style={{
                    background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
                    color: 'white', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem',
                    padding: '0.95rem 2.25rem', borderRadius: 14,
                    boxShadow: '0 8px 25px rgba(243, 16, 253, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.6rem'
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

            {/* Feature Badges */}
            <Reveal delay={0.44}>
              <div style={{ display: 'flex', gap: '0.85rem', marginTop: '2.75rem', flexWrap: 'wrap' }}>
                {[
                  { icon: Zap, text: '100% Automated' },
                  { icon: ShieldCheck, text: 'Audited Contracts' },
                  { icon: DollarSign, text: 'Daily USDT Payouts' }
                ].map((badge, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -4 }}
                    style={{
                      background: '#F8F9FD', border: 'none', borderRadius: 14, padding: '0.65rem 1.1rem',
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.04)', cursor: 'pointer'
                    }}
                  >
                    <badge.icon size={16} color={C.purple} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: C.text }}>{badge.text}</span>
                  </motion.div>
                ))}
              </div>
            </Reveal>

            {/* Rating Bar */}
            <Reveal delay={0.52}>
              <motion.div
                whileHover={{ y: -3 }}
                style={{
                  marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.65rem 1.1rem', background: '#F8F9FD', borderRadius: 14, maxWidth: 400,
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.04)', cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', gap: 3 }}>
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <Star key={i} size={15} fill={C.gold} color={C.gold} />
                  ))}
                </div>
                <span style={{ fontSize: '0.75rem', color: C.muted, fontWeight: 700 }}>
                  Trusted by <strong style={{ color: C.text }}>10,000+</strong> active copiers
                </span>
              </motion.div>
            </Reveal>
          </div>

          {/* Right Column */}
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
   03. SECTION 2 — TRUST STRIP TICKER (WHITE)
═══════════════════════════════════════════ */
function TrustStrip() {
  const list = [
    { icon: ShieldCheck, text: 'Audited Contracts' },
    { icon: Zap, text: 'Automated Dispatch' },
    { icon: Lock, text: 'Secure Platform' },
    { icon: Globe, text: 'Binance Smart Chain' },
    { icon: Users, text: '10,000+ Investors' },
    { icon: Activity, text: 'Real-Time Execution' },
  ];

  return (
    <div style={{
      background: '#FFFFFF', padding: '1.25rem 0', overflow: 'hidden', position: 'relative'
    }}>
      <div style={{ display: 'flex', gap: '3.5rem', whiteSpace: 'nowrap' }} className="marquee-track">
        {[...list, ...list, ...list].map((item, i) => (
          <span key={i} style={{
            fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.12em', color: C.muted,
            display: 'inline-flex', alignItems: 'center', gap: '0.6rem'
          }}>
            <item.icon size={16} color={C.purple} />
            <span style={{ color: C.text }}>{item.text}</span>
            <span style={{ color: C.pink, margin: '0 0.5rem' }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   04. SECTION 3 — ABOUT ECOSYSTEM (LAVENDER)
═══════════════════════════════════════════ */
function AboutSection() {
  const cards = [
    { icon: ShieldCheck, title: 'SECURE INFRASTRUCTURE', desc: 'Protected by security-focused infrastructure and transparent technology.' },
    { icon: Eye, title: 'FULL TRANSPARENCY', desc: 'Clear processes, visible analytics, and transparent activity.' },
    { icon: Globe, title: 'GLOBAL CONNECTIVITY', desc: 'Connect users to a global ecosystem built around modern financial markets.' },
    { icon: Zap, title: 'INTELLIGENT ROUTING', desc: 'Technology-driven tools designed to support intelligent strategy execution.' }
  ];

  return (
    <Section id="about" style={{ padding: '6.5rem 1.5rem', background: C.bgLavender }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 650, margin: '0 auto 4rem' }}>
          <Reveal>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em', color: C.purple, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              NOT JUST A PLATFORM
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 900, color: C.text, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '1rem' }}>
              A Global Financial Ecosystem
            </h2>
            <p style={{ fontSize: '0.925rem', color: C.muted, lineHeight: 1.65, fontWeight: 500, margin: 0 }}>
              We bridge traditional forex copy trading logic with smart decentralized infrastructure, providing an automated yield experience.
            </p>
          </Reveal>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }} className="about-grid">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -8, scale: 1.025 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                  background: '#FFFFFF', border: 'none', borderRadius: 24,
                  padding: '2.25rem 1.75rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                  boxShadow: '0 10px 30px rgba(124, 58, 237, 0.08)', cursor: 'pointer'
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem',
                  boxShadow: '0 6px 18px rgba(124, 58, 237, 0.25)', flexShrink: 0
                }}>
                  <c.icon size={22} color="white" />
                </div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: C.text, letterSpacing: '0.05em', marginBottom: '0.65rem', textTransform: 'uppercase' }}>
                  {c.title}
                </h3>
                <p style={{ fontSize: '0.825rem', color: C.muted, lineHeight: 1.6, fontWeight: 500, margin: 0 }}>
                  {c.desc}
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
   05. SECTION 4 — COPY TRADING SHOWCASE (WHITE)
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

  const featureBadges = [
    { title: 'Follow Proven Master Traders', desc: 'Real-time ROI, win rate metrics, and audited trade logs updated live.', icon: Star, bgGradient: `linear-gradient(135deg, ${C.purple}, ${C.pink})`, shadow: '0 6px 18px rgba(124, 58, 237, 0.25)' },
    { title: 'Proportional Balance Safety', desc: 'Smart contracts match your capital balance with zero over-exposure risk.', icon: ShieldCheck, bgGradient: `linear-gradient(135deg, #6366F1, ${C.purple})`, shadow: '0 6px 18px rgba(99, 102, 241, 0.25)' },
    { title: 'Ultra-Low 18ms Latency Mirroring', desc: 'Synchronous execution engine connects directly to Binance Smart Chain.', icon: Zap, bgGradient: `linear-gradient(135deg, ${C.purple}, #D946EF)`, shadow: '0 6px 18px rgba(217, 70, 239, 0.25)' }
  ];

  return (
    <Section id="copy-trading" style={{ padding: '6.5rem 1.5rem', background: C.bg }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '3.5rem', alignItems: 'center' }} className="hero-grid">
          <div>
            <Reveal>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: '#F8F9FD', border: `1.5px solid ${C.purple}`,
                borderRadius: 100, padding: '0.45rem 1.1rem', marginBottom: '1.5rem', boxShadow: '0 4px 15px rgba(124, 58, 237, 0.1)'
              }}>
                <Zap size={14} color={C.purple} />
                <span style={{ fontSize: '0.725rem', color: C.purple, fontWeight: 800, letterSpacing: '0.1em' }}>
                  REAL-TIME AUTOMATED MIRRORING
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, lineHeight: 1.1, color: C.text, letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>
                You don't need to trade alone.
              </h2>
            </Reveal>

            <Reveal delay={0.16}>
              <h2 style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '1.25rem',
                background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>
                Mirror Master Profits Live.
              </h2>
            </Reveal>

            <Reveal delay={0.24}>
              <p style={{ fontSize: '0.95rem', color: C.muted, lineHeight: 1.7, marginBottom: '2rem', fontWeight: 500 }}>
                Our network replicates trades automatically from verified provider portfolios directly to your account. Select a strategy profile, input capital parameters, and watch the system manage the rest.
              </p>
            </Reveal>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
              {featureBadges.map((feat, idx) => (
                <Reveal key={feat.title} delay={0.3 + idx * 0.08}>
                  <motion.div
                    whileHover={{ y: -4, scale: 1.015, borderColor: C.purple }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    style={{
                      background: '#F8F9FD', border: `1.5px solid ${C.borderSoft}`, borderRadius: 18, padding: '1.1rem 1.35rem',
                      display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 8px 25px rgba(124, 58, 237, 0.06)', cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: feat.bgGradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: feat.shadow
                    }}>
                      <feat.icon size={22} color="white" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: C.text, margin: 0 }}>{feat.title}</h4>
                      <p style={{ fontSize: '0.75rem', color: C.muted, fontWeight: 500, margin: '3px 0 0 0', lineHeight: 1.5 }}>{feat.desc}</p>
                    </div>
                  </motion.div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.55}>
              <motion.a
                whileHover={{ scale: 1.04, y: -2 }}
                href="#packages"
                style={{
                  background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
                  color: 'white', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem',
                  padding: '0.95rem 2.25rem', borderRadius: 14, boxShadow: '0 8px 25px rgba(243, 16, 253, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.6rem'
                }}
              >
                Copy Master Traders Now <ArrowRight size={18} />
              </motion.a>
            </Reveal>
          </div>

          {/* Right Column Strategy Showcase */}
          <div>
            <Reveal delay={0.2}>
              <div style={{ background: '#FFFFFF', border: 'none', borderRadius: 28, padding: '2.25rem', boxShadow: '0 20px 50px rgba(124, 58, 237, 0.1)', position: 'relative' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={18} color={C.purple} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 900, color: C.text, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        SELECT MASTER STRATEGY
                      </span>
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: C.purple, background: 'rgba(124, 58, 237, 0.1)', padding: '0.3rem 0.85rem', borderRadius: 100 }}>
                      Live Execution Engine
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', background: '#F4EFFF', padding: '0.4rem', borderRadius: 16, border: 'none' }}>
                    {strategies.map((s, idx) => (
                      <button
                        key={s.name}
                        onClick={() => setActiveStrategy(idx)}
                        style={{
                          flex: 1, padding: '0.6rem 0.5rem', borderRadius: 12, border: 'none',
                          background: activeStrategy === idx ? `linear-gradient(135deg, ${C.purple}, ${C.pink})` : 'transparent',
                          color: activeStrategy === idx ? 'white' : C.muted,
                          fontWeight: activeStrategy === idx ? 900 : 700, fontSize: '0.725rem', cursor: 'pointer', transition: 'all 0.25s', textAlign: 'center',
                          boxShadow: activeStrategy === idx ? '0 4px 15px rgba(243, 16, 253, 0.3)' : 'none'
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
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: C.text, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {current.name} <CheckCircle2 size={18} color={C.purple} />
                        </h3>
                        <span style={{ fontSize: '0.725rem', fontWeight: 700, color: C.muted }}>
                          {current.badge} • {current.copiers}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', display: 'block' }}>WIN RATE</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 900, color: C.green }}>
                          <AnimatedCounter from={80} to={current.winRate} suffix="%" />
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      <div style={{ background: '#FAF8FF', border: `1.5px solid ${C.borderSoft}`, borderRadius: 14, padding: '0.8rem 0.5rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', display: 'block' }}>Master Profit</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 900, color: C.text, marginTop: 4, display: 'block' }}>
                          $<AnimatedCounter from={10000} to={current.masterProfit} decimals={0} />
                        </span>
                      </div>
                      <div style={{ background: '#FAF8FF', border: `1.5px solid ${C.borderSoft}`, borderRadius: 14, padding: '0.8rem 0.5rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', display: 'block' }}>Volume Copied</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 900, color: C.text, marginTop: 4, display: 'block' }}>{current.totalVolume}</span>
                      </div>
                      <div style={{ background: '#FAF8FF', border: `1.5px solid ${C.borderSoft}`, borderRadius: 14, padding: '0.8rem 0.5rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', display: 'block' }}>Copy Latency</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 900, color: C.text, marginTop: 4, display: 'block' }}>{current.latency}</span>
                      </div>
                    </div>

                    <div style={{ height: 100, width: '100%', marginBottom: '1.25rem' }}>
                      <ResponsiveContainer width="100%" height="100%">
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

                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1.5px solid #10B981', borderRadius: 16, padding: '0.85rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
   06. SECTION 5 — HOW IT WORKS STEP-BY-STEP (LAVENDER)
═══════════════════════════════════════════ */
function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { num: '01', title: 'CHOOSE TIER', desc: 'Browse package tiers ($100 to $25,000+) and pick the allocation rate that matches your capital targets.' },
    { num: '02', title: 'ALLOCATE USDT', desc: 'Transfer USDT directly to your non-custodial Smart Contract allocation wallet on Binance Smart Chain.' },
    { num: '03', title: 'CONNECT PORTFOLIO', desc: 'Connect your Web3 dashboard terminal to initiate automatic trade signal reception.' },
    { num: '04', title: 'AUTO MIRROR', desc: 'Pro master trader orders execute synchronously across your connected sub-account in real time.' },
    { num: '05', title: 'DAILY DISPATCH', desc: 'Earned dividends automatically credit into your platform balance ready for compounding or withdrawal.' }
  ];

  return (
    <Section id="how-it-works" style={{ padding: '6.5rem 1.5rem', background: C.bgLavender }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 4rem' }}>
          <Reveal>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em', color: C.purple, textTransform: 'uppercase' }}>
              SIMPLE STEP-BY-STEP
            </span>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 900, color: C.text, marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              How Copy Trading Works
            </h2>
            <p style={{ fontSize: '0.85rem', color: C.muted, fontWeight: 500 }}>
              Click through the process below to explore how automated copy trading operates.
            </p>
          </Reveal>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          {steps.map((s, idx) => (
            <button
              key={s.num}
              onClick={() => setActiveStep(idx)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.65rem 1.25rem', borderRadius: 100,
                border: `1.5px solid ${activeStep === idx ? C.purple : C.borderSoft}`,
                background: activeStep === idx ? `linear-gradient(135deg, ${C.purple}, ${C.pink})` : '#FFFFFF',
                color: activeStep === idx ? 'white' : C.text,
                fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.25s',
                boxShadow: activeStep === idx ? '0 6px 20px rgba(124, 58, 237, 0.25)' : '0 4px 15px rgba(0,0,0,0.03)'
              }}
            >
              <span>{s.num}</span>
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{
              background: '#FFFFFF', border: 'none',
              borderRadius: 24, padding: '2.5rem', maxWidth: 700, margin: '0 auto', textAlign: 'center',
              boxShadow: '0 15px 40px rgba(124, 58, 237, 0.08)'
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: C.purple, letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>
              STEP {steps[activeStep].num} • {steps[activeStep].title}
            </span>
            <p style={{ fontSize: '1rem', color: C.muted, lineHeight: 1.7, fontWeight: 500, margin: 0 }}>
              {steps[activeStep].desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   07. SECTION 6 — FOREX LIVE SESSIONS (WHITE)
═══════════════════════════════════════════ */
function ForexSection() {
  const [activeSession, setActiveSession] = useState(0);

  const sessions = [
    { name: 'London Session', hours: '08:00 - 16:00 GMT', status: 'OPEN • Peak Volatility', isOpen: true, statusColor: C.green, pairs: [{ pair: 'EUR/USD', price: '1.0854', change: '+0.34%', isUp: true }, { pair: 'GBP/USD', price: '1.2640', change: '+0.52%', isUp: true }, { pair: 'EUR/GBP', price: '0.8586', change: '-0.12%', isUp: false }] },
    { name: 'New York Session', hours: '13:00 - 21:00 GMT', status: 'OPEN • Overlap Peak', isOpen: true, statusColor: C.green, pairs: [{ pair: 'USD/JPY', price: '154.20', change: '-0.18%', isUp: false }, { pair: 'USD/CAD', price: '1.3680', change: '+0.25%', isUp: true }, { pair: 'GBP/USD', price: '1.2640', change: '+0.52%', isUp: true }] },
    { name: 'Sydney Session', hours: '22:00 - 06:00 GMT', status: 'PRE-OPEN • Pacific Belt', isOpen: false, statusColor: C.purple, pairs: [{ pair: 'AUD/USD', price: '0.6580', change: '+0.41%', isUp: true }, { pair: 'NZD/USD', price: '0.6120', change: '+0.15%', isUp: true }, { pair: 'AUD/JPY', price: '101.45', change: '+0.68%', isUp: true }] },
    { name: 'Tokyo Session', hours: '00:00 - 08:00 GMT', status: 'STANDBY • Asian Liquidity', isOpen: false, statusColor: C.purple, pairs: [{ pair: 'USD/JPY', price: '154.20', change: '-0.18%', isUp: false }, { pair: 'EUR/JPY', price: '167.35', change: '+0.14%', isUp: true }, { pair: 'AUD/JPY', price: '101.45', change: '+0.68%', isUp: true }] }
  ];

  const currentSession = sessions[activeSession];

  return (
    <Section id="forex" style={{ padding: '6.5rem 1.5rem', background: C.bg }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '3.5rem', alignItems: 'center' }} className="hero-grid">
          <div>
            <Reveal>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: '#F8F9FD', border: 'none', borderRadius: 100, padding: '0.45rem 1.1rem', marginBottom: '1.5rem', boxShadow: '0 6px 20px rgba(124, 58, 237, 0.08)'
              }}>
                <Globe size={14} color={C.purple} />
                <span style={{ fontSize: '0.725rem', color: C.purple, fontWeight: 800, letterSpacing: '0.1em' }}>
                  GLOBAL LIQUIDITY ACCESS
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, lineHeight: 1.1, color: C.text, letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>
                Forex Markets Never Sleep.
              </h2>
            </Reveal>

            <Reveal delay={0.16}>
              <h2 style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '1.25rem',
                background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>
                Capture 24/5 Liquidity Runs.
              </h2>
            </Reveal>

            <Reveal delay={0.24}>
              <p style={{ fontSize: '0.95rem', color: C.muted, lineHeight: 1.7, marginBottom: '2rem', fontWeight: 500 }}>
                The global forex market moves over 6.6 Trillion USD daily. We capture micro-opportunities across primary currency pairs using audited risk parameters to target stable yield structures.
              </p>
            </Reveal>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
              <Reveal delay={0.32}>
                <div style={{ background: '#F8F9FD', border: 'none', borderRadius: 20, padding: '1.35rem', boxShadow: '0 8px 25px rgba(0, 0, 0, 0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <BarChart2 size={18} color={C.purple} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>DAILY TURNOVER</span>
                  </div>
                  <span style={{ fontSize: '2.25rem', fontWeight: 900, color: C.text, display: 'block', lineHeight: 1 }}>$6.6T</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: C.green, marginTop: 6, display: 'block' }}>▲ Deepest Global Market</span>
                </div>
              </Reveal>

              <Reveal delay={0.4}>
                <div style={{ background: '#F8F9FD', border: `1.5px solid ${C.purple}`, borderRadius: 20, padding: '1.35rem', boxShadow: '0 12px 30px rgba(243,16,253,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Clock size={18} color={C.pink} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>MARKET COVERAGE</span>
                  </div>
                  <span style={{ fontSize: '2.25rem', fontWeight: 900, color: C.text, display: 'block', lineHeight: 1 }}>24/5</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: C.purple, marginTop: 6, display: 'block' }}>Continuous Auto Execution</span>
                </div>
              </Reveal>
            </div>
          </div>

          <div>
            <Reveal delay={0.2}>
              <div style={{ background: '#FFFFFF', border: `2px solid ${C.purple}`, borderRadius: 28, padding: '2.25rem', boxShadow: '0 25px 60px rgba(124, 58, 237, 0.12)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Globe size={18} color={C.purple} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 900, color: C.text, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      LIVE TRADING SESSIONS
                    </span>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: C.purple, background: 'rgba(124,58,237,0.08)', padding: '0.25rem 0.75rem', borderRadius: 100 }}>
                    Global Hub Tracker
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {sessions.map((s, idx) => (
                    <button
                      key={s.name}
                      onClick={() => setActiveSession(idx)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', borderRadius: 16,
                        border: `1.5px solid ${activeSession === idx ? C.purple : C.borderSoft}`,
                        background: activeSession === idx ? '#F8F9FD' : '#FFFFFF', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {/* Live Radiating Pulse Ring for Open Sessions */}
                        <div style={{ position: 'relative', width: 10, height: 10 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.isOpen ? C.green : C.mutedLight }} />
                          {s.isOpen && (
                            <div className="pulse-ring" style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `2px solid ${C.green}` }} />
                          )}
                        </div>
                        <div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: C.text, display: 'block' }}>{s.name}</span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: C.muted }}>{s.hours}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: s.statusColor, background: `${s.statusColor}15`, padding: '0.35rem 0.75rem', borderRadius: 100 }}>
                        {s.status}
                      </span>
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSession}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.75rem' }}>
                      ACTIVE PAIR SPREADS ({currentSession.name.split(' ')[0]})
                    </span>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                      {currentSession.pairs.map(p => (
                        <div key={p.pair} style={{ background: '#F8F9FD', border: `1.5px solid ${C.borderSoft}`, borderRadius: 14, padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: C.text, display: 'block' }}>{p.pair}</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 900, color: C.text, marginTop: 2, display: 'block' }}>{p.price}</span>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: p.isUp ? C.green : C.red, marginTop: 2, display: 'block' }}>{p.change}</span>
                        </div>
                      ))}
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
   08. SECTION 7 — PAMM MONEY MANAGEMENT (LAVENDER)
═══════════════════════════════════════════ */
function PAMMSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [userContribution, setUserContribution] = useState(2500);

  const totalPool = 12840000; // $12.84M Total PAMM Pool
  const masterDailyReturnPct = 1.2; // 1.2% Daily Master Return

  const poolSharePct = (userContribution / totalPool) * 100;
  const dailyReturnUsdt = userContribution * (masterDailyReturnPct / 100);

  const flowSteps = [
    {
      num: '01',
      title: 'INVESTOR POOL AGGREGATION',
      subtitle: 'Capital Aggregated On-Chain',
      desc: 'Individual copier funds are pooled securely via Binance Smart Chain smart contracts to create a single high-liquidity trading balance.',
      metricLabel: 'TOTAL POOLED CAPITAL',
      metricVal: '$12,840,000 USDT'
    },
    {
      num: '02',
      title: 'MASTER STRATEGY EXECUTION',
      subtitle: 'Institutional-Grade Order Routing',
      desc: 'Master traders execute unified high-volume positions. Single order routing eliminates individual slippage and optimizes fee tiers.',
      metricLabel: 'ACTIVE MASTER MANAGERS',
      metricVal: '347 Verified Traders'
    },
    {
      num: '03',
      title: 'PROPORTIONAL YIELD DISPATCH',
      subtitle: 'Automated Daily Profit Split',
      desc: 'Earned trading profits are automatically divided matching each investor’s exact pool percentage share and credited to wallets.',
      metricLabel: 'AVG DAILY DISTRIBUTED YIELD',
      metricVal: '+$154,080.00 / Day'
    }
  ];

  const currentFlow = flowSteps[activeStep];

  return (
    <Section id="pamm" style={{ padding: '6.5rem 1.5rem', background: C.bgLavender }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '3.5rem', alignItems: 'center' }} className="hero-grid">

          {/* Left Column */}
          <div>
            <Reveal>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: '#FFFFFF', border: `1.5px solid ${C.purple}`, borderRadius: 100, padding: '0.45rem 1.1rem', marginBottom: '1.5rem',
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.08)'
              }}>
                <ShieldCheck size={14} color={C.purple} />
                <span style={{ fontSize: '0.725rem', color: C.purple, fontWeight: 800, letterSpacing: '0.1em' }}>
                  INSTITUTIONAL PAMM PROTOCOL
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, lineHeight: 1.1, color: C.text, letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>
                Professional PAMM
              </h2>
            </Reveal>

            <Reveal delay={0.16}>
              <h2 style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '1.25rem',
                background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>
                Pooled Asset Management.
              </h2>
            </Reveal>

            <Reveal delay={0.24}>
              <p style={{ fontSize: '0.95rem', color: C.muted, lineHeight: 1.7, marginBottom: '2rem', fontWeight: 500 }}>
                PAMM (Percentage Allocation Money Management) aggregates copier capital into unified master pools. Institutional traders execute large positions efficiently, delivering proportional yield dispatches back to your account.
              </p>
            </Reveal>

            {/* Feature Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { title: 'Proportional Risk Guard', desc: 'System automatically balances allocation sizes matching your exact pool percentage without over-exposing your capital.', icon: ShieldCheck },
                { title: 'Audited Daily Ledger', desc: 'Master trader orders and returns are recorded transparently on Binance Smart Chain in real time.', icon: Eye },
                { title: 'Instant Settlement Engine', desc: 'Daily yield dispatches automatically route directly to your connected wallet balance.', icon: Zap }
              ].map((item, idx) => (
                <Reveal key={item.title} delay={0.3 + idx * 0.08}>
                  <div
                    style={{
                      background: '#FFFFFF', border: 'none', borderRadius: 18, padding: '1.1rem 1.35rem',
                      display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 6px 20px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                      background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(124, 58, 237, 0.25)'
                    }}>
                      <item.icon size={22} color="white" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 900, color: C.text, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.title}</h4>
                      <p style={{ fontSize: '0.75rem', color: C.muted, fontWeight: 500, margin: '3px 0 0 0', lineHeight: 1.5 }}>{item.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Stat Pill */}
            <Reveal delay={0.55}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '1rem',
                background: '#FFFFFF', border: 'none', borderRadius: 16, padding: '0.75rem 1.25rem',
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: C.purple }}>$12.8M+</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: C.muted }}>Pooled Capital</span>
                </div>
                <span style={{ color: C.borderSoft }}>•</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: C.pink }}>347</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: C.muted }}>Pro Managers</span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right Column: Live Interactive PAMM Visualizer */}
          <div>
            <Reveal delay={0.2}>
              <div style={{
                background: '#FFFFFF', border: 'none', borderRadius: 28, padding: '2.25rem',
                boxShadow: '0 20px 50px rgba(124, 58, 237, 0.1)', position: 'relative'
              }}>

                {/* Top Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={18} color={C.purple} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 900, color: C.text, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      PAMM ALLOCATION PIPELINE
                    </span>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: C.green, background: 'rgba(16, 185, 129, 0.1)', padding: '0.3rem 0.85rem', borderRadius: 100, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    ● Smart Contract Active
                  </span>
                </div>

                {/* 3 Step Interactive Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', background: '#F4EFFF', padding: '0.4rem', borderRadius: 16, border: `1.5px solid ${C.borderSoft}`, marginBottom: '1.5rem' }}>
                  {flowSteps.map((step, idx) => (
                    <button
                      key={step.num}
                      onClick={() => setActiveStep(idx)}
                      style={{
                        flex: 1, padding: '0.65rem 0.4rem', borderRadius: 12, border: 'none',
                        background: activeStep === idx ? `linear-gradient(135deg, ${C.purple}, ${C.pink})` : 'transparent',
                        color: activeStep === idx ? 'white' : C.muted,
                        fontWeight: activeStep === idx ? 900 : 700, fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.25s', textAlign: 'center',
                        boxShadow: activeStep === idx ? '0 4px 15px rgba(243, 16, 253, 0.3)' : 'none'
                      }}
                    >
                      {step.num}. {step.title.split(' ')[0]}
                    </button>
                  ))}
                </div>

                {/* Flow Step Card Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    style={{ marginBottom: '1.5rem' }}
                  >
                    <div style={{ background: '#FAF8FF', border: `1.5px solid ${C.purple}`, borderRadius: 20, padding: '1.5rem', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: C.purple, letterSpacing: '0.1em' }}>
                          STEP {currentFlow.num} • {currentFlow.subtitle}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: C.green }}>{currentFlow.metricVal}</span>
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: C.text, marginBottom: '0.5rem' }}>
                        {currentFlow.title}
                      </h3>
                      <p style={{ fontSize: '0.825rem', color: C.muted, lineHeight: 1.6, fontWeight: 500, margin: 0 }}>
                        {currentFlow.desc}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Live Proportional Profit Simulator */}
                <div style={{ background: '#F8F9FD', border: `1.5px solid ${C.borderSoft}`, borderRadius: 20, padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: C.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      YOUR POOL CONTRIBUTION SIMULATOR
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 900, color: C.purple }}>
                      ${userContribution.toLocaleString()} USDT
                    </span>
                  </div>

                  <input
                    type="range"
                    min={500}
                    max={50000}
                    step={500}
                    value={userContribution}
                    onChange={(e) => setUserContribution(Number(e.target.value))}
                    style={{ width: '100%', accentColor: C.purple, cursor: 'pointer', marginBottom: '1.25rem' }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ background: '#FFFFFF', border: `1.5px solid ${C.borderSoft}`, borderRadius: 14, padding: '0.85rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', display: 'block' }}>YOUR POOL SHARE</span>
                      <span style={{ fontSize: '1rem', fontWeight: 900, color: C.text, marginTop: 2, display: 'block' }}>
                        {poolSharePct.toFixed(4)}%
                      </span>
                    </div>

                    <div style={{ background: '#FFFFFF', border: `1.5px solid ${C.purple}`, borderRadius: 14, padding: '0.85rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 800, color: C.purple, textTransform: 'uppercase', display: 'block' }}>EST. DAILY RETURN</span>
                      <span style={{ fontSize: '1rem', fontWeight: 900, color: C.green, marginTop: 2, display: 'block' }}>
                        +${dailyReturnUsdt.toFixed(2)} / Day
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </Reveal>
          </div>

        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   09. SECTION 8 — INCOME PATHWAYS (WHITE)
═══════════════════════════════════════════ */
function IncomeEcosystem() {
  const incomes = [
    { label: 'DAILY PROFIT', desc: 'Proportional distributions compiled from active trading outcomes.' },
    { label: 'LEVEL BONUS', desc: 'Earn network rewards down to 30 levels of referral accounts.' },
    { label: 'FASTRACK BONUS', desc: 'Bonus reward triggered by maintaining 5 active direct referrers.' },
    { label: 'AUTO COMPOUNDING', desc: 'Option to roll daily profits back into strategy pools automatically.' },
    { label: 'PROMOTIONAL BONUS', desc: 'Rank awards including monthly salary paths for builders.' }
  ];

  return (
    <Section id="income" style={{ padding: '6.5rem 1.5rem', background: C.bg }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 4rem' }}>
          <Reveal>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em', color: C.purple, textTransform: 'uppercase' }}>
              YIELD PATHWAYS
            </span>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 900, color: C.text, marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              Integrated Income Pathways
            </h2>
            <p style={{ fontSize: '0.85rem', color: C.muted, fontWeight: 500 }}>
              Five structured yield models built to reward platform copiers and community builders.
            </p>
          </Reveal>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {incomes.map((item, i) => (
            <Reveal key={item.label} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                  background: '#F8F9FD', border: 'none', borderRadius: 20,
                  padding: '1.75rem 1.5rem', height: '100%', display: 'flex', flexDirection: 'column',
                  boxShadow: '0 10px 30px rgba(124, 58, 237, 0.06)', cursor: 'pointer'
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
                }}>
                  <TrendingUp size={18} color="white" />
                </div>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 900, color: C.text, letterSpacing: '0.05em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  {item.label}
                </h3>
                <p style={{ fontSize: '0.75rem', color: C.muted, lineHeight: 1.6, fontWeight: 600, margin: 0 }}>{item.desc}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   10. SECTION 9 — PACKAGE TIERS (LAVENDER)
═══════════════════════════════════════════ */
function PackagesSection() {
  const packages = [
    { name: 'STARTER', range: '$100 — $1,499', rate: '1.0%', tag: 'Micro Tier' },
    { name: 'ADVANCED', range: '$1,500 — $9,999', rate: '1.2%', tag: 'Standard Tier' },
    { name: 'PROFESSIONAL', range: '$10,000 — $24,999', rate: '1.3%', tag: 'Most Popular', highlight: true },
    { name: 'ELITE', range: '$25,000+', rate: '1.5%', tag: 'Elite Tier' }
  ];

  return (
    <Section id="packages" style={{ padding: '6.5rem 1.5rem', background: C.bgLavender }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 4rem' }}>
          <Reveal>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', color: C.purple, textTransform: 'uppercase' }}>
              YIELD BANDS
            </span>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: C.text, marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              Select Your Package Tier
            </h2>
            <p style={{ fontSize: '0.85rem', color: C.muted, fontWeight: 500 }}>
              Select the matching margin bandwidth to launch automated trade copy dispatches.
            </p>
          </Reveal>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.5rem' }}>
          {packages.map((pkg, i) => (
            <Reveal key={pkg.name} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={pkg.highlight ? "breathing-border" : ""}
                style={{
                  background: '#FFFFFF',
                  border: pkg.highlight ? `2px solid ${C.purple}` : 'none',
                  borderRadius: 24, padding: '2.25rem 1.5rem', position: 'relative',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%',
                  boxShadow: pkg.highlight ? '0 20px 45px rgba(124,58,237,0.12)' : '0 10px 30px rgba(0,0,0,0.03)',
                  cursor: 'pointer'
                }}
              >
                {pkg.highlight && (
                  <span style={{
                    position: 'absolute', top: 14, right: 14,
                    background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
                    color: 'white', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em',
                    padding: '0.25rem 0.75rem', borderRadius: 100, textTransform: 'uppercase'
                  }}>
                    {pkg.tag}
                  </span>
                )}

                <div>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>
                    PACKAGE PLAN
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: C.text, textTransform: 'uppercase', marginBottom: '1rem' }}>
                    {pkg.name}
                  </h3>

                  <div style={{
                    background: '#F8F9FD', borderRadius: 12,
                    padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: C.text, marginBottom: '1.5rem'
                  }}>
                    {pkg.range}
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <span style={{
                      fontSize: '2.25rem', fontWeight: 800,
                      background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block', lineHeight: 1
                    }}>{pkg.rate}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: C.muted, letterSpacing: '0.1em', marginTop: 4, display: 'block' }}>
                      DAILY ALLOCATION RATE
                    </span>
                  </div>
                </div>

                <a href="/register" style={{
                  display: 'block', textAlign: 'center', width: '100%', padding: '0.85rem', borderRadius: 12,
                  background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
                  color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.75rem',
                  letterSpacing: '0.08em', textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(243, 16, 253, 0.2)'
                }}>
                  Select Package
                </a>
              </motion.div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <div style={{
            marginTop: '3rem', background: '#FFFBEB', border: '1.5px solid #F59E0B',
            borderRadius: 16, padding: '1.1rem 1.35rem', display: 'flex', gap: '0.75rem', maxWidth: 800, margin: '3rem auto 0',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.08)'
          }}>
            <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
              RISK STATEMENT: Copy trading is subjected to capital risks based on changing currency behaviors. Yield rates reflect strategy estimates. Distributions are computed using live parameters. Allocate only capital you can afford to lose.
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}











/* ═══════════════════════════════════════════
   16. SECTION 15 — COMPLIANCE & LEGAL RULES (LAVENDER)
═══════════════════════════════════════════ */
function ComplianceSection() {
  const cards = [
    { title: 'AML/KYC POLICY', text: 'All users must verify identity credentials to initiate withdrawal transactions, protecting community assets.' },
    { title: 'DEPOSIT BALANCES', text: 'Deposited margin units route directly into strategy execution contracts. Withdrawals are processed according to batch runs.' },
    { title: 'MARKET SLIPPAGE', text: 'Positions mirror master trader entries proportionally. Slippage parameters depend on changing liquidity conditions.' },
    { title: 'CONTRACT DISCLOSURES', text: 'System functions compile dynamically under audited smart contract guidelines. Review full terms before allocations.' }
  ];

  return (
    <Section id="compliance" style={{ padding: '6.5rem 1.5rem', background: C.bg }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 4rem' }}>
          <Reveal>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em', color: C.purple, textTransform: 'uppercase' }}>
              LEGAL GUIDELINES
            </span>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 900, color: C.text, marginTop: '0.5rem' }}>
              Compliance & Platform Rules
            </h2>
          </Reveal>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <div style={{ background: '#FFFFFF', border: 'none', borderRadius: 20, padding: '1.75rem', height: '100%', boxShadow: '0 8px 25px rgba(0, 0, 0, 0.04)' }}>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 900, color: C.text, letterSpacing: '0.08em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  {c.title}
                </h3>
                <p style={{ fontSize: '0.75rem', color: C.muted, lineHeight: 1.6, fontWeight: 600, margin: 0 }}>{c.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   17. SECTION 16 — FINAL CALL TO ACTION (DARK SLATE NOIR)
═══════════════════════════════════════════ */
function FinalCTA() {
  return (
    <Section style={{ padding: '7rem 1.5rem', background: C.darkSlate, color: 'white', textAlign: 'center', position: 'relative' }}>
      {/* Soft Drifting Background Glow */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 500, height: 300, borderRadius: '50%',
          background: `radial-gradient(circle, ${C.purple} 0%, ${C.pink} 60%, transparent 100%)`,
          filter: 'blur(100px)', pointerEvents: 'none'
        }}
      />

      <div style={{ maxWidth: 750, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <Reveal y={24}>
          <span style={{
            fontSize: '0.725rem', fontWeight: 800, letterSpacing: '0.2em',
            color: C.pink, textTransform: 'uppercase', display: 'block', marginBottom: '0.85rem'
          }}>
            SECURED SMART DEFI SYSTEM
          </span>

          <h2 style={{
            fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            fontWeight: 900,
            color: '#FFFFFF',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            marginBottom: '1.25rem'
          }}>
            The next move is yours.
          </h2>

          <p style={{
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.75)',
            maxWidth: 520,
            margin: '0 auto 2.5rem',
            lineHeight: 1.7,
            fontWeight: 500
          }}>
            Connect to verified copy trading strategies. Track yields. Reinvest. Take control of your financial pathway today.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <motion.div whileHover={{ scale: 1.04 }}>
              <Link to="/register" className="btn-sheen" style={{
                background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
                color: '#FFFFFF', textDecoration: 'none', fontWeight: 800, fontSize: '0.875rem',
                padding: '0.95rem 2.25rem', borderRadius: 12,
                boxShadow: '0 8px 25px rgba(243, 16, 253, 0.3)', display: 'inline-block'
              }}>
                Create Your Account
              </Link>
            </motion.div>

            <motion.a
              whileHover={{ scale: 1.04, background: 'rgba(255, 255, 255, 0.12)' }}
              href="#how-it-works"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF', textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem',
                padding: '0.95rem 2.25rem', borderRadius: 12, transition: 'all 0.2s ease'
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
   18. SECTION 17 — FOOTER (LIGHT)
═══════════════════════════════════════════ */
function Footer() {
  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Copy Trading', href: '#copy-trading' },
    { label: 'Forex', href: '#forex' },
    { label: 'PAMM', href: '#pamm' },
    { label: 'Packages', href: '#packages' },
    { label: 'Income', href: '#income' },
  ];
  const legalLinks = [
    { label: 'Terms of Service', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Risk Disclosure', href: '#' },
    { label: 'KYC Policy', href: '#' },
    { label: 'Compliance', href: '#' },
  ];
  const socials = [
    { label: 'Telegram', icon: <Globe size={15} /> },
    { label: 'Twitter', icon: <Activity size={15} /> },
    { label: 'YouTube', icon: <Play size={15} /> },
    { label: 'Facebook', icon: <Users size={15} /> },
  ];

  return (
    <footer style={{ background: '#F8F6FF', padding: '4.5rem 1.5rem 0', fontSize: '0.78rem', color: C.muted, position: 'relative' }}>
      {/* Top gradient accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.purple}, ${C.pink}, ${C.purple})` }} />

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr', gap: '3rem', paddingBottom: '3.5rem', borderBottom: `1px solid ${C.borderSoft}` }}>

          {/* Brand column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.1rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 14px rgba(124,58,237,0.3)`
              }}>
                <TrendingUp size={18} color="white" />
              </div>
              <span style={{ fontWeight: 900, fontSize: '1.05rem', color: C.text, letterSpacing: '-0.01em' }}>CTC Copy Trade</span>
            </div>

            <p style={{ lineHeight: 1.75, maxWidth: 290, marginBottom: '1.75rem', color: C.muted, fontSize: '0.77rem', fontWeight: 400 }}>
              A decentralized asset management ecosystem delivering automated copy trading capabilities via audited BSC smart contracts.
            </p>

            {/* Social icons */}
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {socials.map(s => (
                <button key={s.label} title={s.label} style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: '#ffffff',
                  border: `1.5px solid ${C.borderSoft}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.muted, cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = C.purple;
                    e.currentTarget.style.borderColor = C.purple;
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = C.borderSoft;
                    e.currentTarget.style.color = C.muted;
                  }}
                >
                  {s.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Platform links */}
          <div>
            <h4 style={{ fontWeight: 800, color: C.text, letterSpacing: '0.1em', marginBottom: '1.25rem', fontSize: '0.65rem', textTransform: 'uppercase' }}>
              Platform
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {navLinks.map(link => (
                <a key={link.label} href={link.href} style={{ color: C.muted, textDecoration: 'none', fontSize: '0.78rem', fontWeight: 400, transition: 'color 0.2s ease' }}
                  onMouseEnter={e => e.currentTarget.style.color = C.purple}
                  onMouseLeave={e => e.currentTarget.style.color = C.muted}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Legal links */}
          <div>
            <h4 style={{ fontWeight: 800, color: C.text, letterSpacing: '0.1em', marginBottom: '1.25rem', fontSize: '0.65rem', textTransform: 'uppercase' }}>
              Legal & Support
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {legalLinks.map(link => (
                <a key={link.label} href={link.href} style={{ color: C.muted, textDecoration: 'none', fontSize: '0.78rem', fontWeight: 400, transition: 'color 0.2s ease' }}
                  onMouseEnter={e => e.currentTarget.style.color = C.purple}
                  onMouseLeave={e => e.currentTarget.style.color = C.muted}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ padding: '1.4rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span style={{ color: C.mutedLight, fontSize: '0.72rem', fontWeight: 400 }}>
            © 2026 CTC Copy Trade. All rights reserved.
          </span>
          <span style={{ color: C.mutedLight, fontSize: '0.7rem', maxWidth: 380, textAlign: 'right', lineHeight: 1.5 }}>
            Strategy replication involves capital risk. Invest only what you can afford to lose.
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   ROOT PAGE COMPONENT (CHOREOGRAPHED MOTION FLOW)
═══════════════════════════════════════════ */
export default function Landing() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      background: '#FFFFFF', color: C.text, minHeight: '100vh',
      overflowX: 'hidden'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        .font-mono { font-family: 'JetBrains Mono', monospace !important; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.25); } }
        @keyframes pulseRing { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(2.2); opacity: 0; } }
        .pulse-ring { animation: pulseRing 2s cubic-bezier(0, 0.2, 0.8, 1) infinite; }
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        .marquee-track { animation: marquee 28s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
        @keyframes sheen { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        .btn-sheen { position: relative; overflow: hidden; }
        .btn-sheen::after {
          content: ''; position: absolute; top: 0; left: 0; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transform: skewX(-20deg); animation: sheen 3.5s infinite;
        }
        @keyframes breathingBorder {
          0%, 100% { border-color: #7C3AED; box-shadow: 0 12px 35px rgba(124, 58, 237, 0.15); }
          50% { border-color: #F310FD; box-shadow: 0 16px 45px rgba(243, 16, 253, 0.25); }
        }
        .breathing-border { animation: breathingBorder 4s ease-in-out infinite; }
        .nav-link-hover::after {
          content: ''; position: absolute; bottom: 0; left: 0; width: 0; height: 2px;
          background: linear-gradient(90deg, #7C3AED, #F310FD); transition: width 0.25s ease;
        }
        .nav-link-hover:hover::after { width: 100%; }
        .hero-grid { grid-template-columns: 1.1fr 0.9fr !important; }
        .about-grid { grid-template-columns: repeat(4, 1fr) !important; }
        .hidden-mobile { display: flex !important; }
        .show-mobile { display: none !important; }
        @media (max-width: 950px) {
          .about-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 850px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (max-width: 550px) {
          .about-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* 00. Preloader */}
      <Preloader onComplete={() => setLoaded(true)} />

      {/* Choreographed Section Flow */}
      <AnimatePresence>
        {loaded && (
          <motion.div
            key="page-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: EXPO_OUT }}
          >
            {/* 01. Sticky Glassmorphism Navbar */}
            <Navbar />

            {/* 02. SECTION 1: Hero Showcase (White) */}
            <HeroSection />

            {/* Section Transition Hairline */}
            <SectionHairline />

            {/* 03. SECTION 2: Trust Ticker (White) */}
            <TrustStrip />

            {/* Section Transition Hairline */}
            <SectionHairline />

            {/* 04. SECTION 3: About Ecosystem (Lavender) */}
            <AboutSection />

            {/* Section Transition Hairline */}
            <SectionHairline />

            {/* 05. SECTION 4: Copy Trading Showcase (White) */}
            <CopyTradingSection />

            {/* Section Transition Hairline */}
            <SectionHairline />

            {/* 06. SECTION 5: How It Works Step-by-Step (Lavender) */}
            <HowItWorksSection />

            {/* Section Transition Hairline */}
            <SectionHairline />

            {/* 07. SECTION 6: Forex Live Sessions (White) */}
            <ForexSection />

            {/* Section Transition Hairline */}
            <SectionHairline />

            {/* 08. SECTION 7: PAMM Management (Lavender) */}
            <PAMMSection />

            {/* Section Transition Hairline */}
            <SectionHairline />

            {/* 09. SECTION 8: Income Pathways (White) */}
            <IncomeEcosystem />

            {/* Section Transition Hairline */}
            <SectionHairline />

            {/* 10. SECTION 9: Package Tiers (Lavender) */}
            <PackagesSection />











            {/* Section Transition Hairline */}
            <SectionHairline />

            {/* 16. SECTION 15: Compliance & Legal Rules (Lavender) */}
            <ComplianceSection />

            {/* Section Transition Hairline */}
            <SectionHairline />

            {/* 17. SECTION 16: Final Call to Action (Dark Noir Slate) */}
            <FinalCTA />

            {/* 18. SECTION 17: Platform Footer (White) */}
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
