import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Shield, Zap, Star, Lock,
  CheckCircle, X, CreditCard, Clock, Check,
  ArrowRight, Sparkles, Info, Copy, AlertCircle, ShieldCheck
} from 'lucide-react';
import { ethers } from 'ethers';
import api from '../api';
import { toast } from 'react-toastify';
import { fetchProfile } from '../redux/slices/authSlice';

// ── Icon + color config per package style
const PKG_CONFIG = {
  trending: { icon: TrendingUp, color: '#0EA5E9', gradient: 'linear-gradient(135deg, #0EA5E9, #38bdf8)' },
  shield:   { icon: ShieldCheck, color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6, #a78bfa)' },
  zap:      { icon: Zap,       color: '#F310FD', gradient: 'linear-gradient(135deg, #F310FD, #a855f7)' },
  star:     { icon: Star,      color: '#A855F7', gradient: 'linear-gradient(135deg, #A855F7, #7c3aed)' },
  lock:     { icon: Lock,      color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #fb923c)' },
};

const getPkgStyle = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes('package 1') || lower.includes('100 package')) return PKG_CONFIG.trending;
  if (lower.includes('package 2') || lower.includes('500 package')) return PKG_CONFIG.shield;
  if (lower.includes('package 3')) return PKG_CONFIG.zap;
  if (lower.includes('package 4')) return PKG_CONFIG.star;
  if (lower.includes('land security')) return PKG_CONFIG.lock;
  return PKG_CONFIG.trending;
};

const POPULAR_ID_FALLBACK = 'temp_1'; // Package 2 fallback

