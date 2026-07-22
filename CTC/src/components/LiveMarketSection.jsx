import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, TrendingDown, Activity, Zap, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Instrument Categories ─────────────────────────────────────────────────────
const INSTRUMENT_CATEGORIES = {
  CRYPTO: [
    { sym: 'BTC/USD', start: 94250, vol: 0.006, label: 'Bitcoin' },
    { sym: 'ETH/USD', start: 3480, vol: 0.008, label: 'Ethereum' },
    { sym: 'SOL/USD', start: 198.2, vol: 0.010, label: 'Solana' },
    { sym: 'NEXUS/USD', start: 42.85, vol: 0.012, label: 'NEXUS Token' },
  ],
  INDICES: [
    { sym: 'S&P 500', start: 5480, vol: 0.004, label: 'S&P 500' },
    { sym: 'NASDAQ', start: 19800, vol: 0.005, label: 'NASDAQ 100' },
    { sym: 'DOW JONES', start: 40200, vol: 0.003, label: 'Dow Jones' },
    { sym: 'NIFTY 50', start: 24800, vol: 0.004, label: 'Nifty 50' },
  ],
  COMMODITIES: [
    { sym: 'GOLD', start: 2380, vol: 0.005, label: 'Gold (XAU/USD)' },
    { sym: 'SILVER', start: 29.8, vol: 0.008, label: 'Silver (XAG/USD)' },
    { sym: 'OIL (WTI)', start: 78.5, vol: 0.009, label: 'Crude Oil WTI' },
    { sym: 'NATURAL GAS', start: 2.64, vol: 0.012, label: 'Natural Gas' },
  ],
  STOCKS: [
    { sym: 'AAPL', start: 213, vol: 0.007, label: 'Apple Inc.' },
    { sym: 'TSLA', start: 248, vol: 0.014, label: 'Tesla Inc.' },
    { sym: 'MSFT', start: 442, vol: 0.005, label: 'Microsoft Corp.' },
    { sym: 'NVDA', start: 138, vol: 0.012, label: 'NVIDIA Corp.' },
  ],
  'FOREX MAJOR': [
    { sym: 'EUR/USD', start: 1.0845, vol: 0.003, label: 'Euro / US Dollar' },
    { sym: 'GBP/USD', start: 1.2720, vol: 0.004, label: 'British Pound' },
    { sym: 'USD/JPY', start: 157.4, vol: 0.003, label: 'USD / Yen' },
    { sym: 'AUD/USD', start: 0.6640, vol: 0.004, label: 'Aussie Dollar' },
  ],
  'FOREX MINOR': [
    { sym: 'USD/INR', start: 83.5, vol: 0.002, label: 'USD / Indian Rupee' },
    { sym: 'EUR/GBP', start: 0.8510, vol: 0.003, label: 'Euro / Pound' },
    { sym: 'USD/CAD', start: 1.3640, vol: 0.003, label: 'USD / Canadian Dollar' },
    { sym: 'NZD/USD', start: 0.6130, vol: 0.004, label: 'NZ Dollar / USD' },
  ],
};

