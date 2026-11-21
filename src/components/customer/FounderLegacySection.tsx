import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { ScrollReveal } from '@/components/motion';

export const FounderLegacySection: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<'ta' | 'en'>('ta');

  const englishStory = {
    quote:
      'Since 1987, forever committed to purity in gold, honesty in pricing, and the trust of generations. Your Sri Ramas — the pride of good fortune.',
    founder: 'S. R. VASU',
    role: 'Founder',
    designation: 'The Legacy Behind Sri Ramas',
    heading: 'A Legacy Built on Pure Trust',
    caption: 'Master Crafted in Thanjavur Since 1987',
  };

  const tamilStory = {
    quote:
      '1987 முதல் என்றும் தங்கத்தில் தூய்மை, விலையில் நேர்மை, தலைமுறையின் நம்பிக்கை. கைராசியின் பேராசியான உங்கள் ஸ்ரீ ரமாஸ்.',
    founder: 'S. R. VASU',
    role: 'Founder',
    designation: 'The Legacy Behind Sri Ramas',
    heading: 'தலைமுறை கடந்த நம்பிக்கை',
    caption: '1987 முதல் என்றும் உங்கள் ஸ்ரீ ரமாஸ்',
  };

  const current = selectedLanguage === 'ta' ? tamilStory : englishStory;

  return (
    <section className="relative w-full bg-[#180306] text-gold-100 py-8 sm:py-10 lg:py-12 border-y-2 border-[#C49A3A]/40 overflow-hidden">
      {/* Decorative Warm Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#C49A3A]/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#570018]/40 blur-3xl"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Section Header with Language Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#C49A3A]/25 pb-4">
          <div className="text-center sm:text-left">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FAF7F0] via-[#FFE28A] to-[#F5DE9C]">
              {current.heading}
            </h2>
          </div>

          {/* Bilingual Language Switcher */}
          <div className="flex items-center gap-2 p-1.5 rounded-full bg-[#24050B] border border-[#C49A3A]/40 shadow-inner">
            <button
              type="button"
              onClick={() => setSelectedLanguage('ta')}
              aria-label="Switch to Tamil founder story"
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                selectedLanguage === 'ta'
                  ? 'bg-gradient-to-r from-[#C49A3A] to-[#E5C775] text-[#180306] shadow-md scale-[1.02]'
                  : 'text-gold-200/80 hover:text-white'
              }`}
            >
              தமிழ் (Tamil)
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage('en')}
              aria-label="Switch to English founder story"
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                selectedLanguage === 'en'
                  ? 'bg-gradient-to-r from-[#C49A3A] to-[#E5C775] text-[#180306] shadow-md scale-[1.02]'
                  : 'text-gold-200/80 hover:text-white'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Founder Banner Main Visual (Full-width section on mobile, preserved card on desktop) */}
        <ScrollReveal variant="fade-up" distance={20} className="w-full">
          <div className="group relative -mx-4 sm:mx-0 rounded-none sm:rounded-3xl overflow-hidden border-y sm:border-2 border-[#C49A3A]/60 shadow-none sm:shadow-[0_20px_50px_rgba(0,0,0,0.6)] bg-[#24050B]">
            {/* The Original Client-Supplied Banner */}
            <div className="w-full aspect-[16/9] sm:aspect-[24/9] md:aspect-[2.5/1] max-h-[520px] bg-[#24050B] flex items-center justify-center overflow-hidden">
              <img
                src="/images/founder-legacy-banner.jpg"
                alt="Sri Ramas Legacy in Gold - S. R. Vasu, Founder"
                className="w-full h-full object-contain sm:object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />
            </div>

            {/* Subtle Gradient Framing Scrim */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none border-y sm:border border-[#FFE28A]/20 rounded-none sm:rounded-3xl"
            />
          </div>
        </ScrollReveal>

        {/* Founder Story Tribute Card & Detailed Heritage Description */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
          {/* Quote Card (7 Cols) */}
          <ScrollReveal variant="slide-left" distance={16} className="lg:col-span-7">
            <div className="relative p-6 sm:p-8 lg:p-10 rounded-2xl bg-[#24050B]/90 border border-[#C49A3A]/40 shadow-xl space-y-5">
              <span className="text-4xl sm:text-5xl font-serif text-[#C49A3A]/40 leading-none select-none">
                “
              </span>

              <blockquote className="text-base sm:text-lg lg:text-xl font-serif italic text-[#FFE28A] leading-relaxed -mt-4">
                {current.quote}
              </blockquote>

              <div className="pt-4 border-t border-[#C49A3A]/25 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white tracking-wide">
                    {current.founder}
                  </h3>
                  <p className="text-xs text-[#C49A3A] font-medium tracking-wider uppercase">
                    {current.role} • {current.designation}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-gold-300/80">
                  <Sparkles className="w-4 h-4 text-[#C49A3A]" />
                  <span>{current.caption}</span>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Heritage Highlights & Call to Action (5 Cols) */}
          <ScrollReveal variant="slide-right" distance={16} className="lg:col-span-5 space-y-5">
            <div className="space-y-3.5 text-xs sm:text-sm text-gold-200/85 leading-relaxed">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#25D366] shrink-0 mt-0.5" />
                <p>
                  <strong className="text-white block font-semibold">100% Purity in Gold:</strong>
                  Every ornament is hallmarked under Bureau of Indian Standards (BIS) specifications with unique HUID verification.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#25D366] shrink-0 mt-0.5" />
                <p>
                  <strong className="text-white block font-semibold">Honesty in Pricing:</strong>
                  Transparent pricing, certified weighment precision, and fair wastage charges passed down through generations.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#25D366] shrink-0 mt-0.5" />
                <p>
                  <strong className="text-white block font-semibold">Generations of Trust:</strong>
                  Serving Thanjavur and South Indian families since 1987 with bridal heirlooms and savings plans.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#C49A3A] to-[#E5C775] text-[#180306] font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-md hover:shadow-lg transition-all"
              >
                <span>Read Full Heritage Story</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#C49A3A]/50 hover:border-[#FFE28A] text-[#FFE28A] hover:text-white text-xs font-semibold tracking-wider transition-all"
              >
                <span>Visit Showroom</span>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
