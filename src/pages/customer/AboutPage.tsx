import React from 'react';
import { Award, ShieldCheck, Gem, Users, Sparkles } from 'lucide-react';
import { useStoreWhatsApp } from '@/hooks/useStoreWhatsApp';
import {
  ScrollReveal,
  StaggerReveal,
  AnimatedHeading,
  ImageReveal,
  AnimatedCTA,
} from '@/components/motion';

export const AboutPage: React.FC = () => {
  const { buildWhatsAppUrl } = useStoreWhatsApp();

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        {/* Banner with Official Logo */}
        <ScrollReveal variant="fade-up" immediate>
          <div className="bg-brand-maroon-gradient text-gold-100 rounded-3xl p-8 sm:p-16 border-2 border-gold-500/40 shadow-luxury text-center space-y-6 relative overflow-hidden">
            {/* Subtle Radial Crest Glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[36rem] h-[20rem] rounded-full bg-gold-500/10 blur-3xl"
            />
            <div className="relative z-10 space-y-4 max-w-3xl mx-auto">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-gold-400 p-1 mx-auto bg-burgundy-950 shadow-luxury-gold transition-transform duration-500 ease-luxury hover:scale-[1.03]">
                <img
                  src="/logo.jpg"
                  alt="Sri Ramas Jewellery Crest"
                  className="w-full h-full object-cover object-center rounded-full"
                />
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-400/20 text-gold-300 text-xs font-semibold uppercase tracking-widest border border-gold-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Established in 1987</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-gold-100 leading-tight">
                A Legacy of Royal Purity & Artistry
              </h1>

              <p className="text-xs sm:text-base text-gold-200/90 font-light leading-relaxed">
                For over 39 years, Sri Ramas Jewellery has served as the custodian of auspicious family celebrations, weddings, and milestone heirlooms across Tamil Nadu and beyond.
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <ScrollReveal variant="slide-left" distance={18} className="space-y-4">
            <AnimatedHeading
              align="left"
              kicker="Our Heritage Story"
              title="Crafting Sacred Heirlooms Since 1987"
              as="h2"
              showRule
              titleClassName="sm:text-4xl"
            />
            <div className="text-xs sm:text-sm text-stone-600 leading-relaxed space-y-3 font-light">
              <p>
                Founded in 1987 with a steadfast commitment to moral integrity, Sri Ramas Jewellery began as an artisan goldsmith atelier dedicated to honoring ancient South Indian jewellery crafting traditions.
              </p>
              <p>
                Every piece created under our hallmark is an ode to timeless temple architecture, divine motifs, and bridal grandeur. We combine hand-beaten gold techniques with modern microscopic diamond setting to bring you jewellery that endures for generations.
              </p>
              <p>
                Today, Sri Ramas Jewellery stands proud as a symbol of unimpeachable trust, offering 100% BIS Hallmarked 916 gold, certified natural diamonds, and pure silver articles.
              </p>
            </div>

            {/* Subtle SVG Filigree Line Draw */}
            <svg
              aria-hidden="true"
              viewBox="0 0 240 12"
              className="w-48 h-3 text-gold-500/80"
              fill="none"
            >
              <path
                d="M2 6 H98 L110 2 L120 10 L130 2 L142 6 H238"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="svg-line-draw"
              />
            </svg>

            <StaggerReveal
              variant="scale"
              staggerMs={80}
              className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-stone-200"
            >
              <div>
                <span className="font-serif font-extrabold text-2xl sm:text-3xl text-burgundy-900 block">39+</span>
                <span className="text-xs text-stone-500">Years of Heritage</span>
              </div>
              <div>
                <span className="font-serif font-extrabold text-2xl sm:text-3xl text-burgundy-900 block">100%</span>
                <span className="text-xs text-stone-500">BIS 916 HUID Hallmarked</span>
              </div>
              <div>
                <span className="font-serif font-extrabold text-2xl sm:text-3xl text-burgundy-900 block">50,000+</span>
                <span className="text-xs text-stone-500">Happy Families</span>
              </div>
            </StaggerReveal>
          </ScrollReveal>

          <ScrollReveal variant="slide-right" distance={18} delay={100} className="relative">
            <div className="group relative rounded-2xl overflow-hidden aspect-[4/3] border border-gold-400/40 shadow-luxury bg-burgundy-950">
              <ImageReveal
                src="/logo.jpg"
                alt="Sri Ramas Heritage Workshop"
                wrapperClassName="w-full h-full"
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-luxury group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-burgundy-950/85 via-transparent to-transparent flex items-end p-6">
                <p className="text-xs font-serif text-gold-200 italic">
                  "Purity in gold is not just a standard—it is our sacred family promise."
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Pillars of Trust */}
        <ScrollReveal variant="fade-up">
          <div className="bg-white rounded-2xl border border-gold-400/50 p-8 sm:p-12 shadow-sm space-y-8">
            <AnimatedHeading
              align="center"
              kicker="The Sri Ramas Guarantee"
              title="Our Four Pillars of Distinction"
              as="h2"
              showRule
            />

            <StaggerReveal
              staggerMs={70}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <div className="group p-5 rounded-xl bg-ivory-50 border border-gold-200 space-y-2 text-center transition-all duration-300 ease-luxury hover:-translate-y-1 hover:border-gold-400 hover:shadow-luxury">
                <div className="w-12 h-12 rounded-full bg-gold-200/60 text-burgundy-900 flex items-center justify-center mx-auto transition-transform duration-300 ease-luxury group-hover:scale-105">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-base text-burgundy-900">
                  100% BIS HUID
                </h3>
                <p className="text-xs text-stone-600 font-light">
                  Complete traceability with government-certified laser engraved 6-character HUID on every gold ornament.
                </p>
              </div>

              <div className="group p-5 rounded-xl bg-ivory-50 border border-gold-200 space-y-2 text-center transition-all duration-300 ease-luxury hover:-translate-y-1 hover:border-gold-400 hover:shadow-luxury">
                <div className="w-12 h-12 rounded-full bg-gold-200/60 text-burgundy-900 flex items-center justify-center mx-auto transition-transform duration-300 ease-luxury group-hover:scale-105">
                  <Gem className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-base text-burgundy-900">
                  Certified Diamonds
                </h3>
                <p className="text-xs text-stone-600 font-light">
                  Independently certified by IGI and SGL laboratories with detailed cut, clarity, and color documentation.
                </p>
              </div>

              <div className="group p-5 rounded-xl bg-ivory-50 border border-gold-200 space-y-2 text-center transition-all duration-300 ease-luxury hover:-translate-y-1 hover:border-gold-400 hover:shadow-luxury">
                <div className="w-12 h-12 rounded-full bg-gold-200/60 text-burgundy-900 flex items-center justify-center mx-auto transition-transform duration-300 ease-luxury group-hover:scale-105">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-base text-burgundy-900">
                  Master Craftsmanship
                </h3>
                <p className="text-xs text-stone-600 font-light">
                  Created by generational hereditary karigars renowned for intricate temple, antique, and bridal works.
                </p>
              </div>

              <div className="group p-5 rounded-xl bg-ivory-50 border border-gold-200 space-y-2 text-center transition-all duration-300 ease-luxury hover:-translate-y-1 hover:border-gold-400 hover:shadow-luxury">
                <div className="w-12 h-12 rounded-full bg-gold-200/60 text-burgundy-900 flex items-center justify-center mx-auto transition-transform duration-300 ease-luxury group-hover:scale-105">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-base text-burgundy-900">
                  Showroom Hospitality
                </h3>
                <p className="text-xs text-stone-600 font-light">
                  Personalized consultations in private bridal lounges with zero pressure and complete transparent weighing.
                </p>
              </div>
            </StaggerReveal>
          </div>
        </ScrollReveal>

        {/* CTA */}
        <ScrollReveal variant="scale">
          <div className="bg-brand-maroon-gradient rounded-2xl p-8 sm:p-12 text-gold-100 flex flex-col sm:flex-row items-center justify-between gap-6 border border-gold-500/40 shadow-luxury">
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="font-serif text-2xl font-bold text-gold-100">
                Experience Our Bridal Lounge
              </h2>
              <p className="text-xs sm:text-sm text-gold-200/80 font-light">
                Schedule a dedicated bridal appointment with our chief jewellery stylist at your nearest showroom.
              </p>
            </div>
            <AnimatedCTA
              variant="gold"
              href={buildWhatsAppUrl({ type: 'SHOWROOM' })}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full text-xs whitespace-nowrap"
            >
              Book Bridal Appointment on WhatsApp
            </AnimatedCTA>
          </div>
        </ScrollReveal>
      </div>
    </>
  );
};
