import React from 'react';
import { Link } from 'react-router-dom';
import { Award, ShieldCheck, Gem, Users, ArrowRight } from 'lucide-react';
import { useStoreWhatsApp } from '@/hooks/useStoreWhatsApp';
import {
  ScrollReveal,
  StaggerReveal,
  AnimatedHeading,
  AnimatedCTA,
} from '@/components/motion';

interface AnimatedCounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  durationMs?: number;
  formatThousands?: boolean;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  end,
  suffix = '',
  prefix = '',
  durationMs = 1000,
  formatThousands = false,
}) => {
  const [count, setCount] = React.useState(0);
  const ref = React.useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime: number | null = null;

          const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            // Fast easeOutCubic curve for punchy running numbers
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(ease * end);
            setCount(current);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(end);
            }
          };

          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [end, durationMs, hasAnimated]);

  const formattedValue = formatThousands
    ? count.toLocaleString('en-IN')
    : count.toString();

  return (
    <span ref={ref} className="font-serif font-extrabold text-2xl sm:text-3xl lg:text-4xl text-burgundy-900 block tabular-nums">
      {prefix}{formattedValue}{suffix}
    </span>
  );
};

export const AboutPage: React.FC = () => {
  const { buildWhatsAppUrl } = useStoreWhatsApp();

  return (
    <div className="w-full min-h-screen">
      {/* 1. Full-Viewport Luxury Heritage Hero Section (No Outer Card Container) */}
      <section className="relative w-full min-h-[calc(100vh-76px)] sm:min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden bg-[#1A0307] text-gold-100 py-16 sm:py-20 lg:py-24 border-b-2 border-gold-500/30">
        {/* Full-bleed Background Luxury Temple Jewellery Artwork */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <img
            src="/images/generated/heritage-hero-bg.jpg"
            alt="Sri Ramas Jewellery Royal Heritage & Artistry"
            className="w-full h-full object-cover object-center scale-[1.02]"
          />
          {/* Deep Burgundy & Royal Wine Contrast Vignette Scrim with softened opacity so background image is clearly visible */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(20, 2, 5, 0.45) 0%, rgba(36, 5, 11, 0.35) 50%, rgba(20, 2, 5, 0.65) 100%)',
            }}
          />
          {/* Subtle Radial Backing Scrim Centered on Hero Content */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#140205]/75 via-transparent to-[#140205]/40 pointer-events-none"
          />
          {/* Ambient Champagne Gold Glow in Top Center */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[48rem] h-[25rem] rounded-full bg-[#C49A3A]/20 blur-3xl"
          />
        </div>

        {/* Hero Content (No Enclosing Card Container) */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Eyebrow Badge: 3rd Generation Legacy without logo or sparkle */}
          <ScrollReveal variant="fade-up" immediate>
            <div className="inline-flex items-center px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-burgundy-950/80 border border-gold-400/50 shadow-luxury-gold backdrop-blur-md">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#FCE7B2]">
                NOW LED BY 3RD GENERATION &bull; ESTABLISHED IN 1987
              </span>
            </div>
          </ScrollReveal>

          {/* Main Heading in Luxury Serif */}
          <ScrollReveal variant="fade-up" delay={80}>
            <h1
              className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#FCE7B2] leading-tight tracking-wide"
              style={{
                textShadow:
                  '0 4px 20px rgba(0, 0, 0, 0.95), 0 2px 6px rgba(0, 0, 0, 0.85)',
              }}
            >
              A LEGACY OF ROYAL PURITY &amp; ARTISTRY
            </h1>
          </ScrollReveal>

          {/* Supporting Description */}
          <ScrollReveal variant="fade-up" delay={120}>
            <p
              className="text-sm sm:text-base lg:text-lg text-gold-100/90 font-light leading-relaxed max-w-2xl mx-auto"
              style={{
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.85)',
              }}
            >
              For over 39 years, Sri Ramas Jewellery has served as the custodian of auspicious family celebrations, weddings and milestone heirlooms.
            </p>
          </ScrollReveal>

          {/* Primary CTA Button */}
          <ScrollReveal variant="fade-up" delay={160}>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-brand-gold-gradient text-burgundy-950 text-xs sm:text-sm font-extrabold uppercase tracking-widest shadow-luxury-gold hover:opacity-95 hover:scale-[1.02] transition-all duration-300 border border-gold-300"
              >
                <span>EXPLORE OUR COLLECTIONS</span>
                <ArrowRight className="w-4 h-4 text-burgundy-950" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Main Heritage Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-16 lg:space-y-24">
        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <ScrollReveal variant="slide-left" distance={18} className="space-y-5">
            <AnimatedHeading
              align="left"
              kicker="Our Heritage Story"
              title="Crafting Sacred Heirlooms Since 1987"
              as="h2"
              showRule
              titleClassName="sm:text-4xl text-burgundy-950 font-extrabold"
            />
            <div className="text-sm sm:text-base text-stone-700 leading-relaxed space-y-4 font-normal">
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

            {/* Filigree Line Divider */}
            <svg
              aria-hidden="true"
              viewBox="0 0 240 12"
              className="w-48 h-3 text-gold-600/80"
              fill="none"
            >
              <path
                d="M2 6 H98 L110 2 L120 10 L130 2 L142 6 H238"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Heritage Metric Counters with fast running animation on scroll */}
            <StaggerReveal
              variant="scale"
              staggerMs={80}
              className="pt-4 grid grid-cols-3 gap-4 border-t border-gold-300/60"
            >
              <div>
                <AnimatedCounter end={39} suffix="+" durationMs={900} />
                <span className="text-xs text-stone-600 font-medium">Years of Heritage</span>
              </div>
              <div>
                <AnimatedCounter end={100} suffix="%" durationMs={1000} />
                <span className="text-xs text-stone-600 font-medium">BIS 916 HUID Hallmarked</span>
              </div>
              <div>
                <AnimatedCounter end={50000} suffix="+" formatThousands durationMs={1100} />
                <span className="text-xs text-stone-600 font-medium">Happy Families</span>
              </div>
            </StaggerReveal>
          </ScrollReveal>

          <ScrollReveal variant="slide-right" distance={18} delay={100} className="relative">
            <div className="group relative rounded-3xl overflow-hidden aspect-[4/3] border-2 border-gold-400/50 shadow-luxury-gold bg-burgundy-950">
              <img
                src="/images/generated/heritage-hero-bg.jpg"
                alt="Sri Ramas Authentic Heritage Craftsmanship"
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-burgundy-950/90 via-burgundy-950/30 to-transparent flex items-end p-6 sm:p-8">
                <p className="text-xs sm:text-sm font-serif text-[#FCE7B2] italic leading-relaxed">
                  "Purity in gold is not just a standard—it is our sacred family promise passed down through generations."
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Pillars of Trust */}
        <ScrollReveal variant="fade-up">
          <div className="bg-white rounded-3xl border-2 border-gold-400/40 p-8 sm:p-12 shadow-luxury space-y-8">
            <AnimatedHeading
              align="center"
              kicker="The Sri Ramas Guarantee"
              title="Our Four Pillars of Distinction"
              as="h2"
              showRule
              titleClassName="text-burgundy-950 font-extrabold"
            />

            <StaggerReveal
              staggerMs={70}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <div className="group p-6 rounded-2xl bg-[#FCFAF6] border border-gold-300/80 space-y-3 text-center transition-all duration-300 ease-out hover:-translate-y-1 hover:border-gold-500 hover:shadow-luxury">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-200 to-gold-300 text-burgundy-950 flex items-center justify-center mx-auto transition-transform duration-300 ease-out group-hover:scale-105 shadow-sm">
                  <ShieldCheck className="w-6 h-6 text-burgundy-900" />
                </div>
                <h3 className="font-serif font-bold text-base text-burgundy-950">
                  100% BIS HUID
                </h3>
                <p className="text-xs text-stone-600 font-normal leading-relaxed">
                  Complete traceability with government-certified laser engraved 6-character HUID on every gold ornament.
                </p>
              </div>

              <div className="group p-6 rounded-2xl bg-[#FCFAF6] border border-gold-300/80 space-y-3 text-center transition-all duration-300 ease-out hover:-translate-y-1 hover:border-gold-500 hover:shadow-luxury">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-200 to-gold-300 text-burgundy-950 flex items-center justify-center mx-auto transition-transform duration-300 ease-out group-hover:scale-105 shadow-sm">
                  <Gem className="w-6 h-6 text-burgundy-900" />
                </div>
                <h3 className="font-serif font-bold text-base text-burgundy-950">
                  Certified Diamonds
                </h3>
                <p className="text-xs text-stone-600 font-normal leading-relaxed">
                  Independently certified by IGI and SGL laboratories with detailed 4Cs cut, clarity, color, and carat grading.
                </p>
              </div>

              <div className="group p-6 rounded-2xl bg-[#FCFAF6] border border-gold-300/80 space-y-3 text-center transition-all duration-300 ease-out hover:-translate-y-1 hover:border-gold-500 hover:shadow-luxury">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-200 to-gold-300 text-burgundy-950 flex items-center justify-center mx-auto transition-transform duration-300 ease-out group-hover:scale-105 shadow-sm">
                  <Award className="w-6 h-6 text-burgundy-900" />
                </div>
                <h3 className="font-serif font-bold text-base text-burgundy-950">
                  Master Craftsmanship
                </h3>
                <p className="text-xs text-stone-600 font-normal leading-relaxed">
                  Created by generational hereditary karigars renowned for intricate temple, antique, and bridal works.
                </p>
              </div>

              <div className="group p-6 rounded-2xl bg-[#FCFAF6] border border-gold-300/80 space-y-3 text-center transition-all duration-300 ease-out hover:-translate-y-1 hover:border-gold-500 hover:shadow-luxury">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-200 to-gold-300 text-burgundy-950 flex items-center justify-center mx-auto transition-transform duration-300 ease-out group-hover:scale-105 shadow-sm">
                  <Users className="w-6 h-6 text-burgundy-900" />
                </div>
                <h3 className="font-serif font-bold text-base text-burgundy-950">
                  Showroom Hospitality
                </h3>
                <p className="text-xs text-stone-600 font-normal leading-relaxed">
                  Personalized consultations in private bridal lounges with zero pressure and complete transparent weighing.
                </p>
              </div>
            </StaggerReveal>
          </div>
        </ScrollReveal>

        {/* Showroom Bridal Appointment CTA */}
        <ScrollReveal variant="scale">
          <div className="bg-brand-maroon-gradient rounded-3xl p-8 sm:p-12 text-gold-100 flex flex-col sm:flex-row items-center justify-between gap-6 border-2 border-gold-500/40 shadow-luxury">
            <div className="space-y-2 text-center sm:text-left max-w-xl">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#FCE7B2]">
                Experience Our Bridal Lounge
              </h2>
              <p className="text-xs sm:text-sm text-gold-200/90 font-light leading-relaxed">
                Schedule a dedicated bridal appointment with our chief jewellery stylist at our showroom for personalized bridal consultation.
              </p>
            </div>
            <AnimatedCTA
              variant="gold"
              href={buildWhatsAppUrl({ type: 'SHOWROOM' })}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap shadow-luxury-gold"
            >
              Book Bridal Appointment on WhatsApp
            </AnimatedCTA>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};
