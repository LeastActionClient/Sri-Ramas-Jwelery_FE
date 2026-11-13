import React from 'react';
import { useRates } from '@/hooks/useRates';
import { formatPaiseToInr } from '@/utils/currency';
import { Sparkles, TrendingUp, Clock } from 'lucide-react';

export const RateTicker: React.FC = () => {
  const { data: rates, isLoading } = useRates();

  if (isLoading || !rates) {
    return (
      <div className="bg-burgundy-950 text-gold-200 text-xs py-2 px-4 border-b border-gold-800/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between animate-pulse">
          <span>Loading today's live bullion market rates...</span>
          <span className="text-gold-400">Sri Ramas Jewellery • Estd. 1987</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-burgundy-950 text-gold-100 text-xs py-2 px-4 border-b border-gold-700/30 overflow-hidden shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Live indicator & Rates */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-1.5 font-semibold text-gold-400 uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-gold-400" />
            <span>Today's Bullion Rates / 1g:</span>
            {rates.isOverride ? (
              <span className="px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-300 text-[10px] font-normal border border-gold-500/30">
                Showroom Published
              </span>
            ) : rates.source === 'LIVE_MARKET' || rates.source === 'IBJA' ? (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-normal border border-emerald-500/30">
                Live Market
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-normal border border-amber-500/30">
                Demo Benchmarks
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 sm:gap-6 font-medium text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-gold-300/80">Gold 24K:</span>
              <span className="font-semibold text-amber-200">
                {formatPaiseToInr(rates.gold['24K'])}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-gold-300/80">Gold 22K (916):</span>
              <span className="font-semibold text-amber-200">
                {formatPaiseToInr(rates.gold['22K'])}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-gold-300/80">Gold 18K:</span>
              <span className="font-semibold text-amber-200">
                {formatPaiseToInr(rates.gold['18K'])}
              </span>
            </div>

            <div className="flex items-center gap-1.5 hidden md:flex">
              <span className="text-slate-300">Silver 999:</span>
              <span className="font-semibold text-slate-100">
                {formatPaiseToInr(rates.silver['999'])}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Live Benchmark Status & Time */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] text-gold-300/70">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gold-400/80" />
            Updated Today
          </span>
          <span className="text-gold-700">•</span>
          <span className="text-gold-300/80 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-gold-400" />
            Showroom 916 Benchmark Purity
          </span>
        </div>
      </div>
    </div>
  );
};
