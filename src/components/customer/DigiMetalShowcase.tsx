import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  Info,
  MessageCircle,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { cmsApi } from '@/services/api/cms.api';
import { useRates } from '@/hooks/useRates';
import { useStoreWhatsApp } from '@/hooks/useStoreWhatsApp';
import { formatPaiseToInr } from '@/utils/currency';
import { formatDateTime } from '@/utils/date';
import { AnimatedCTA, ScrollReveal, StaggerReveal } from '@/components/motion';
import { DigiEducationalSection } from './DigiEducationalSection';

interface DigiMetalShowcaseProps {
  metal: 'GOLD' | 'SILVER';
}

function sanitizeDecimalString(raw: string, maxDecimals: number): string {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length <= 1) return parts[0].slice(0, 9);
  return `${parts[0].slice(0, 9)}.${parts.slice(1).join('').slice(0, maxDecimals)}`;
}

export const DigiMetalShowcase: React.FC<DigiMetalShowcaseProps> = ({ metal }) => {
  const isGold = metal === 'GOLD';
  const { buildWhatsAppUrl, displayPhone, telHref } = useStoreWhatsApp();

  const { data: content } = useQuery({
    queryKey: ['digi', metal.toLowerCase()],
    queryFn: () => cmsApi.getDigiContent(metal),
  });

  const {
    data: rates,
    isLoading: ratesLoading,
    isError: ratesError,
    refetch: refetchRates,
  } = useRates();

  const calcConfig = useMemo(() => {
    const cfg = content?.calculatorConfig;
    return {
      isEnabled: cfg?.isEnabled ?? true,
      minAmountInr: cfg?.minAmountInr ?? 100,
      maxAmountInr: cfg?.maxAmountInr ?? 1000000,
      decimalPrecision: Math.min(6, Math.max(2, cfg?.decimalPrecision ?? 4)),
      defaultAmountInr: cfg?.defaultAmountInr ?? (isGold ? 5000 : 1000),
      purityKey: cfg?.purityKey || (isGold ? '24K' : '999'),
      disclaimerText: cfg?.disclaimerText || '',
    };
  }, [content, isGold]);

  const ratePerGramPaise = useMemo(() => {
    if (!rates) return 0;
    if (isGold) {
      const key = calcConfig.purityKey as '24K' | '22K' | '18K';
      return rates.gold[key] || rates.gold['24K'] || 0;
    }
    const key = calcConfig.purityKey as '999' | '925';
    return rates.silver[key] || rates.silver['999'] || 0;
  }, [rates, isGold, calcConfig.purityKey]);

  const ratePerGramInr = ratePerGramPaise / 100;

  const [mode, setMode] = useState<'AMOUNT_TO_WEIGHT' | 'WEIGHT_TO_AMOUNT'>('AMOUNT_TO_WEIGHT');
  const [amountInput, setAmountInput] = useState<string>(() =>
    String(isGold ? 5000 : 1000)
  );
  const [weightInput, setWeightInput] = useState<string>('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const effectiveAmountStr = hasInteracted
    ? amountInput
    : String(calcConfig.defaultAmountInr);

  const computedResult = useMemo(() => {
    if (!Number.isFinite(ratePerGramInr) || ratePerGramInr <= 0) {
      return {
        amountNum: 0,
        weightNum: 0,
        displayAmount: effectiveAmountStr,
        displayWeight: '0',
        error: 'Live reference rate is temporarily unavailable.',
      };
    }

    if (mode === 'AMOUNT_TO_WEIGHT') {
      const parsedAmount = Number(effectiveAmountStr);
      if (!effectiveAmountStr || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return {
          amountNum: 0,
          weightNum: 0,
          displayAmount: effectiveAmountStr,
          displayWeight: '0',
          error: 'Enter a valid amount in rupees (₹).',
        };
      }
      const weight = parsedAmount / ratePerGramInr;
      let err: string | null = null;
      if (parsedAmount < calcConfig.minAmountInr) {
        err = `Minimum indicative reference amount is ₹${calcConfig.minAmountInr.toLocaleString('en-IN')}.`;
      } else if (parsedAmount > calcConfig.maxAmountInr) {
        err = `Maximum calculator estimate is ₹${calcConfig.maxAmountInr.toLocaleString('en-IN')}.`;
      }
      return {
        amountNum: parsedAmount,
        weightNum: weight,
        displayAmount: effectiveAmountStr,
        displayWeight: weight.toFixed(calcConfig.decimalPrecision),
        error: err,
      };
    }

    const parsedWeight = Number(weightInput);
    if (!weightInput || !Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      return {
        amountNum: 0,
        weightNum: 0,
        displayAmount: '0',
        displayWeight: weightInput,
        error: `Enter a valid weight in grams (g).`,
      };
    }
    const amt = parsedWeight * ratePerGramInr;
    let err: string | null = null;
    if (amt < calcConfig.minAmountInr) {
      err = `Entered weight equals less than ₹${calcConfig.minAmountInr.toLocaleString('en-IN')}.`;
    } else if (amt > calcConfig.maxAmountInr) {
      err = `Entered weight exceeds calculator limit of ₹${calcConfig.maxAmountInr.toLocaleString('en-IN')}.`;
    }
    return {
      amountNum: amt,
      weightNum: parsedWeight,
      displayAmount: amt.toFixed(2),
      displayWeight: weightInput,
      error: err,
    };
  }, [
    mode,
    effectiveAmountStr,
    weightInput,
    ratePerGramInr,
    calcConfig.decimalPrecision,
    calcConfig.minAmountInr,
    calcConfig.maxAmountInr,
  ]);

  const handleAmountChange = (val: string) => {
    setHasInteracted(true);
    setMode('AMOUNT_TO_WEIGHT');
    setAmountInput(sanitizeDecimalString(val, 2));
  };

  const handleWeightChange = (val: string) => {
    setHasInteracted(true);
    setMode('WEIGHT_TO_AMOUNT');
    setWeightInput(sanitizeDecimalString(val, calcConfig.decimalPrecision));
  };

  const handleSwapDirection = () => {
    setHasInteracted(true);
    if (mode === 'AMOUNT_TO_WEIGHT') {
      const nextWeight = computedResult.weightNum > 0
        ? computedResult.weightNum.toFixed(calcConfig.decimalPrecision)
        : '1';
      setWeightInput(nextWeight);
      setMode('WEIGHT_TO_AMOUNT');
    } else {
      const nextAmt = computedResult.amountNum > 0
        ? Math.round(computedResult.amountNum).toString()
        : String(calcConfig.defaultAmountInr);
      setAmountInput(nextAmt);
      setMode('AMOUNT_TO_WEIGHT');
    }
  };

  const quickPresets = useMemo(() => {
    const base = isGold ? [1000, 5000, 10000, 25000] : [500, 1000, 5000, 10000];
    return base.filter(
      (amt) => amt >= calcConfig.minAmountInr && amt <= calcConfig.maxAmountInr
    );
  }, [isGold, calcConfig.minAmountInr, calcConfig.maxAmountInr]);

  const faqs = useMemo(() => {
    if (content?.faqs && content.faqs.length > 0) {
      return [...content.faqs].sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
      );
    }
    return isGold
      ? [
          {
            question: 'How does DigiGold consultation work with Sri Ramas Jewellery?',
            answer:
              'This page provides today’s live 24K reference rate and an indicative weight estimator so you can plan your gold goals transparently before speaking with our showroom team.',
          },
          {
            question: 'Can I redeem value toward BIS 916 gold ornaments in showroom?',
            answer:
              'Yes. All physical gold jewellery selection, certified weight verification, and billing take place directly at our Sri Ramas Jewellery showrooms with complete purity certification.',
          },
          {
            question: 'Are online DigiGold purchases processed on this website?',
            answer:
              'No. Sri Ramas Jewellery does not collect online payments or maintain online digital wallets on this showcase website. All guidance is advisory and showroom-assisted.',
          },
        ]
      : [
          {
            question: 'What purity standard applies to DigiSilver reference rates?',
            answer:
              'Our DigiSilver reference rate tracks 999 Fine Silver bullion per gram, updated alongside showroom counter rate benchmarks.',
          },
          {
            question: 'Can silver be redeemed for pooja silverware, articles, or ornaments?',
            answer:
              'Yes. Visit our showrooms or connect with our specialists on WhatsApp to explore pooja utensils, silver lamps, bars, and silver ornaments crafted to certified purity.',
          },
          {
            question: 'Does this website accept online silver deposits?',
            answer:
              'No. This website offers an informational live rate guide and calculator only. All transactions and silver handovers happen in person at Sri Ramas Jewellery showrooms.',
          },
        ];
  }, [content, isGold]);

  const defaultWhatsAppHref = buildWhatsAppUrl({
    type: isGold ? 'DIGIGOLD' : 'DIGISILVER',
    customMessage:
      computedResult.amountNum > 0 && computedResult.weightNum > 0
        ? `Namaste Sri Ramas Jewellery,\n\nI was viewing Digi${isGold ? 'Gold' : 'Silver'} (${calcConfig.purityKey}) on your website and checked an indicative reference of ₹${Math.round(computedResult.amountNum).toLocaleString('en-IN')} (~${computedResult.weightNum.toFixed(calcConfig.decimalPrecision)} g).\n\nCould you share more details on showroom enrollment and redemption options?`
        : undefined,
  });

  const confirmWhatsAppHref = useMemo(() => {
    const formattedAmount = Number(computedResult.amountNum || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    const formattedWeight = computedResult.weightNum.toFixed(calcConfig.decimalPrecision);
    const rateFormatted = formatPaiseToInr(ratePerGramPaise);

    const message =
      computedResult.amountNum > 0 && computedResult.weightNum > 0
        ? `Namaste Sri Ramas Jewellery,\n\nI would like to confirm my Digi${isGold ? 'Gold' : 'Silver'} estimation from your website:\n• Entered Amount: ₹${formattedAmount}\n• Estimated ${calcConfig.purityKey} ${isGold ? 'Gold' : 'Silver'} Weight: ${formattedWeight} grams\n• Current Displayed Reference Rate: ₹${rateFormatted}/g\n\nPlease connect with me regarding showroom consultation and guidance.\n\nThank you!`
        : `Namaste Sri Ramas Jewellery,\n\nI am interested in Digi${isGold ? 'Gold' : 'Silver'} (${calcConfig.purityKey}) live rates and showroom guidance. Please assist me.`;

    return buildWhatsAppUrl({
      type: isGold ? 'DIGIGOLD' : 'DIGISILVER',
      customMessage: message,
    });
  }, [buildWhatsAppUrl, computedResult, calcConfig, isGold, ratePerGramPaise]);

  const rateLabelText =
    content?.rateLabel ||
    (isGold
      ? `Today's ${calcConfig.purityKey} Pure Gold Reference Rate`
      : `Today's ${calcConfig.purityKey} Fine Silver Reference Rate`);

  const sourceBadgeText =
    content?.rateSourceLabel ||
    (rates?.isOverride
      ? 'Showroom Counter Reference'
      : rates?.isMockProvider
        ? 'Indicative Showroom Benchmark'
        : rates?.providerName || 'Live Bullion Reference');

  const bannerSrc = content?.bannerImageUrl || content?.mediaUrl || '';
  const disclaimerText =
    calcConfig.disclaimerText ||
    'Indicative estimation based on the current reference rate per gram. No online purchase, order booking, or payment occurs on this website. Final showroom valuation is confirmed at the counter.';

  const heroBgImage = isGold
    ? '/images/generated/digigold-hero-bg.jpg'
    : '/images/generated/digisilver-hero-bg.jpg';

  const eyebrowText = isGold
    ? 'SRI RAMAS DIGIGOLD | 24K PURE GOLD'
    : 'SRI RAMAS DIGISILVER | PURE SILVER';

  const headingText = isGold
    ? 'DIGIGOLD – SAVE IN PURE 24K GOLD'
    : 'DIGISILVER – BUILD YOUR SILVER SAVINGS';

  const descriptionText = isGold
    ? 'Start your gold savings journey with flexible investments and track your accumulated digital gold value with ease.'
    : 'Discover a smarter way to save in digital silver and track your silver holdings conveniently.';

  const secondaryCtaLabel = isGold ? 'EXPLORE DIGISILVER' : 'EXPLORE DIGIGOLD';
  const secondaryCtaHref = isGold ? '/digisilver' : '/digigold';

  return (
    <div className="w-full min-h-screen">
      {/* 1. Full-Viewport Luxury Hero Section (No Outer Card Container) */}
      <section className="relative w-full min-h-[85vh] lg:min-h-[88vh] flex items-center overflow-hidden bg-[#1A0307] text-gold-100 py-16 sm:py-20 lg:py-24 border-b-2 border-gold-500/30">
        {/* Full-bleed Background Luxury Bullion Imagery */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <img
            src={heroBgImage}
            alt={headingText}
            className="w-full h-full object-cover object-center scale-[1.02]"
          />
          {/* Deep Burgundy Contrast Vignette Scrim for 100% Readability */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(20, 2, 5, 0.88) 0%, rgba(36, 5, 11, 0.80) 45%, rgba(20, 2, 5, 0.94) 100%)',
            }}
          />
          {/* Side Scrim for Left-Aligned Luxury Editorial Legibility */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#140205]/95 via-[#24050B]/85 to-transparent/60 pointer-events-none"
          />
          {/* Ambient Champagne Gold Radiance */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[48rem] h-[25rem] rounded-full bg-[#C49A3A]/20 blur-3xl"
          />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            {/* Left Content Column */}
            <div className="space-y-6 max-w-2xl">
              <ScrollReveal variant="fade-up" immediate>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gold-400 bg-burgundy-950 p-0.5 shadow-luxury-gold shrink-0">
                    <img
                      src="/logo.jpg"
                      alt="Sri Ramas Jewellery Crest"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-bold uppercase tracking-widest border border-gold-400/40 shadow-sm backdrop-blur-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
                    <span>{eyebrowText}</span>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal variant="fade-up" delay={80}>
                <h1
                  className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#FCE7B2] leading-tight tracking-wide"
                  style={{
                    textShadow:
                      '0 4px 20px rgba(0, 0, 0, 0.95), 0 2px 6px rgba(0, 0, 0, 0.85)',
                  }}
                >
                  {headingText}
                </h1>
              </ScrollReveal>

              <ScrollReveal variant="fade-up" delay={120}>
                <p
                  className="text-sm sm:text-base lg:text-lg text-gold-100/90 font-light leading-relaxed max-w-xl"
                  style={{
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.85)',
                  }}
                >
                  {descriptionText}
                </p>
              </ScrollReveal>

              {/* Action Buttons */}
              <ScrollReveal variant="fade-up" delay={160}>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <AnimatedCTA
                    variant="gold"
                    href={defaultWhatsAppHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    icon={<MessageCircle className="w-4 h-4" />}
                    className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-luxury-gold"
                  >
                    ENQUIRE ON WHATSAPP
                  </AnimatedCTA>

                  <Link
                    to={secondaryCtaHref}
                    className="px-5 py-3 rounded-xl border-2 border-gold-400/60 bg-burgundy-950/60 text-gold-200 hover:bg-gold-400/20 hover:border-gold-300 text-xs font-bold uppercase tracking-wider transition-all duration-300 backdrop-blur-xs shadow-md"
                  >
                    {secondaryCtaLabel} →
                  </Link>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Column: Live Rate Display Card */}
            <ScrollReveal variant="fade-up" delay={200} className="w-full lg:w-[380px] shrink-0">
              <div className="bg-burgundy-950/85 backdrop-blur-md rounded-2xl border-2 border-gold-400/50 p-6 sm:p-7 shadow-luxury-gold space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gold-300">
                    <TrendingUp className="w-3.5 h-3.5 text-gold-400" />
                    <span>Live Rate Display</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-gold-400/15 border border-gold-400/35 text-[10px] font-semibold text-gold-200">
                    {sourceBadgeText}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gold-200/80 mb-1">{rateLabelText}</p>
                  {ratesLoading ? (
                    <div className="h-10 w-44 rounded bg-gold-400/20 animate-pulse" />
                  ) : ratesError || ratePerGramPaise <= 0 ? (
                    <div className="space-y-2 py-1">
                      <p className="text-sm font-semibold text-amber-200">
                        Reference rate unavailable right now.
                      </p>
                      <button
                        type="button"
                        onClick={() => refetchRates()}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gold-400/20 text-gold-200 text-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Refresh Rate</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-3xl sm:text-4xl font-extrabold text-[#FCE7B2] tabular-nums">
                        {formatPaiseToInr(ratePerGramPaise)}
                      </span>
                      <span className="text-xs text-gold-300 font-medium">/ gram</span>
                    </div>
                  )}
                </div>

                {rates?.effectiveDate && (
                  <div className="flex items-center gap-1.5 text-[11px] text-gold-200/75 border-t border-gold-500/25 pt-3">
                    <Clock className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                    <span>Updated: {formatDateTime(rates.effectiveDate)}</span>
                  </div>
                )}

                <p className="text-[10.5px] text-gold-300/75 leading-relaxed">
                  Advisory showroom reference. Visit showroom counter for final certified weights and confirmation.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Main Content Sections: Educational Guide, Calculator, FAQs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12 sm:space-y-16">
        {/* 2. Educational Section — What is DigiGold / DigiSilver? */}
        <DigiEducationalSection metal={metal} />

      {/* 3. Interactive Bi-Directional Amount <-> Grams Calculator */}
      {calcConfig.isEnabled ? (
        <ScrollReveal variant="fade-up">
          <section
            aria-label={`Digi${isGold ? 'Gold' : 'Silver'} Indicative Calculator`}
            className="bg-white rounded-3xl border border-gold-400/60 shadow-luxury overflow-hidden"
          >
            <div className="bg-ivory-50 border-b border-gold-300/60 px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-gold-700">
                  Interactive Bullion Estimator
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-burgundy-950">
                  Digi{isGold ? 'Gold' : 'Silver'} Amount &amp; Weight Calculator
                </h2>
              </div>

              <button
                type="button"
                onClick={handleSwapDirection}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-burgundy-900 hover:bg-burgundy-800 text-gold-200 text-xs font-bold transition-colors self-start sm:self-auto"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-gold-400" />
                <span>
                  {mode === 'AMOUNT_TO_WEIGHT'
                    ? 'Switch: Enter Weight (g)'
                    : 'Switch: Enter Amount (₹)'}
                </span>
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Quick Amount Chips */}
              {quickPresets.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-stone-500 mr-1">
                    Quick Reference:
                  </span>
                  {quickPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAmountChange(String(preset))}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        mode === 'AMOUNT_TO_WEIGHT' && Number(effectiveAmountStr) === preset
                          ? 'bg-burgundy-900 text-gold-200 border-burgundy-900'
                          : 'bg-ivory-50 border-gold-400/60 text-burgundy-900 hover:bg-gold-100'
                      }`}
                    >
                      ₹{preset.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              )}

              {/* Bi-directional Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
                {/* INR Amount Input */}
                <div className="md:col-span-5 space-y-1.5">
                  <label
                    htmlFor="digi-amount-input"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700"
                  >
                    Indicative Amount (INR ₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-burgundy-900 font-bold text-sm">
                      ₹
                    </span>
                    <input
                      id="digi-amount-input"
                      type="text"
                      inputMode="decimal"
                      value={
                        mode === 'AMOUNT_TO_WEIGHT'
                          ? effectiveAmountStr
                          : computedResult.displayAmount
                      }
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className={`w-full pl-8 pr-4 py-3 rounded-xl border text-base font-mono font-bold outline-none transition-colors ${
                        mode === 'AMOUNT_TO_WEIGHT'
                          ? 'border-gold-500 bg-white text-burgundy-950 ring-2 ring-gold-300/35'
                          : 'border-stone-300 bg-stone-50 text-stone-800 focus:border-gold-500 focus:bg-white'
                      }`}
                    />
                  </div>
                </div>

                {/* Swap Icon Divider */}
                <div className="md:col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={handleSwapDirection}
                    aria-label="Swap calculation direction"
                    className="w-10 h-10 rounded-full border border-gold-400/70 bg-ivory-50 hover:bg-gold-100 text-burgundy-900 flex items-center justify-center transition-transform hover:scale-105"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Grams Input */}
                <div className="md:col-span-5 space-y-1.5">
                  <label
                    htmlFor="digi-weight-input"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700"
                  >
                    Equivalent {isGold ? `${calcConfig.purityKey} Gold` : `${calcConfig.purityKey} Silver`} Weight (Grams)
                  </label>
                  <div className="relative">
                    <input
                      id="digi-weight-input"
                      type="text"
                      inputMode="decimal"
                      value={
                        mode === 'WEIGHT_TO_AMOUNT'
                          ? weightInput
                          : computedResult.displayWeight
                      }
                      onChange={(e) => handleWeightChange(e.target.value)}
                      className={`w-full pl-4 pr-10 py-3 rounded-xl border text-base font-mono font-bold outline-none transition-colors ${
                        mode === 'WEIGHT_TO_AMOUNT'
                          ? 'border-gold-500 bg-white text-burgundy-950 ring-2 ring-gold-300/35'
                          : 'border-stone-300 bg-stone-50 text-stone-800 focus:border-gold-500 focus:bg-white'
                      }`}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-semibold text-xs">
                      g
                    </span>
                  </div>
                </div>
              </div>

              {/* Validation Notice or Clean Summary */}
              {computedResult.error ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{computedResult.error}</span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-ivory-50 border border-gold-300/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-gold-700">
                      Indicative Estimation Result
                    </p>
                    <p className="font-serif text-base sm:text-lg font-bold text-burgundy-950">
                      ₹{Number(computedResult.amountNum || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}{' '}
                      ≈{' '}
                      <span className="text-gold-700">
                        {computedResult.weightNum.toFixed(calcConfig.decimalPrecision)} grams
                      </span>{' '}
                      of {calcConfig.purityKey} {isGold ? 'Gold' : 'Silver'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5 shrink-0">
                    <AnimatedCTA
                      variant="whatsapp"
                      href={confirmWhatsAppHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      icon={
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white shrink-0" aria-hidden="true">
                          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.39-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.71 4.3 3.8 2.53 1.09 2.53.73 2.98.69.46-.04 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29" />
                        </svg>
                      }
                      className="px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-md hover:shadow-lg transition-all"
                    >
                      Confirm on WhatsApp
                    </AnimatedCTA>
                    <AnimatedCTA
                      variant="outline"
                      href={telHref}
                      icon={<Phone className="w-4 h-4 text-gold-700" />}
                      className="px-4 py-3 rounded-xl text-xs font-semibold"
                    >
                      Call {displayPhone}
                    </AnimatedCTA>
                  </div>
                </div>
              )}

              {/* Advisory Disclaimer */}
              <div className="flex items-start gap-2.5 text-[11px] text-stone-600 bg-stone-50 border border-stone-200 rounded-xl p-3.5">
                <Info className="w-4 h-4 text-gold-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Showroom Advisory Note:</strong> {disclaimerText}
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>
      ) : (
        <div className="bg-white rounded-2xl border border-gold-300/60 p-6 text-xs text-stone-600 flex items-center gap-3">
          <Info className="w-5 h-5 text-gold-700 shrink-0" />
          <span>
            The online Digi{isGold ? 'Gold' : 'Silver'} estimator is currently offline while showroom rates update. Please contact our team directly on WhatsApp for assistance.
          </span>
        </div>
      )}

      {/* 3. Verified Pillar Cards */}
      <StaggerReveal staggerMs={85} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group bg-white p-6 rounded-2xl border border-gold-300/60 shadow-sm space-y-2 transition-all duration-300 hover:-translate-y-1 hover:border-gold-400 hover:shadow-luxury">
          <TrendingUp className="w-8 h-8 text-gold-700" />
          <h3 className="font-serif text-lg font-bold text-burgundy-950">
            Live Rate Transparency
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            View authentic daily showroom bullion reference benchmarks for {calcConfig.purityKey} {isGold ? 'Gold' : 'Silver'} before you plan your purchase.
          </p>
        </div>

        <div className="group bg-white p-6 rounded-2xl border border-gold-300/60 shadow-sm space-y-2 transition-all duration-300 hover:-translate-y-1 hover:border-gold-400 hover:shadow-luxury">
          <Sparkles className="w-8 h-8 text-gold-700" />
          <h3 className="font-serif text-lg font-bold text-burgundy-950">
            Showroom Jewellery Choice
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Consult our specialists to select BIS Hallmarked ornaments, wedding sets, or {isGold ? '24K' : '999'} coins/silverware aligned with your savings goal.
          </p>
        </div>

        <div className="group bg-white p-6 rounded-2xl border border-gold-300/60 shadow-sm space-y-2 transition-all duration-300 hover:-translate-y-1 hover:border-gold-400 hover:shadow-luxury">
          <ShieldCheck className="w-8 h-8 text-gold-700" />
          <h3 className="font-serif text-lg font-bold text-burgundy-950">
            Verified Showroom Settlement
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Online wallet checkouts are disabled platform-wide. All receipts, hallmark verification, and handovers happen personally at Sri Ramas Jewellery showrooms.
          </p>
        </div>
      </StaggerReveal>

      {/* 4. Interactive FAQs */}
      {faqs.length > 0 && (
        <ScrollReveal variant="fade-up">
          <section className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-5 shadow-sm">
            <h2 className="font-serif text-2xl font-bold text-burgundy-950">
              Digi{isGold ? 'Gold' : 'Silver'} — Frequently Asked Questions
            </h2>
            <div className="divide-y divide-stone-200">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div key={idx} className="py-3.5 first:pt-1 last:pb-1">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-4 text-left font-serif font-bold text-sm sm:text-base text-burgundy-900 hover:text-burgundy-700"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-gold-700 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-2.5 text-xs sm:text-sm text-stone-600 leading-relaxed pr-6">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-stone-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Need personal guidance from a showroom advisor?</span>
              </div>
              <AnimatedCTA
                variant="whatsapp"
                href={defaultWhatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                icon={<MessageCircle className="w-4 h-4" />}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Ask on WhatsApp
              </AnimatedCTA>
            </div>
          </section>
        </ScrollReveal>
      )}
      </div>
    </div>
  );
};