// ─── Candlestick Canvas Engine ────────────────────────────────────────────────
const CandlestickChart = ({ candles, visibleCount = 60 }) => {
  const canvasRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !candles.length) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const VOLUME_HEIGHT = Math.floor(H * 0.2);
    const CHART_HEIGHT = H - VOLUME_HEIGHT - 8;
    const visible = candles.slice(-visibleCount);
    const candleW = Math.max(4, Math.floor((W - 64) / visible.length));
    const gap = Math.max(1, Math.floor(candleW * 0.2));
    const bodyW = candleW - gap;

    const highs = visible.map(c => c.high);
    const lows = visible.map(c => c.low);
    const pMin = Math.min(...lows);
    const pMax = Math.max(...highs);
    const pRange = pMax - pMin || 1;
    const vMax = Math.max(...visible.map(c => c.volume)) || 1;

    const priceToY = p => 14 + ((pMax - p) / pRange) * (CHART_HEIGHT - 28);
    const volToH = v => (v / vMax) * (VOLUME_HEIGHT - 4);

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    for (let i = 0; i <= 5; i++) {
      const y = 14 + (i / 5) * (CHART_HEIGHT - 28);
      const price = pMax - (i / 5) * pRange;
      ctx.beginPath();
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = '#F1F5F9';
      ctx.lineWidth = 1;
      ctx.moveTo(58, y);
      ctx.lineTo(W - 6, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#94A3B8';
      ctx.font = '9.5px "Inter", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(price < 10 ? price.toFixed(4) : price < 1000 ? price.toFixed(2) : price.toFixed(0), 54, y + 3.5);
    }

    // Volume + Candles
    visible.forEach((candle, i) => {
      const x = 58 + i * candleW;
      const isGreen = candle.close >= candle.open;
      const color = isGreen ? '#10B981' : '#EF4444';
      const openY = priceToY(candle.open);
      const closeY = priceToY(candle.close);
      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));

      // Wick
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.moveTo(x + bodyW / 2, highY);
      ctx.lineTo(x + bodyW / 2, lowY);
      ctx.stroke();

      // Body
      ctx.fillStyle = color;
      ctx.fillRect(x, bodyTop, bodyW, bodyHeight);

      // Volume bar
      const vH = volToH(candle.volume);
      ctx.fillStyle = isGreen ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)';
      ctx.fillRect(x, H - vH, bodyW, vH);
    });

    // Divider line between chart and volume
    ctx.beginPath();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.moveTo(58, CHART_HEIGHT + 4);
    ctx.lineTo(W - 6, CHART_HEIGHT + 4);
    ctx.stroke();

    // Live price dashed line
    if (visible.length > 0) {
      const last = visible[visible.length - 1];
      const lastY = priceToY(last.close);
      const isGreen = last.close >= last.open;
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = isGreen ? '#10B981' : '#EF4444';
      ctx.lineWidth = 1;
      ctx.moveTo(58, lastY);
      ctx.lineTo(W - 66, lastY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price tag
      const tagColor = isGreen ? '#10B981' : '#EF4444';
      ctx.fillStyle = tagColor;
      ctx.beginPath();
      ctx.roundRect(W - 65, lastY - 10, 62, 20, 4);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px "Inter", sans-serif';
      ctx.textAlign = 'center';
      const priceLabel = last.close < 10 ? last.close.toFixed(4) : last.close < 1000 ? last.close.toFixed(2) : last.close.toFixed(0);
      ctx.fillText(priceLabel, W - 34, lastY + 3.5);
    }
  }, [candles, visibleCount]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
    />
  );
};

// ─── Candle helpers ───────────────────────────────────────────────────────────
const generateCandle = (prevClose, volatility = 0.008) => {
  const change = prevClose * volatility * (Math.random() - 0.48);
  const open = prevClose;
  const close = Math.max(0.001, open + change);
  const wickUp = Math.random() * Math.abs(change) * 1.6;
  const wickDown = Math.random() * Math.abs(change) * 1.6;
  const high = Math.max(open, close) + wickUp;
  const low = Math.min(open, close) - wickDown;
  const volume = 200000 + Math.random() * 800000;
  return { open: +open.toFixed(4), close: +close.toFixed(4), high: +high.toFixed(4), low: +low.toFixed(4), volume: Math.round(volume) };
};

const seedCandles = (startPrice, count = 90, vol = 0.01) => {
  const arr = [];
  let price = startPrice;
  for (let i = 0; i < count; i++) {
    const c = generateCandle(price, vol);
    arr.push(c);
    price = c.close;
  }
  return arr;
};

