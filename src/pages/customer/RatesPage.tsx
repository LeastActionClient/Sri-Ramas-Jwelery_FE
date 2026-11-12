import React from 'react';
import { useRates, useRateHistory } from '@/hooks/useRates';
import { formatPaiseToInr } from '@/utils/currency';
import { TrendingUp, ShieldCheck, Clock } from 'lucide-react';
import { useStoreWhatsApp } from '@/hooks/useStoreWhatsApp';
import {
  ScrollReveal,
  StaggerReveal,
  AnimatedHeading,
  AnimatedCTA,
} from '@/components/motion';

export const RatesPage: React.FC = () => {
  const { data: rates, isLoading } = useRates();
  const { data: history = [] } = useRateHistory(30);
  const { buildWhatsAppUrl } = useStoreWhatsApp();

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Page Banner */}
        <ScrollReveal variant="fade-up" immediate>
          <div className="bg-brand-maroon-gradient text-gold-100 rounded-2xl p-8 sm:p-12 border border-gold-500/40 shadow-luxury text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-semibold uppercase tracking-widest border border-gold-400/30">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Bullion Market Transparency</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-gold-100">
              Live Gold & Silver Rates
            </h1>
            <p className="text-xs sm:text-sm text-gold-200/80 max-w-xl mx-auto font-light leading-relaxed">
              Sri Ramas Jewellery publishes daily certified bullion rates directly aligned with official bullion market benchmarks. Zero hidden spreads.
            </p>
          </div>
        </ScrollReveal>

        {/* Live Rates Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-burgundy-950 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold-600" />
              <span>Today's Live Bullion Benchmarks</span>
            </h2>
            <span className="text-xs text-stone-500">Prices per 1 Gram (INR)</span>
          </div>

          {isLoading || !rates ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-36 bg-stone-200 rounded-xl" />
              ))}
            </div>
          ) : (
            <StaggerReveal
              staggerMs={65}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {/* 24K */}
              <div className="bg-white rounded-xl p-6 border-2 border-stone-200 shadow-sm space-y-3 transition-all duration-300 ease-luxury hover:-translate-y-1 hover:border-gold-400/80 hover:shadow-luxury">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Gold 24 Karat
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                    999 Fineness
                  </span>
                </div>
                <div className="space-y-1">
                  <span
                    key={`24k-${rates.gold['24K']}`}
                    className="inline-block animate-rate-update text-2xl sm:text-3xl font-serif font-extrabold text-burgundy-950 tabular-nums"
                  >
                    {formatPaiseToInr(rates.gold['24K'])}
                  </span>
                  <span className="text-[11px] text-stone-400 block">per gram (Raw Bullion)</span>
                </div>
                <p className="text-xs text-stone-600 pt-2 border-t border-stone-100">
                  Ideal for gold coin and bullion investment.
                </p>
              </div>

              {/* 22K (916) */}
              <div className="bg-gold-50/50 rounded-xl p-6 border-2 border-gold-500 shadow-luxury-gold space-y-3 ring-1 ring-gold-400 transition-all duration-300 ease-luxury hover:-translate-y-1 hover:shadow-luxury">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold uppercase tracking-wider text-burgundy-900">
                    Gold 22 Karat (916)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-brand-gold-gradient text-burgundy-950 text-[10px] font-bold uppercase">
                    Standard Jewellery
                  </span>
                </div>
                <div className="space-y-1">
                  <span
                    key={`22k-${rates.gold['22K']}`}
                    className="inline-block animate-rate-update text-2xl sm:text-3xl font-serif font-extrabold text-burgundy-900 tabular-nums"
                  >
                    {formatPaiseToInr(rates.gold['22K'])}
                  </span>
                  <span className="text-[11px] text-burgundy-700/80 block">per gram (BIS Hallmarked)</span>
                </div>
                <p className="text-xs text-stone-700 pt-2 border-t border-gold-300/60 font-medium">
                  Benchmark rate for all bridal ornaments & necklaces.
                </p>
              </div>

              {/* 18K */}
              <div className="bg-white rounded-xl p-6 border-2 border-stone-200 shadow-sm space-y-3 transition-all duration-300 ease-luxury hover:-translate-y-1 hover:border-gold-400/80 hover:shadow-luxury">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Gold 18 Karat
                  </span>
                  <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[10px] font-bold">
                    750 Fineness
                  </span>
                </div>
                <div className="space-y-1">
                  <span
                    key={`18k-${rates.gold['18K']}`}
                    className="inline-block animate-rate-update text-2xl sm:text-3xl font-serif font-extrabold text-burgundy-950 tabular-nums"
                  >
                    {formatPaiseToInr(rates.gold['18K'])}
                  </span>
                  <span className="text-[11px] text-stone-400 block">per gram</span>
                </div>
                <p className="text-xs text-stone-600 pt-2 border-t border-stone-100">
                  Selected for fine diamond and studded jewellery.
                </p>
              </div>

              {/* Silver 999 */}
              <div className="bg-white rounded-xl p-6 border-2 border-stone-200 shadow-sm space-y-3 transition-all duration-300 ease-luxury hover:-translate-y-1 hover:border-slate-300 hover:shadow-luxury">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Silver 999 Fine
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                    Pure Bullion
                  </span>
                </div>
                <div className="space-y-1">
                  <span
                    key={`silver-${rates.silver['999']}`}
                    className="inline-block animate-rate-update text-2xl sm:text-3xl font-serif font-extrabold text-slate-900 tabular-nums"
                  >
                    {formatPaiseToInr(rates.silver['999'])}
                  </span>
                  <span className="text-[11px] text-stone-400 block">per gram (₹{((rates.silver['999'] * 1000) / 100).toLocaleString('en-IN')}/kg)</span>
                </div>
                <p className="text-xs text-stone-600 pt-2 border-t border-stone-100">
                  Used for pooja vessels, deities & silver giftware.
                </p>
              </div>
            </StaggerReveal>
          )}
        </div>

        {/* 30-Day Historical Bullion Rate Trends */}
        <ScrollReveal variant="fade-up">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold-700 block">
                Historical Transparency
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-burgundy-950 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gold-600" />
                <span>Recent Rate History &amp; Trends</span>
              </h2>
            </div>
            <span className="text-xs text-stone-500">Last 30 Days Movement</span>
          </div>

          {history && history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Metal</th>
                    <th className="py-2.5 px-3">Purity</th>
                    <th className="py-2.5 px-3 text-right">Rate / 1g (INR)</th>
                    <th className="py-2.5 px-3">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {history.slice(0, 10).map((h: any, idx: number) => (
                    <tr key={idx} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-stone-900">
                        {new Date(h.effectiveFrom || h.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${h.metal === 'GOLD' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>
                          {h.metal}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-stone-800">
                        {h.purity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-burgundy-900">
                        {formatPaiseToInr(h.ratePerGramPaise)}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-stone-500">
                        {h.source === 'MANUAL_OVERRIDE' ? 'Showroom Published' : 'Benchmark Feed'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-stone-500 py-4 text-center">
              Historical movement records will appear here as daily rates are published.
            </p>
          )}
          </div>
        </ScrollReveal>

        {/* Educational Section: Transparent Pricing Formula */}
        <ScrollReveal variant="fade-up">
          <div className="bg-white rounded-2xl border border-gold-400/50 p-6 sm:p-10 shadow-sm space-y-6">
            <AnimatedHeading
              align="left"
              kicker="Consumer Empowerment"
              title="How Jewellery Pricing is Calculated at Sri Ramas Jewellery"
              subtitle="We uphold complete billing transparency. When you choose a bespoke piece at any Sri Ramas showroom, your bill reflects this standardized formula:"
              as="h2"
              showRule
              className="border-b border-stone-200 pb-4"
            />

            <StaggerReveal
              staggerMs={70}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center"
            >
              <div className="p-4 bg-ivory-50 rounded-xl border border-gold-200 transition-all duration-300 ease-luxury hover:-translate-y-0.5 hover:border-gold-400">
                <span className="text-xs text-stone-500 font-bold block mb-1">Step 1</span>
                <h3 className="font-serif font-bold text-sm text-burgundy-900">Net Gold Weight</h3>
                <p className="text-[11px] text-stone-600 mt-1">Weight of precious metal alone (excluding all gemstones & threads)</p>
              </div>

              <div className="p-4 bg-ivory-50 rounded-xl border border-gold-200 transition-all duration-300 ease-luxury hover:-translate-y-0.5 hover:border-gold-400">
                <span className="text-xs text-stone-500 font-bold block mb-1">Step 2</span>
                <h3 className="font-serif font-bold text-sm text-burgundy-900">Live Rate</h3>
                <p className="text-[11px] text-stone-600 mt-1">Multiplied by today's certified 22K (or 18K) rate per gram</p>
              </div>

              <div className="p-4 bg-ivory-50 rounded-xl border border-gold-200 transition-all duration-300 ease-luxury hover:-translate-y-0.5 hover:border-gold-400">
                <span className="text-xs text-stone-500 font-bold block mb-1">Step 3</span>
                <h3 className="font-serif font-bold text-sm text-burgundy-900">Making & Wastage</h3>
                <p className="text-[11px] text-stone-600 mt-1">Craftsmanship charges based on intricacy (flat or %)</p>
              </div>

              <div className="p-4 bg-ivory-50 rounded-xl border border-gold-200 transition-all duration-300 ease-luxury hover:-translate-y-0.5 hover:border-gold-400">
                <span className="text-xs text-stone-500 font-bold block mb-1">Step 4</span>
                <h3 className="font-serif font-bold text-sm text-burgundy-900">Government GST</h3>
                <p className="text-[11px] text-stone-600 mt-1">Statutory 3% GST applied to the subtotal</p>
              </div>
            </StaggerReveal>

            <div className="bg-gold-50 border border-gold-300 rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-gold-700 shrink-0 mt-0.5" />
              <div className="text-xs text-stone-700 space-y-1">
                <h3 className="font-bold text-burgundy-900">100% Certified HUID Hallmarking</h3>
                <p>
                  Every gold ornament at Sri Ramas Jewellery carries the official BIS Hallmark logo, 916 purity stamp, and a unique 6-digit alphanumeric HUID laser-etched by certified Assaying & Hallmarking Centres. You can verify this anytime via the BIS Care app.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Rate Consultation CTA */}
        <ScrollReveal variant="scale">
          <div className="bg-brand-maroon-gradient rounded-2xl p-8 sm:p-10 text-gold-100 flex flex-col sm:flex-row items-center justify-between gap-6 border border-gold-500/40 shadow-luxury">
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="font-serif text-2xl font-bold text-gold-100">
                Need a Custom Rate Valuation?
              </h2>
              <p className="text-xs sm:text-sm text-gold-200/80 font-light">
                Speak with our senior bullion advisors regarding bulk bridal purchases or gold exchange evaluations.
              </p>
            </div>
            <AnimatedCTA
              variant="gold"
              href={buildWhatsAppUrl({ type: 'RATES' })}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full text-xs whitespace-nowrap"
            >
              Enquire with Bullion Specialist
            </AnimatedCTA>
          </div>
        </ScrollReveal>
      </div>
    </>
  );
};