export default function Products() {
  const dispatch = useDispatch();
  const { user, profile } = useSelector((state) => state.auth);

  const [dbPackages, setDbPackages] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [selectedPackage, setSelectedPackage] = useState(null);
  
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('metamask'); // 'metamask' or 'manual'
  const [networkType, setNetworkType] = useState('Bep20'); // 'Bep20' or 'TRC 20'
  const [senderAddress, setSenderAddress] = useState('');
  
  const [depositAddresses, setDepositAddresses] = useState({
    depositAddressMetaMask: '0x185018c5f26B2cE105e0B80b231178CE5913b621',
    depositAddressBep20: '0x8e4143b46eb1e1a6cbd71b5d57da95b985219f0b',
    depositAddressTrc20: 'TWJjGZJ73Q9x2hWpLRRreaxyvR9Eveoiv5'
  });

  const currentUser = profile || user;
  const balance = currentUser?.availableBalance || 0;

  // Fetch deposit addresses
  useEffect(() => {
    const fetchDepositAddresses = async () => {
      try {
        const res = await api.get('/user/deposit-addresses');
        if (res.data) setDepositAddresses(res.data);
      } catch (err) {
        console.error('Failed to fetch deposit addresses:', err);
      }
    };
    fetchDepositAddresses();
  }, []);

  // Fetch Packages
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await api.get('/package/all');
        if (res.data && res.data.length > 0) {
          setDbPackages(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch packages:', err);
      }
    };
    fetchPackages();
  }, []);

  // Initialize amounts state on packages load
  useEffect(() => {
    if (dbPackages.length > 0) {
      const initialAmounts = {};
      dbPackages.forEach(p => {
        initialAmounts[p._id || p.id] = p.minAmount ?? 0;
      });
      setAmounts(initialAmounts);
    }
  }, [dbPackages]);

  const handleAmountSliderChange = (pkgId, min, max, val) => {
    const parsed = Math.max(min, Math.min(max, parseInt(val) || min));
    setAmounts(prev => ({ ...prev, [pkgId]: parsed }));
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    const minAmt = pkg.minAmount ?? 0;
    const currentStake = amounts[pkg._id || pkg.id] || minAmt;
    setInvestmentAmount(currentStake);
    setAmountError('');
    setTxHash('');
    setSenderAddress('');
    setPaymentMethod('metamask');
    // Lock background scroll while modal is open
    document.body.style.overflow = 'hidden';
  };

  const handleCloseModal = () => {
    setSelectedPackage(null);
    // Restore background scroll
    document.body.style.overflow = '';
  };

  const handleAmountInputChangeInModal = (e) => {
    const val = e.target.value;
    setInvestmentAmount(val);
    const num = Number(val);

    // Sync back to card amounts state
    if (selectedPackage) {
      setAmounts(prev => ({ ...prev, [selectedPackage._id || selectedPackage.id]: num }));
    }

    if (!val) {
      setAmountError('Investment amount is required');
    } else if (num < (selectedPackage.minAmount ?? 0)) {
      setAmountError(`Minimum investment is $${(selectedPackage.minAmount ?? 0).toLocaleString()}`);
    } else if (num > (selectedPackage.maxAmount ?? 0)) {
      setAmountError(`Maximum investment is $${(selectedPackage.maxAmount ?? 0).toLocaleString()}`);
    } else {
      setAmountError('');
    }
  };

  const connectWalletAndPay = async () => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask!');
      return;
    }

    try {
      setIsProcessing(true);

      // 1. Connect to MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      // 2. Switch to Binance Smart Chain
      const targetChainId = '0x38'; // 56 in hex
      const chainId = await provider.send('eth_chainId', []);

      if (chainId !== targetChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: targetChainId,
                  chainName: 'Binance Smart Chain',
                  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                  rpcUrls: ['https://bsc-dataseed.binance.org/'],
                  blockExplorerUrls: ['https://bscscan.com/'],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }

      // 3. Send USDT
      const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";
      const ADMIN_WALLET = depositAddresses.depositAddressMetaMask || "0x185018c5f26B2cE105e0B80b231178CE5913b621"; 

      const abi = [
        "function transfer(address to, uint256 amount) public returns (bool)",
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)"
      ];
      const usdtContract = new ethers.Contract(USDT_CONTRACT, abi, signer);

      const userAddress = await signer.getAddress();
      const [balanceVal, decimals, bnbBalance] = await Promise.all([
        usdtContract.balanceOf(userAddress),
        usdtContract.decimals(),
        provider.getBalance(userAddress)
      ]);

      const amount = ethers.parseUnits(investmentAmount.toString(), decimals);

      if (bnbBalance === 0n) {
        throw new Error("Insufficient BNB for gas fees. You must have some BNB in your wallet to cover the Binance Smart Chain transaction fee.");
      }

      if (balanceVal < amount) {
        const readableBalance = ethers.formatUnits(balanceVal, decimals);
        throw new Error(`Insufficient USDT balance. You have ${readableBalance} USDT, but need ${investmentAmount} USDT.`);
      }

      toast.info("Please confirm the transaction in MetaMask...");
      const tx = await usdtContract.transfer(ADMIN_WALLET, amount);

      toast.info("Transaction sent! Waiting for confirmation...");
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        // 4. Send TxHash to Backend
        const response = await api.post('/package/buy', {
          packageId: selectedPackage._id || selectedPackage.id,
          amount: Number(investmentAmount),
          txHash: tx.hash,
          senderAddress: userAddress,
        });

        toast.success(response.data.message || 'Package Activated Successfully!');
        dispatch(fetchProfile());
        setSelectedPackage(null);
      } else {
        throw new Error("Transaction failed on-chain");
      }
    } catch (error) {
      console.error(error);
      const errorMsg = error.reason || error.message || "Payment failed. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitManualPurchase = async () => {
    if (!txHash) {
      toast.error('Transaction Hash is required for manual purchase verification.');
      return;
    }

    try {
      setIsProcessing(true);
      const response = await api.post('/package/manual-buy', {
        packageId: selectedPackage._id || selectedPackage.id,
        amount: Number(investmentAmount),
        txHash,
        networkType,
        senderAddress,
      });

      toast.success(response.data.message || 'Manual purchase request submitted successfully!');
      setSelectedPackage(null);
      setTxHash('');
      setSenderAddress('');
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to submit request. Please try again.';
      toast.error(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fade-up">
      {/* ── Page Header */}
      <div style={{ textAlign: 'center', marginBottom: 40, marginTop: 8 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12,
          background: 'var(--pink-tint)', border: '1px solid rgba(243,16,253,0.2)',
          borderRadius: 100, padding: '4px 14px', fontSize: 12, fontWeight: 600, color: 'var(--pink)',
        }}>
          <Sparkles size={12} />
          Premium Trading Packages
        </div>
        <h1 style={{
          fontSize: 32, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em',
          background: 'var(--gradient-text)', WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Choose Your Growth Plan
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
          Select a structured financial package and start earning daily ROI on Binance Smart Chain.
        </p>

        {/* Balance chip */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(243,16,253,0.15)', borderRadius: 100,
            padding: '7px 18px', fontSize: 13, fontWeight: 500,
          }}>
            <span style={{ color: 'var(--muted)' }}>Available Balance:</span>
            <span style={{
              fontWeight: 700, fontFamily: 'monospace',
              background: 'var(--gradient-text)', WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              ${balance.toLocaleString()} USDT
            </span>
          </div>
        </div>
      </div>

      {/* ── Package Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 20, marginBottom: 40,
      }}>
        {[...dbPackages]
          .sort((a, b) => {
            const getOrder = (name) => {
              const lower = name.toLowerCase();
              if (lower === 'package') return 0;
              if (lower.includes('package 1') || lower.includes('100 package')) return 1;
              if (lower.includes('package 2') || lower.includes('500 package')) return 2;
              if (lower.includes('package 3')) return 3;
              if (lower.includes('package 4')) return 4;
              if (lower.includes('land security')) return 5;
              if (lower.includes('referral')) return 6;
              return 99;
            };
            return getOrder(a.name) - getOrder(b.name);
          })
          .map((pkg, idx) => {
            const cfg = getPkgStyle(pkg.name);
            const Icon = cfg.icon;

            const minPrice = pkg.minAmount ?? 0;
            const maxPrice = pkg.maxAmount ?? 0;
            const isRange = minPrice !== maxPrice;

            const currentAmount = amounts[pkg._id || pkg.id] || minPrice;
            const isSelected = selectedPackage?._id === pkg._id;
            const isPopular = pkg._id === POPULAR_ID_FALLBACK || pkg.name.includes('Package 2');
            const canAfford = balance >= currentAmount;
            
            const sliderPct = isRange
              ? ((currentAmount - minPrice) / (maxPrice - minPrice)) * 100
              : 100;

            const isReferral = pkg.isReferralOnly || pkg.name.toLowerCase().includes('referral');
            const profitDisplay = isReferral 
              ? `${pkg.dailyProfit}%` 
              : `${(pkg.dailyProfit / 2)}%`;
            const durationDisplay = isReferral 
              ? 'daily' 
              : 'every 12 hours';

            return (
              <div
                key={pkg._id || pkg.id}
                className={`fade-up-delay-${Math.min(idx + 1, 4)}`}
                style={{
                  position: 'relative',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(243,16,253,0.06) 100%)'
                    : 'rgba(255,255,255,0.78)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: isSelected
                    ? '2px solid rgba(243,16,253,0.4)'
                    : '1px solid rgba(255,255,255,0.65)',
                  borderRadius: 18,
                  padding: '24px',
                  display: 'flex', flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isSelected
                    ? '0 12px 40px rgba(243,16,253,0.15), 0 4px 16px rgba(0,0,0,0.06)'
                    : '0 4px 20px rgba(0,0,0,0.06)',
                }}
                onClick={() => handleSelectPackage(pkg)}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 36px rgba(243,16,253,0.12), 0 4px 16px rgba(0,0,0,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(243,16,253,0.25)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.65)';
                  }
                }}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #aa7c11 0%, #d4af37 100%)', color: 'white',
                    fontSize: 10, fontWeight: 700, padding: '3px 14px',
                    borderRadius: 100, whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(170,124,17,0.45)',
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    zIndex: 2
                  }}>
                    ⭐ Most Popular
                  </div>
                )}

                {/* Selected check */}
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: 16, right: 16,
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'var(--gradient)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(243,16,253,0.4)',
                    zIndex: 2
                  }}>
                    <Check size={13} style={{ color: 'white' }} />
                  </div>
                )}

                {/* Icon */}
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: cfg.gradient, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 18, boxShadow: `0 4px 14px ${cfg.color}40`,
                }}>
                  <Icon size={22} style={{ color: 'white' }} />
                </div>

                {/* Title */}
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px', color: 'var(--near-black)' }}>
                  {pkg.name}
                </h3>

                {/* Range */}
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Investment Range
                  </span>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--near-black)', marginTop: 3, letterSpacing: '-0.02em' }}>
                    {isRange
                      ? `$${minPrice.toLocaleString()} – $${maxPrice.toLocaleString()}`
                      : `$${minPrice.toLocaleString()}`}
                  </div>
                </div>

                {/* ROI rate */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: `${cfg.color}10`, border: `1px solid ${cfg.color}25`,
                  borderRadius: 10, padding: '10px 14px', marginBottom: 14,
                }}>
                  <div style={{ width: 3, height: 28, background: cfg.gradient, borderRadius: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Profit Rate
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: cfg.color, marginTop: 1 }}>
                      {profitDisplay} every {durationDisplay}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 18, lineHeight: 1.6, flex: 1 }}>
                  {pkg.description || 'Receive daily returns as long as your live account remains active on BSC.'}
                </p>

                {/* Slider — only for range packages */}
                {isRange && (
                  <div
                    style={{
                      background: 'rgba(243,16,253,0.04)', border: '1px solid rgba(243,16,253,0.08)',
                      borderRadius: 12, padding: '14px', marginBottom: 18,
                    }}
                    onClick={e => e.stopPropagation()} // prevent card click toggle
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)' }}>Amount</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pink)' }}>$</span>
                        <input
                          type="number"
                          value={currentAmount}
                          min={minPrice}
                          max={maxPrice}
                          onChange={e => handleAmountSliderChange(pkg._id || pkg.id, minPrice, maxPrice, e.target.value)}
                          style={{
                            width: 88, border: '1.5px solid rgba(243,16,253,0.25)',
                            borderRadius: 7, padding: '4px 8px',
                            fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
                            textAlign: 'right', color: 'var(--near-black)',
                            background: 'rgba(255,255,255,0.9)', outline: 'none',
                          }}
                          onFocus={e => e.target.style.borderColor = 'var(--pink)'}
                          onBlur={e => e.target.style.borderColor = 'rgba(243,16,253,0.25)'}
                        />
                      </div>
                    </div>

                    {/* Custom slider track */}
                    <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
                      {/* Track background */}
                      <div style={{
                        position: 'absolute', left: 0, right: 0, height: 6,
                        background: 'rgba(243,16,253,0.1)', borderRadius: 100,
                      }} />
                      {/* Track fill */}
                      <div style={{
                        position: 'absolute', left: 0, height: 6,
                        width: `${sliderPct}%`,
                        background: `linear-gradient(90deg, ${cfg.color}, var(--pink))`,
                        borderRadius: 100,
                        transition: 'width 0.1s ease',
                      }} />
                      {/* Native range input (invisible but functional) */}
                      <input
                        type="range"
                        min={minPrice}
                        max={maxPrice}
                        step={50}
                        value={currentAmount}
                        onChange={e => handleAmountSliderChange(pkg._id || pkg.id, minPrice, maxPrice, e.target.value)}
                        style={{
                          position: 'absolute', left: 0, right: 0, width: '100%',
                          height: '100%', opacity: 0, cursor: 'pointer', margin: 0,
                          WebkitAppearance: 'none', appearance: 'none',
                        }}
                      />
                      {/* Thumb indicator */}
                      <div style={{
                        position: 'absolute',
                        left: `calc(${sliderPct}% - 10px)`,
                        width: 20, height: 20,
                        borderRadius: '50%',
                        background: 'var(--gradient)',
                        border: '2.5px solid white',
                        boxShadow: `0 2px 10px ${cfg.color}60`,
                        pointerEvents: 'none',
                        transition: 'left 0.1s ease',
                      }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: 'var(--muted)' }}>
                      <span>${minPrice.toLocaleString()}</span>
                      <span>${maxPrice.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <button
                  className="btn-primary"
                  onClick={e => { e.stopPropagation(); handleSelectPackage(pkg); }}
                  style={{
                    width: '100%', height: 46,
                    borderRadius: 12, border: 'none', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: cfg.gradient,
                    color: 'white',
                    boxShadow: `0 4px 16px ${cfg.color}35`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.015)';
                    e.currentTarget.style.boxShadow = `0 6px 22px ${cfg.color}55`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = `0 4px 16px ${cfg.color}35`;
                  }}
                >
                  {canAfford ? (
                    <><CreditCard size={15} /> Invest ${currentAmount.toLocaleString()} <ArrowRight size={14} /></>
                  ) : (
                    <><CreditCard size={15} /> Buy Now <ArrowRight size={14} /></>
                  )}
                </button>

                {/* Footer tags */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginTop: 14, paddingTop: 12,
                  borderTop: '1px solid rgba(0,0,0,0.06)',
                  fontSize: 11, color: 'var(--muted)',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--green)' }}>
                    <CheckCircle size={11} /> Secured on BSC
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} /> Mon–Fri cycle
                  </span>
                </div>
              </div>
            );
          })}
      </div>

      {/* ── Purchase Modal — rendered in document.body via portal so it never causes page scroll */}
      {createPortal(
      <AnimatePresence>
        {selectedPackage && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '16px', paddingRight: '16px' }}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(4px)', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}
            ></motion.div>

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ fontFamily: 'Inter, sans-serif', padding: 'clamp(16px, 5vw, 32px)', width: '100%', maxWidth: '672px', background: '#fff', border: '1px solid rgba(226,232,240,0.8)', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.12), 0 0 30px rgba(243,16,253,0.05)', position: 'relative', overflowY: 'auto', maxHeight: '92dvh', zIndex: 10 }}
            >
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  color: '#64748B',
                  background: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  padding: '6px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  zIndex: 30
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#0F172A';
                  e.currentTarget.style.background = '#E2E8F0';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#64748B';
                  e.currentTarget.style.background = '#F1F5F9';
                }}
              >
                <X size={16} />
              </button>

              <div className="relative z-10">
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Zap size={20} style={{ color: '#F310FD' }} /> Confirm Deposit: {selectedPackage.name}
                </h3>

                {/* Summary Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(243,16,253,0.02) 0%, rgba(124,58,237,0.01) 100%)',
                  border: '1px solid rgba(243,16,253,0.12)',
                  borderRadius: 14, padding: '14px', marginBottom: '16px',
                }}>
                  {[
                    { label: 'Package Tier',    value: selectedPackage.name, bold: true },
                    { label: 'Profit Rate',     value: selectedPackage.name.toLowerCase().includes('referral') ? `${selectedPackage.dailyProfit}%` : `${(selectedPackage.dailyProfit / 2)}% ${selectedPackage.name.toLowerCase().includes('referral') ? 'daily' : 'every 12 hours'}`, color: '#22c55e' },
                    { label: 'Staking Capital', value: `$${Number(investmentAmount || 0).toLocaleString()} USDT`, color: '#F310FD', big: true },
                    { label: 'Ceiling (4.0×)',  value: `$${(Number(investmentAmount || 0) * 4).toLocaleString()} USDT` },
                  ].map((row, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 0',
                      borderBottom: i < 3 ? '1px solid #F1F5F9' : 'none',
                      fontSize: '13px',
                    }}>
                      <span style={{ color: '#475569', fontWeight: 500 }}>{row.label}</span>
                      <span style={{
                        fontWeight: row.big ? 800 : 700,
                        fontSize: row.big ? '15px' : '13px',
                        color: row.color || '#0F172A',
                      }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingTop: '10px', marginTop: '4px',
                    borderTop: '1px dashed #E2E8F0',
                    fontSize: '12.5px',
                  }}>
                    <span style={{ color: '#475569' }}>Your USDT Balance</span>
                    <span style={{ fontWeight: 700, color: balance >= Number(investmentAmount) ? '#22c55e' : '#ef4444' }}>
                      ${balance.toFixed(2)} USDT
                    </span>
                  </div>
                </div>

                {/* Payment Method */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Payment Method</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('metamask')}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        background: paymentMethod === 'metamask' ? 'rgba(243,16,253,0.08)' : '#F8FAFC',
                        border: paymentMethod === 'metamask' ? '1.5px solid #F310FD' : '1px solid #E2E8F0',
                        color: paymentMethod === 'metamask' ? '#F310FD' : '#64748B',
                        boxShadow: paymentMethod === 'metamask' ? '0 4px 12px rgba(243,16,253,0.08)' : 'none',
                      }}
                    >
                      🦊 Pay via MetaMask
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('manual')}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        background: paymentMethod === 'manual' ? 'rgba(243,16,253,0.08)' : '#F8FAFC',
                        border: paymentMethod === 'manual' ? '1.5px solid #F310FD' : '1px solid #E2E8F0',
                        color: paymentMethod === 'manual' ? '#F310FD' : '#64748B',
                        boxShadow: paymentMethod === 'manual' ? '0 4px 12px rgba(243,16,253,0.08)' : 'none',
                      }}
                    >
                      📋 Manual Deposit
                    </button>
                  </div>
                </div>

                {/* Amount input & manual pay details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {/* Selected Package Display */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Selected Package</label>
                    <div style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: '#0F172A',
                      fontWeight: 700,
                      fontSize: '13.5px',
                    }}>
                      {selectedPackage.name}
                    </div>
                  </div>

                  {/* Investment Amount Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Investment Amount (USDT)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', fontWeight: 700 }}>$</span>
                      <input
                        type="number"
                        value={investmentAmount}
                        onChange={handleAmountInputChangeInModal}
                        style={{
                          width: '100%',
                          background: '#FFFFFF',
                          border: amountError ? '1.5px solid #ef4444' : '1px solid #CBD5E1',
                          borderRadius: '10px',
                          padding: '10px 14px 10px 28px',
                          color: '#0F172A',
                          fontWeight: 700,
                          fontSize: '13.5px',
                          outline: 'none',
                          transition: 'all 0.2s',
                        }}
                        onFocus={e => { if (!amountError) e.target.style.borderColor = '#F310FD'; }}
                        onBlur={e => { if (!amountError) e.target.style.borderColor = '#CBD5E1'; }}
                      />
                    </div>
                    {amountError ? (
                      <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: 500 }}><AlertCircle size={12} /> {amountError}</p>
                    ) : (
                      selectedPackage.minAmount === selectedPackage.maxAmount ? (
                        <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Required Investment: ${selectedPackage.minAmount?.toLocaleString()}</p>
                      ) : (
                        <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Allowed Range: ${selectedPackage.minAmount?.toLocaleString()} - ${selectedPackage.maxAmount?.toLocaleString()}</p>
                      )
                    )}
                  </div>
                </div>

                {/* Manual Pay Address, QR & hash fields */}
                {paymentMethod === 'manual' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}
                  >
                    {/* Network Selection */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Select Network</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setNetworkType('Bep20')}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '11.5px',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            background: networkType === 'Bep20' ? 'rgba(245,158,11,0.08)' : '#F8FAFC',
                            border: networkType === 'Bep20' ? '1.5px solid #d97706' : '1px solid #E2E8F0',
                            color: networkType === 'Bep20' ? '#d97706' : '#64748B',
                          }}
                        >
                          BEP20 (Binance Smart Chain)
                        </button>
                        <button
                          type="button"
                          onClick={() => setNetworkType('TRC 20')}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '11.5px',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            background: networkType === 'TRC 20' ? 'rgba(239,68,68,0.08)' : '#F8FAFC',
                            border: networkType === 'TRC 20' ? '1.5px solid #dc2626' : '1px solid #E2E8F0',
                            color: networkType === 'TRC 20' ? '#dc2626' : '#64748B',
                          }}
                        >
                          TRC20 (TRON Network)
                        </button>
                      </div>
                    </div>

                    {/* Deposit Address Box */}
                    <div style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      {/* Address Info & copy */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>USDT Deposit Address ({networkType})</span>
                          <button
                            type="button"
                            onClick={() => {
                              const addr = networkType === 'Bep20' 
                                ? depositAddresses.depositAddressBep20 
                                : depositAddresses.depositAddressTrc20;
                              navigator.clipboard.writeText(addr);
                              toast.success('Address copied to clipboard!');
                            }}
                            style={{
                              fontSize: '11px',
                              color: '#F310FD',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Copy size={12} /> Copy
                          </button>
                        </div>
                        <div style={{
                          fontSize: '13px',
                          fontFamily: 'monospace',
                          color: '#0F172A',
                          background: '#F1F5F9',
                          border: '1px solid #E2E8F0',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          wordBreak: 'break-all',
                          userSelect: 'all',
                          textAlign: 'center'
                        }}>
                          {networkType === 'Bep20' 
                            ? depositAddresses.depositAddressBep20 
                            : depositAddresses.depositAddressTrc20}
                        </div>
                      </div>

                      {/* QR Code Container - Centered Row */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#F1F5F9',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '16px',
                        marginTop: '4px'
                      }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Scan to Pay</span>
                        <div style={{ background: '#ffffff', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${
                              networkType === 'Bep20' 
                                ? depositAddresses.depositAddressBep20 
                                : depositAddresses.depositAddressTrc20
                            }`} 
                            alt="QR Code" 
                            style={{ width: '150px', height: '150px', display: 'block' }}
                          />
                        </div>
                      </div>

                      <p style={{ fontSize: '10.5px', color: '#64748B', lineHeight: 1.4, margin: 0, textAlign: 'center' }}>
                        ⚠️ Send only USDT ({networkType}) to this address. Using the wrong network may result in loss.
                      </p>
                    </div>

                    {/* Sender Wallet Address */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Sender Wallet Address (Optional)</label>
                      <input
                        type="text"
                        value={senderAddress}
                        onChange={(e) => setSenderAddress(e.target.value)}
                        placeholder="Your wallet address from which payment is sent"
                        style={{
                          width: '100%',
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          color: '#0F172A',
                          fontFamily: 'monospace',
                          fontSize: '13px',
                          outline: 'none',
                          transition: 'all 0.2s',
                        }}
                        onFocus={e => e.target.style.borderColor = '#F310FD'}
                        onBlur={e => e.target.style.borderColor = '#CBD5E1'}
                      />
                    </div>
                  </motion.div>
                )}

                {/* TxHash Input */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Transaction Hash {paymentMethod === 'manual' ? '(Required)' : '(Optional if using MetaMask)'}
                  </label>
                  <input
                    type="text"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="0x... or TRON transaction ID"
                    style={{
                      width: '100%',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: '#0F172A',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#F310FD'}
                    onBlur={e => e.target.style.borderColor = '#CBD5E1'}
                  />
                  <p style={{ fontSize: '11px', color: '#64748B', marginTop: '6px', lineHeight: 1.4, marginBottom: 0 }}>
                    {paymentMethod === 'manual'
                      ? 'Enter the transaction hash/id of your USDT transfer to submit for verification.'
                      : 'Enter transaction hash manually if you paid outside of this browser session.'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-5">
                  <button
                    onClick={() => {
                      setSelectedPackage(null);
                      setTxHash('');
                      setSenderAddress('');
                    }}
                    className="w-full sm:w-auto text-center"
                    style={{
                      padding: '10px 20px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '13px',
                      color: '#64748B',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#0F172A'}
                    onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
                  >
                    Cancel
                  </button>
                  {paymentMethod === 'metamask' ? (
                    <button
                      disabled={!!amountError || !investmentAmount || isProcessing || balance < Number(investmentAmount)}
                      onClick={connectWalletAndPay}
                      className="w-full sm:w-auto justify-center"
                      style={{
                        padding: '10px 24px',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: amountError || !investmentAmount || isProcessing || balance < Number(investmentAmount) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        border: 'none',
                        background: amountError || !investmentAmount || isProcessing || balance < Number(investmentAmount)
                          ? '#E2E8F0'
                          : 'linear-gradient(135deg, #a020f0 0%, #f310fd 100%)',
                        color: amountError || !investmentAmount || isProcessing || balance < Number(investmentAmount)
                          ? '#94A3B8'
                          : '#ffffff',
                        boxShadow: amountError || !investmentAmount || isProcessing || balance < Number(investmentAmount)
                          ? 'none'
                          : '0 4px 16px rgba(243,16,253,0.3)',
                      }}
                      onMouseEnter={e => {
                        if (!(amountError || !investmentAmount || isProcessing || balance < Number(investmentAmount))) {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(243,16,253,0.45)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!(amountError || !investmentAmount || isProcessing || balance < Number(investmentAmount))) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(243,16,253,0.3)';
                        }
                      }}
                    >
                      {isProcessing ? 'Processing...' : 'Pay via MetaMask'} <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      disabled={!!amountError || !investmentAmount || !txHash || isProcessing || balance < Number(investmentAmount)}
                      onClick={submitManualPurchase}
                      className="w-full sm:w-auto justify-center"
                      style={{
                        padding: '10px 24px',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: amountError || !investmentAmount || !txHash || isProcessing || balance < Number(investmentAmount) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        border: 'none',
                        background: amountError || !investmentAmount || !txHash || isProcessing || balance < Number(investmentAmount)
                          ? '#E2E8F0'
                          : 'linear-gradient(135deg, #a020f0 0%, #f310fd 100%)',
                        color: amountError || !investmentAmount || !txHash || isProcessing || balance < Number(investmentAmount)
                          ? '#94A3B8'
                          : '#ffffff',
                        boxShadow: amountError || !investmentAmount || !txHash || isProcessing || balance < Number(investmentAmount)
                          ? 'none'
                          : '0 4px 16px rgba(243,16,253,0.3)',
                      }}
                      onMouseEnter={e => {
                        if (!(amountError || !investmentAmount || !txHash || isProcessing || balance < Number(investmentAmount))) {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(243,16,253,0.45)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!(amountError || !investmentAmount || !txHash || isProcessing || balance < Number(investmentAmount))) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(243,16,253,0.3)';
                        }
                      }}
                    >
                      {isProcessing ? 'Submitting...' : 'Submit Manual Purchase'} <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      , document.body)}
    </div>
  );
}