// ─── Dropdown Component ───────────────────────────────────────────────────────
const InstrumentDropdown = ({ category, instruments, activeDropdownSym, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  // Only highlight if user explicitly selected something from this category
  const isActive = activeDropdownSym !== null && instruments.some(i => i.sym === activeDropdownSym);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', borderRadius: '8px',
          border: `1.5px solid ${isActive ? '#7C3AED' : '#E2E8F0'}`,
          background: isActive ? '#EDE9FE' : '#FFFFFF',
          color: isActive ? '#7C3AED' : '#374151',
          fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
          letterSpacing: '0.04em', transition: 'all 0.2s ease',
          boxShadow: open ? '0 4px 16px rgba(124,58,237,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
          outline: 'none',
        }}
      >
        {isActive && (
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7C3AED', flexShrink: 0 }} />
        )}
        {category}
        {open
          ? <ChevronUp size={14} style={{ marginLeft: '2px' }} />
          : <ChevronDown size={14} style={{ marginLeft: '2px' }} />
        }
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 200, minWidth: '180px',
          overflow: 'hidden',
        }}>
          {instruments.map((inst) => (
            <button
              key={inst.sym}
              onClick={() => { onSelect(inst); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 16px', border: 'none',
                background: activeDropdownSym === inst.sym ? '#F5F3FF' : '#FFFFFF',
                color: activeDropdownSym === inst.sym ? '#7C3AED' : '#374151',
                fontWeight: activeDropdownSym === inst.sym ? 700 : 500,
                fontSize: '0.875rem', cursor: 'pointer',
                borderBottom: '1px solid #F9FAFB', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (activeDropdownSym !== inst.sym) e.currentTarget.style.background = '#F9FAFB'; }}
              onMouseLeave={e => { if (activeDropdownSym !== inst.sym) e.currentTarget.style.background = '#FFFFFF'; }}
            >
              <span style={{ fontWeight: 700, marginRight: '8px', color: activeDropdownSym === inst.sym ? '#7C3AED' : '#111827' }}>
                {inst.sym}
              </span>
              <span style={{ fontSize: '0.775rem', color: '#9CA3AF' }}>{inst.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main LiveMarketSection ───────────────────────────────────────────────────
const LiveMarketSection = () => {
  // All instrument configs flattened
  const allInstruments = Object.values(INSTRUMENT_CATEGORIES).flat();

  // chartInst = what drives the chart (always has a value — default BTC/USD)
  const DEFAULT_CHART = { sym: 'BTC/USD', start: 94250, vol: 0.006, label: 'Bitcoin' };
  const [chartInst, setChartInst] = useState(DEFAULT_CHART);

  // activeDropdownSym = which dropdown item is highlighted (null = nothing selected yet)
  const [activeDropdownSym, setActiveDropdownSym] = useState(null);

  // Candle store keyed by sym
  const [candleStore, setCandleStore] = useState(() => {
    const store = {};
    allInstruments.forEach(inst => {
      store[inst.sym] = seedCandles(inst.start, 90, inst.vol);
    });
    return store;
  });

  const [livePrice, setLivePrice] = useState(() => {
    const p = {};
    allInstruments.forEach(i => { p[i.sym] = i.start; });
    return p;
  });

  const [priceDelta, setPriceDelta] = useState(() => {
    const d = {};
    allInstruments.forEach(i => { d[i.sym] = 0; });
    return d;
  });

  // Live candle updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCandleStore(prev => {
        const next = { ...prev };
        const newPrices = { ...livePrice };
        const newDeltas = { ...priceDelta };
        allInstruments.forEach(inst => {
          const existing = prev[inst.sym];
          const last = existing[existing.length - 1];
          const newCandle = generateCandle(last.close, inst.vol);
          next[inst.sym] = [...existing.slice(-150), newCandle];
          newPrices[inst.sym] = newCandle.close;
          newDeltas[inst.sym] = newCandle.close - last.close;
        });
        setLivePrice(newPrices);
        setPriceDelta(newDeltas);
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const currentCandles = candleStore[chartInst.sym] || [];
  const currentPrice = livePrice[chartInst.sym] || chartInst.start;
  const currentDelta = priceDelta[chartInst.sym] || 0;
  const isUp = currentDelta >= 0;
  const first = currentCandles[0]?.open || currentPrice;
  const pctChange = first ? ((currentPrice - first) / first) * 100 : 0;
  const totalVol = currentCandles.slice(-24).reduce((s, c) => s + c.volume, 0);

  // Format price based on magnitude
  const fmt = (p) => p < 10 ? p.toFixed(4) : p < 1000 ? p.toFixed(2) : p.toFixed(0);

  const tickerItems = allInstruments;

  const handleSelectInst = (inst) => {
    // Update chart AND mark the dropdown selection
    setChartInst(inst);
    setActiveDropdownSym(inst.sym);
  };

  return (
    <section id="market" className="section-padding section-white">

      {/* ── Ticker ── */}
      <div style={{ overflow: 'hidden', background: '#FFFFFF', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', padding: '10px 0', marginBottom: '64px' }}>
        <div style={{ display: 'flex', gap: '48px', width: 'max-content', animation: 'marquee 40s linear infinite' }}>
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
            <button key={i} onClick={() => handleSelectInst(item)} style={{
              display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem',
              flexShrink: 0, cursor: 'pointer', background: 'none', border: 'none', padding: '2px 0',
            }}>
              <span style={{ fontWeight: 700, color: chartInst.sym === item.sym ? '#7C3AED' : '#374151' }}>{item.sym}</span>
              <span style={{ color: '#6B7280' }}>${fmt(livePrice[item.sym] || item.start)}</span>
              <span style={{ color: (priceDelta[item.sym] || 0) >= 0 ? '#059669' : '#DC2626', fontWeight: 600, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                {(priceDelta[item.sym] || 0) >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {(priceDelta[item.sym] || 0) >= 0 ? '+' : ''}{(priceDelta[item.sym] || 0).toFixed(item.start < 10 ? 4 : 2)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="container">
        {/* ── Heading ── */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 52px auto' }}>
          <div className="glass-pill" style={{ marginBottom: '14px' }}>
            <Activity size={14} /> Real-Time Data
          </div>
          <h2 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.9rem)', marginBottom: '12px' }}>
            Markets at Your <span className="text-gradient">Fingertips</span>
          </h2>
          <p style={{ color: '#6B7280', fontSize: '1rem' }}>
            Pick any instrument below — the live chart updates instantly. Professional-grade charts. Zero delay. Always on.
          </p>
        </div>

        {/* ── BROWSE INSTRUMENTS ── */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: '#9CA3AF', textTransform: 'uppercase' }}>
              Browse Instruments
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', color: '#9CA3AF', textTransform: 'uppercase' }}>
              Click to Expand ↓
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {Object.entries(INSTRUMENT_CATEGORIES).map(([cat, instruments]) => (
              <InstrumentDropdown
                key={cat}
                category={cat}
                instruments={instruments}
                activeDropdownSym={activeDropdownSym}
                onSelect={handleSelectInst}
              />
            ))}
          </div>
        </div>

        {/* ── Chart Card ── */}
        <div className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>

          {/* Chart Header */}
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '2px', fontWeight: 600 }}>
                  {chartInst.sym}
                  <span style={{ color: '#CBD5E1', marginLeft: '6px', fontWeight: 400 }}>{chartInst.label}</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                  ${fmt(currentPrice)}
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
                borderRadius: '6px', background: isUp ? '#ECFDF5' : '#FEF2F2',
                color: isUp ? '#059669' : '#DC2626', fontWeight: 700, fontSize: '0.85rem',
              }}>
                {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(2)}%
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', background: '#ECFDF5', border: '1px solid #A7F3D0', fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                LIVE
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.8rem' }}>
              <div>
                <div style={{ color: '#9CA3AF', marginBottom: '2px' }}>Vol (24h)</div>
                <div style={{ fontWeight: 700, color: '#374151' }}>{(totalVol / 1_000_000).toFixed(1)}M</div>
              </div>
              <div style={{ width: '1px', height: '28px', background: '#E5E7EB' }} />
              <div>
                <div style={{ color: '#9CA3AF', marginBottom: '2px' }}>Latency</div>
                <div style={{ fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Zap size={12} /> 0.002ms
                </div>
              </div>
            </div>
          </div>

          {/* OHLC Row */}
          {currentCandles.length > 0 && (() => {
            const last = currentCandles[currentCandles.length - 1];
            return (
              <div style={{ padding: '8px 22px', background: '#FAFAFA', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: '20px', fontSize: '0.78rem' }}>
                <span style={{ color: '#9CA3AF' }}>O: <b style={{ color: '#374151' }}>{fmt(last.open)}</b></span>
                <span style={{ color: '#9CA3AF' }}>H: <b style={{ color: '#059669' }}>{fmt(last.high)}</b></span>
                <span style={{ color: '#9CA3AF' }}>L: <b style={{ color: '#DC2626' }}>{fmt(last.low)}</b></span>
                <span style={{ color: '#9CA3AF' }}>C: <b style={{ color: isUp ? '#059669' : '#DC2626' }}>{fmt(last.close)}</b></span>
                <span style={{ color: '#9CA3AF' }}>Vol: <b style={{ color: '#6B7280' }}>{(last.volume / 1000).toFixed(0)}K</b></span>
              </div>
            );
          })()}

          {/* Candlestick Chart */}
          <div style={{ height: '340px', background: '#FFFFFF' }}>
            <CandlestickChart candles={currentCandles} visibleCount={60} />
          </div>

          {/* Bottom bar */}
          <div style={{ padding: '10px 22px', background: '#FAFAFA', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9CA3AF' }}>
            <span>📊 OHLC Candlestick · Real-time simulation · 60 candles visible</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw size={11} /> Updates every 1.5s
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveMarketSection;
