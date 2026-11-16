import React from 'react';
import {
  ShieldCheck,
  Sparkles,
  Scale,
  Wallet,
  CheckCircle2,
  Gem,
  Award,
} from 'lucide-react';
import { ScrollReveal } from '@/components/motion';

interface DigiEducationalSectionProps {
  metal: 'GOLD' | 'SILVER';
}

export const DigiEducationalSection: React.FC<DigiEducationalSectionProps> = ({ metal }) => {
  const isGold = metal === 'GOLD';

  const sectionTitle = isGold ? 'What is DigiGold?' : 'What is DigiSilver?';
  const purityLabel = isGold ? '24K Pure Gold (999 Purity)' : '999 Fine Silver (99.9% Purity)';
  const showcaseImage = isGold
    ? '/images/generated/digigold-split-showcase.jpg'
    : '/images/generated/digisilver-split-showcase.jpg';

  const conciseIntro = isGold
    ? 'Sri Ramas DigiGold is a modern, reliable savings programme allowing you to accumulate certified 24K pure gold digitally at live counter benchmarks. Start with any flexible budget, watch your gold reserve grow transparently, and redeem for physical BIS 916 hallmarked jewellery or minted coins anytime at our showrooms.'
    : 'Sri Ramas DigiSilver is a smarter, disciplined way to build precious silver savings in certified 999 fine silver. Save on your terms with zero locked tenures, track your accumulated silver holdings with live accuracy, and exchange for consecrated pooja silverware, ornaments, or silver bars at our counters.';

  const featurePoints = isGold
    ? [
        {
          icon: ShieldCheck,
          badge: '100% Purity',
          title: '24K (999) Benchmark Purity',
          description:
            'Every rupee allocated is backed by 24K 999 pure gold benchmarked to official daily bullion rates with zero purity compromise.',
        },
        {
          icon: Wallet,
          badge: 'Complete Freedom',
          title: 'Flexible Incremental Savings',
          description:
            'Save at your own comfort starting from ₹100 with zero compulsory monthly commitments or lock-in penalties.',
        },
        {
          icon: Scale,
          badge: 'Counter Redemption',
          title: 'Physical Showroom Jewellery Handover',
          description:
            'Exchange your digital gold balance for BIS 916 hallmarked bridal jewellery, antique temple sets, or gold coins at Sri Ramas Jewellery showrooms.',
        },
      ]
    : [
        {
          icon: ShieldCheck,
          badge: '999 Fineness',
          title: '999 Fine Silver Standard',
          description:
            'All accumulated digital silver reflects 999 parts per thousand fine silver bullion rates, verified transparently every day.',
        },
        {
          icon: Wallet,
          badge: 'Accessible Savings',
          title: 'Flexible Budgeting & Growth',
          description:
            'Start your digital silver journey with modest sums, pause or add to your savings whenever you wish.',
        },
        {
          icon: Scale,
          badge: 'Pooja & Heirloom',
          title: 'Pooja Silverware & Coin Exchange',
          description:
            'Redeem your accumulated silver for traditional pooja lamps, silver vessels, jewellery, or fine bullion bars at our showroom counters.',
        },
      ];

  return (
    <ScrollReveal variant="fade-up">
      <section
        aria-label={sectionTitle}
        className="relative overflow-hidden rounded-3xl border-2 border-gold-400/50 bg-gradient-to-br from-[#FCFBF7] via-[#FAF6EE] to-[#F1EAD9] p-6 sm:p-10 lg:p-12 shadow-luxury"
      >
        {/* Subtle Ambient Decorative Gold Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gold-400/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-burgundy-900/5 blur-3xl"
        />

        {/* Premium Split Layout */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Side 1: Concise Editorial Content & 3 Highlight Badges (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-500/15 border border-gold-400/40 text-burgundy-950 text-xs font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-gold-700" />
                <span>Transparent &amp; Secure Precious Metal Savings</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-extrabold text-burgundy-950 tracking-tight leading-tight">
                {sectionTitle}
              </h2>

              <p className="text-xs sm:text-sm md:text-base text-stone-700 leading-relaxed font-light">
                {conciseIntro}
              </p>
            </div>

            {/* 3 Luxury Feature Blocks */}
            <div className="space-y-3.5 pt-1">
              {featurePoints.map((pt, idx) => {
                const IconComponent = pt.icon;
                return (
                  <div
                    key={idx}
                    className="group bg-white/90 backdrop-blur-xs rounded-2xl border border-gold-300/60 p-4 sm:p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:border-gold-500 hover:-translate-y-0.5 flex items-start gap-4"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-burgundy-900 to-burgundy-950 text-gold-300 flex items-center justify-center shrink-0 shadow-sm border border-gold-500/30">
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif text-sm sm:text-base font-bold text-burgundy-950">
                          {pt.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gold-400/15 text-burgundy-900 border border-gold-400/30">
                          {pt.badge}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed font-light">
                        {pt.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side 2: Luxury 3D Visual Showcase & Assurance Card (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="group relative rounded-2xl overflow-hidden border-2 border-gold-500/60 shadow-luxury-gold bg-burgundy-950 aspect-[4/3] sm:aspect-[16/11]">
              <img
                src={showcaseImage}
                alt={`Sri Ramas Digi${isGold ? 'Gold' : 'Silver'} 3D Showcase`}
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Gradient Scrim for Floating Pill Readability */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-burgundy-950/85 via-transparent to-black/25 pointer-events-none"
              />

              {/* Floating Top Badge */}
              <div className="absolute top-3.5 left-3.5 z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-burgundy-950/90 text-gold-200 text-[11px] font-bold uppercase tracking-wider border border-gold-400/40 shadow-md backdrop-blur-sm">
                  <Award className="w-3.5 h-3.5 text-gold-400" />
                  <span>{purityLabel}</span>
                </span>
              </div>

              {/* Floating Bottom Card */}
              <div className="absolute bottom-3.5 inset-x-3.5 z-10 bg-burgundy-950/90 backdrop-blur-md rounded-xl p-3 border border-gold-400/40 shadow-lg text-gold-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gold-300 block">
                    Showroom Counter Handover
                  </span>
                  <span className="text-xs font-serif font-bold text-white truncate block">
                    Convert anytime to certified ornaments &amp; bullion
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gold-400/20 border border-gold-400/50 flex items-center justify-center shrink-0 text-gold-300">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Heritage Trust Assurance Banner */}
            <div className="p-3.5 rounded-xl bg-white/80 border border-gold-300/60 text-center flex items-center justify-center gap-2 text-xs text-burgundy-950 font-medium">
              <Gem className="w-4 h-4 text-gold-600 shrink-0" />
              <span>
                Backed by 39+ Years of Trusted Sri Ramas Jewellery Heritage (Estd. 1987)
              </span>
            </div>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
};
