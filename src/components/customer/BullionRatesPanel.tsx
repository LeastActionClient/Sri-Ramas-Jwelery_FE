import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Info, RefreshCw, ShieldCheck } from 'lucide-react';
import { LiveRatesResponse } from '@/types';
import { formatPaiseToInr } from '@/utils/currency';
import { formatDateTime } from '@/utils/date';
import { AnimatedHeading, ImageReveal, ScrollReveal, StaggerReveal } from '@/components/motion';

interface BullionRatesPanelProps {
  rates?: LiveRatesResponse;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

interface RateTileConfig {
  id: string;
  label: string;
  purityNote: string;
  metal: 'GOLD' | 'SILVER';
  highlighted?: boolean;
  getPaise: (rates: LiveRatesResponse) => number;
}

const RATE_TILES: RateTileConfig[] = [
  {
    id: 'gold-24k',
    label: '24K Pure Gold (1g)',
    purityNote: '(99.9% Purity)',
    metal: 'GOLD',
    getPaise: (r) => r.gold['24K'],
  },
  {
    id: 'gold-22k',
    label: '22K Gold (1g)',
    purityNote: '(Hallmarked Jewellery Gold)',
    metal: 'GOLD',
    highlighted: true,
    getPaise: (r) => r.gold['22K'],
  },
  {
    id: 'gold-18k',
    label: '18K Gold (1g)',
    purityNote: '(Diamond Setting Gold)',
    metal: 'GOLD',
    getPaise: (r) => r.gold['18K'],
  },
  {
    id: 'silver-999',
    label: 'Silver 999 (1g)',
    purityNote: '(Pure Silver)',
    metal: 'SILVER',
    getPaise: (r) => r.silver['999'],
  },
  {
    id: 'silver-925',
    label: 'Silver 925 (1g)',
    purityNote: '(Sterling Silver)',
    metal: 'SILVER',
    getPaise: (r) => r.silver['925'],
  },
];

const BullionBarIcon: React.FC<{ metal: 'GOLD' | 'SILVER' }> = ({ metal }) => {
  const isGold = metal === 'GOLD';
  return (
    <svg
      className="w-7 h-5 mx-auto mb-1 drop-shadow-xs"
      viewBox="0 0 36 24"
      fill="none"
      aria-hidden="true"
    >
      {/* Back bar */}
      <polygon
        points="6,11 16,4 28,6 18,13"
        fill={isGold ? '#F5D57A' : '#E2E8F0'}
        stroke={isGold ? '#B88928' : '#8592A3'}
        strokeWidth="0.9"
      />
      <polygon
        points="6,11 18,13 18,17 6,15"
        fill={isGold ? '#D6A63D' : '#AEB8C5'}
        stroke={isGold ? '#9A6F18' : '#748192'}
        strokeWidth="0.8"
      />
      <polygon
        points="18,13 28,6 28,10 18,17"
        fill={isGold ? '#BD8B24' : '#94A0B0'}
        stroke={isGold ? '#9A6F18' : '#748192'}
        strokeWidth="0.8"
      />
      {/* Front bar */}
      <polygon
        points="11,16 21,9 33,11 23,18"
        fill={isGold ? '#FCE293' : '#F1F5F9'}
        stroke={isGold ? '#B88928' : '#8592A3'}
        strokeWidth="0.9"
      />
      <polygon
        points="11,16 23,18 23,22 11,20"
        fill={isGold ? '#DFB047' : '#CBD5E1'}
        stroke={isGold ? '#9A6F18' : '#748192'}
        strokeWidth="0.8"
      />
      <polygon
        points="23,18 33,11 33,15 23,22"
        fill={isGold ? '#C28F25' : '#9AA6B5'}
        stroke={isGold ? '#9A6F18' : '#748192'}
        strokeWidth="0.8"
      />
    </svg>
  );
};

function formatSourceStatus(rates: LiveRatesResponse): string {
  if (rates.allManualOverride) {
    return 'Showroom Manual Rate (Not Live Feed)';
  }
  if (rates.isMockProvider && rates.isOverride) {
    return 'Demo Benchmark (Mock + Showroom Override)';
  }
  if (rates.isMockProvider) {
    return `Demo Benchmark (Mock${rates.providerName ? ` • ${rates.providerName}` : ''})`;
  }
  if (rates.isLiveVerified && rates.providerName) {
    return `Verified Live Feed (${rates.providerName})`;
  }
  return rates.providerName || rates.source || 'Benchmark Rate Provider';
}

export const BullionRatesPanel: React.FC<BullionRatesPanelProps> = ({
  rates,
  isLoading = false,
  isError = false,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <section aria-label="Today's Bullion Rates" className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8">
        <div className="bg-[#FCF7EC] rounded-2xl border border-[#DFC68E]/80 shadow-luxury p-6 sm:p-8 animate-pulse space-y-4">
          <div className="h-5 w-52 bg-[#E9DAC0] rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="h-28 bg-[#F2E5CD] rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError || !rates) {
    return (
      <section aria-label="Today's Bullion Rates" className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8">
        <div className="bg-[#FCF7EC] rounded-2xl border border-[#DFC68E] shadow-luxury p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A4792B] block">
              Bullion Rate Transparency
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#450A13] mt-0.5">
              Bullion Rates Temporarily Unavailable
            </h2>
            <p className="text-xs text-[#6B4A3E] mt-1">
              Unable to load current bullion benchmarks from the server. Please retry or check our rates desk.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#4D0F18] text-[#FBE9C2] text-xs font-semibold hover:bg-[#661622] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
            <Link
              to="/rates"
              className="text-xs font-semibold text-[#7B5218] hover:text-[#450A13] flex items-center gap-1 underline underline-offset-4"
            >
              <span>View Rates Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const kickerText = rates.isLiveVerified
    ? 'LIVE BULLION TRANSPARENCY'
    : rates.allManualOverride
      ? 'SHOWROOM BULLION TRANSPARENCY'
      : 'BENCHMARK BULLION TRANSPARENCY';

  const headingText = rates.isLiveVerified
    ? "TODAY'S LIVE BULLION RATES"
    : "TODAY'S BULLION RATES";

  return (
    <section aria-label="Today's Bullion Rates" className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8">
      <ScrollReveal
        variant="fade-up"
        distance={20}
        className="bg-gradient-to-br from-[#FFFDF8] via-[#FCF6EA] to-[#F9EFDB] rounded-2xl border border-[#DEC48C] shadow-luxury overflow-hidden flex flex-col lg:flex-row"
      >
        {/* Left Decorative Photo Panel with S-Curve Gold Border */}
        <div className="relative hidden lg:block lg:w-[260px] xl:w-[290px] shrink-0 bg-[#3A060E] overflow-hidden group">
          <ImageReveal
            src="/images/bullion-rates-banner.jpg"
            alt="Gold and silver bullion bars with traditional oil lamp on burgundy velvet"
            className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#240308]/35 via-transparent to-[#240308]/15 pointer-events-none" />

          {/* Sweeping Antique-Gold Curved Divider */}
          <svg
            viewBox="0 0 48 260"
            preserveAspectRatio="none"
            className="absolute top-0 right-0 h-full w-10 pointer-events-none"
            aria-hidden="true"
          >
            <path
              d="M6 0 C32 70, 44 185, 10 260 L48 260 L48 0 Z"
              fill="#FCF6EA"
            />
            <path
              d="M6 0 C32 70, 44 185, 10 260"
              fill="none"
              stroke="#C99B3B"
              strokeWidth="2.5"
            />
          </svg>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 p-5 sm:p-6 lg:px-7 lg:py-6 flex flex-col justify-between gap-4">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <AnimatedHeading
              kicker={kickerText}
              title={headingText}
              kickerClassName="text-[10px] sm:text-[11px] tracking-[0.22em] text-[#A4792B]"
              titleClassName="text-xl sm:text-2xl lg:text-[26px] font-extrabold uppercase tracking-wide text-[#450A13]"
            />

            <Link
              to="/rates"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6F4812] hover:text-[#450A13] transition-colors self-start sm:self-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded"
            >
              <span className="relative pb-0.5 after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[1.5px] after:bg-[#C69C46] after:transition-all after:duration-300 group-hover:after:bg-[#450A13] group-hover:after:scale-x-105">
                Historical Trends &amp; Calculation Details
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#A4792B] group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

          {/* 5 Metal Tiles with Staggered Reveal & Verified Value Transition */}
          <StaggerReveal
            staggerMs={65}
            variant="scale"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3"
          >
            {RATE_TILES.map((tile) => {
              const paise = tile.getPaise(rates);
              const isGold = tile.metal === 'GOLD';

              const cardClasses = tile.highlighted
                ? 'bg-gradient-to-b from-[#FAF0C9] to-[#F0D998] border-[1.5px] border-[#C99B3B] hover:border-[#A87D24] ring-1 ring-[#D4AC4B]/35 shadow-sm hover:shadow-luxury-gold'
                : isGold
                  ? 'bg-gradient-to-b from-[#FDF8EC] to-[#F7EBD5] border border-[#E2CCA1] hover:border-[#C99B3B] hover:shadow-md'
                  : 'bg-gradient-to-b from-[#F3F5F8] to-[#E6EBF1] border border-[#CBD3DE] hover:border-[#94A3B8] hover:shadow-md';

              return (
                <div
                  key={tile.id}
                  className={`group rounded-xl px-3 py-3.5 sm:py-4 text-center flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1 ${cardClasses}`}
                >
                  <div className="transition-transform duration-300 group-hover:scale-[1.03]">
                    <BullionBarIcon metal={tile.metal} />
                    <span
                      className={`block text-[11px] sm:text-xs leading-snug ${
                        tile.highlighted
                          ? 'font-bold text-[#420B14]'
                          : isGold
                            ? 'font-medium text-[#522424]'
                            : 'font-medium text-[#303640]'
                      }`}
                    >
                      {tile.label}
                    </span>
                  </div>

                  {/* Keyed purely on real backend paise so transitions run only on genuine rate updates */}
                  <span
                    key={`${tile.id}-${paise}`}
                    className={`animate-rate-update font-serif font-extrabold text-base sm:text-lg lg:text-xl tracking-tight my-1 ${
                      isGold ? 'text-[#420B14]' : 'text-[#1E242E]'
                    }`}
                  >
                    {paise > 0 ? formatPaiseToInr(paise) : '—'}
                  </span>

                  <span
                    className={`block text-[10px] sm:text-[10.5px] leading-tight ${
                      tile.highlighted
                        ? 'font-semibold text-[#5B261C]'
                        : isGold
                          ? 'text-[#6B4A3E]'
                          : 'text-[#4E5663]'
                    }`}
                  >
                    {tile.purityNote}
                  </span>
                </div>
              );
            })}
          </StaggerReveal>

          {/* Honest Source & Timestamp Metadata Footer */}
          <div className="border-t border-[#E6D6B5] pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#5B4035]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Clock className="w-3.5 h-3.5 text-[#8E692B] shrink-0" />
              <span>
                <strong className="font-semibold text-[#3E1319]">Last Updated:</strong>{' '}
                {formatDateTime(rates.effectiveDate)}
              </span>
              {rates.isStale && (
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-semibold">
                  Older than 24h
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 transition-opacity duration-300">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8E692B] shrink-0" />
              <span>
                <strong className="font-semibold text-[#3E1319]">Source:</strong>{' '}
                {formatSourceStatus(rates)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#8E692B] shrink-0" />
              <span>Rates are indicative and may vary at the showroom.</span>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
};
