import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BannerButtonStyle,
  BannerHeightOption,
  BannerTextAlignment,
  BannerTextColor,
  BannerTextPosition,
  HeroBanner
} from '@/types';
import { ScrollReveal } from '@/components/motion';

interface PromotionalBannerCarouselProps {
  banners: HeroBanner[];
  isLoading?: boolean;
  forceViewport?: 'desktop' | 'mobile';
  autoPlayMs?: number;
}

const ALIGNMENT_CONFIG: Record<
  BannerTextAlignment,
  {
    horizontalAlign: string;
    contentBox: string;
    scrimDirection: string;
    ruleAlign: string;
  }
> = {
  left: {
    horizontalAlign: 'items-start text-left',
    contentBox: 'mr-auto sm:max-w-[54%] lg:max-w-[48%]',
    scrimDirection: 'to right',
    ruleAlign: 'mr-auto'
  },
  center: {
    horizontalAlign: 'items-center text-center',
    contentBox: 'mx-auto sm:max-w-[66%] lg:max-w-[58%]',
    scrimDirection: 'to top',
    ruleAlign: 'mx-auto'
  },
  right: {
    horizontalAlign: 'items-end text-right',
    contentBox: 'ml-auto sm:max-w-[54%] lg:max-w-[46%]',
    scrimDirection: 'to left',
    ruleAlign: 'ml-auto'
  }
};

const VERTICAL_POSITION_CLASS: Record<BannerTextPosition, string> = {
  top: 'justify-start',
  center: 'justify-center',
  bottom: 'justify-end'
};

const DESKTOP_HEIGHT_CLASS: Record<BannerHeightOption, string> = {
  compact: 'aspect-[3.5/1] min-h-[220px] max-h-[340px]',
  standard: 'aspect-[3/1] min-h-[260px] max-h-[430px]',
  tall: 'aspect-[2.45/1] min-h-[300px] max-h-[520px]'
};

const TEXT_COLOR_CLASSES: Record<
  BannerTextColor,
  {
    eyebrow: string;
    heading: string;
    highlight: string;
    subtitle: string;
    description: string;
    mobileCardBg: string;
  }
> = {
  'cream-gold': {
    eyebrow: 'text-[#F5E1B0]',
    heading: 'text-[#FFF4D6]',
    highlight:
      'bg-gradient-to-r from-[#E6C56F] via-[#FFF0B8] to-[#C89B3C] bg-clip-text text-transparent italic',
    subtitle: 'text-[#EED8A6]',
    description: 'text-[#EAD7B1]/90',
    mobileCardBg: 'bg-gradient-to-b from-[#2B0309] via-[#3A0610] to-[#230207]'
  },
  'pure-white': {
    eyebrow: 'text-amber-200',
    heading: 'text-white',
    highlight:
      'bg-gradient-to-r from-[#F5DF98] via-[#FFFFFF] to-[#E6C56F] bg-clip-text text-transparent italic',
    subtitle: 'text-stone-100',
    description: 'text-stone-200/90',
    mobileCardBg: 'bg-gradient-to-b from-[#260308] via-[#35050E] to-[#1D0206]'
  },
  'burgundy-dark': {
    eyebrow: 'text-burgundy-800',
    heading: 'text-burgundy-950',
    highlight: 'text-amber-700 italic',
    subtitle: 'text-burgundy-900',
    description: 'text-stone-700',
    mobileCardBg: 'bg-gradient-to-b from-[#FAF5EA] to-[#F2E6CC]'
  }
};

const BUTTON_STYLE_CLASSES: Record<BannerButtonStyle, string> = {
  'gold-outline':
    'border border-[#D4AF37] bg-[#2B040B]/70 text-[#F9E4A6] hover:bg-[#D4AF37] hover:text-burgundy-950 shadow-[0_0_22px_rgba(212,175,55,0.22)]',
  'gold-solid':
    'bg-brand-gold-gradient text-burgundy-950 border border-[#E6C56F] hover:brightness-105 shadow-lg',
  'burgundy-gold':
    'bg-brand-maroon-gradient text-[#F9E4A6] border border-[#D4AF37]/75 hover:border-[#FFF0B8] shadow-lg'
};

function renderSmartCtaLink(
  destination: string,
  className: string,
  ariaLabel: string,
  children: React.ReactNode
) {
  const target = destination.trim() || '/products';
  const isExternal = /^https?:\/\//i.test(target);

  if (isExternal) {
    return (
      <a
        href={target}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={target} aria-label={ariaLabel} className={className}>
      {children}
    </Link>
  );
}

function renderHighlightedTitle(
  title: string,
  highlightedText: string | undefined,
  highlightClass: string
): React.ReactNode {
  const cleanHighlight = highlightedText?.trim();
  if (!cleanHighlight) {
    return title;
  }

  const lowerTitle = title.toLowerCase();
  const lowerTarget = cleanHighlight.toLowerCase();
  const matchIdx = lowerTitle.indexOf(lowerTarget);

  if (matchIdx === -1) {
    return (
      <>
        <span>{title} </span>
        <span className={highlightClass}>{cleanHighlight}</span>
      </>
    );
  }

  const before = title.slice(0, matchIdx);
  const matched = title.slice(matchIdx, matchIdx + cleanHighlight.length);
  const after = title.slice(matchIdx + cleanHighlight.length);

  return (
    <>
      {before}
      <span className={highlightClass}>{matched}</span>
      {after}
    </>
  );
}

function buildDirectionalScrimStyle(
  alignment: BannerTextAlignment,
  textColor: BannerTextColor,
  overlayOpacity: number
): React.CSSProperties {
  const ratio = Math.min(0.9, Math.max(0, overlayOpacity / 100));
  if (ratio <= 0) {
    return { opacity: 0 };
  }

  const isLightTheme = textColor === 'burgundy-dark';
  const rgb = isLightTheme ? '250, 245, 234' : '32, 3, 9';

  if (alignment === 'center') {
    return {
      background: `radial-gradient(circle at center, rgba(${rgb}, ${ratio.toFixed(
        2
      )}) 0%, rgba(${rgb}, ${(ratio * 0.55).toFixed(2)}) 58%, rgba(${rgb}, 0.08) 100%)`
    };
  }

  const dir = ALIGNMENT_CONFIG[alignment].scrimDirection;
  return {
    background: `linear-gradient(${dir}, rgba(${rgb}, ${ratio.toFixed(2)}) 0%, rgba(${rgb}, ${(
      ratio * 0.65
    ).toFixed(2)}) 44%, rgba(${rgb}, 0) 72%)`
  };
}

export const PromotionalBannerCarousel: React.FC<PromotionalBannerCarouselProps> = ({
  banners,
  isLoading = false,
  forceViewport,
  autoPlayMs = 5500
}) => {
  const activeBanners = useMemo(
    () =>
      [...(banners || [])]
        .filter((banner) => banner.isActive !== false && Boolean(banner.desktopImageUrl || banner.imageUrl))
        .sort((a, b) => (a.displayOrder ?? a.sortOrder ?? 0) - (b.displayOrder ?? b.sortOrder ?? 0)),
    [banners]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const totalSlides = activeBanners.length;
  const safeIndex = totalSlides > 0 ? currentIndex % totalSlides : 0;

  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, autoPlayMs);

    return () => window.clearInterval(timer);
  }, [totalSlides, isPaused, autoPlayMs]);

  const handlePrev = () => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNext = () => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Featured Promotions Loading">
        <div className="w-full aspect-[3/1] rounded-2xl bg-gradient-to-r from-[#380610] via-[#4D0B18] to-[#380610] border border-[#C69B3D]/40 animate-pulse" />
      </section>
    );
  }

  if (totalSlides === 0) {
    return null;
  }

  const isForcedMobile = forceViewport === 'mobile';
  const isForcedDesktop = forceViewport === 'desktop';

  return (
    <ScrollReveal variant="fade-up" distance={16}>
      <section
        aria-label="Promotional Jewellery Collections"
        className={isForcedMobile ? 'w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}
      >
        <div
          className="relative group/carousel rounded-2xl overflow-hidden border border-[#C69B3D]/60 shadow-[0_18px_45px_-15px_rgba(45,4,12,0.45)] bg-[#260308]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
            const delta = touchStartX.current - endX;
            touchStartX.current = null;
            if (Math.abs(delta) >= 40) {
              if (delta > 0) handleNext();
              else handlePrev();
            }
          }}
        >
          {/* Slide Track */}
          <div
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
            style={{ transform: `translateX(-${safeIndex * 100}%)` }}
          >
            {activeBanners.map((banner, idx) => {
              const desktopSrc = banner.desktopImageUrl || banner.imageUrl;
              const mobileSrc = banner.mobileImageUrl;
              const altText = banner.imageAlt || banner.title || 'Sri Ramas Promotional Collection';
              const ctaLink = banner.ctaLink || banner.targetLink || '/products';
              const ctaText = banner.ctaText || 'Explore Collection';
              const isLayered = banner.contentMode !== 'image';

              const textAlignment: BannerTextAlignment = banner.textAlignment || 'right';
              const textPosition: BannerTextPosition = banner.textPosition || 'center';
              const textColor: BannerTextColor = banner.textColor || 'cream-gold';
              const buttonStyle: BannerButtonStyle = banner.buttonStyle || 'gold-outline';
              const bannerHeight: BannerHeightOption = banner.bannerHeight || 'standard';
              const overlayOpacity =
                typeof banner.overlayOpacity === 'number' ? banner.overlayOpacity : 35;

              const alignmentCfg = ALIGNMENT_CONFIG[textAlignment];
              const colorCfg = TEXT_COLOR_CLASSES[textColor];
              const buttonClass = BUTTON_STYLE_CLASSES[buttonStyle];
              const verticalClass = VERTICAL_POSITION_CLASS[textPosition];
              const desktopHeightClass = DESKTOP_HEIGHT_CLASS[bannerHeight];
              const scrimStyle = buildDirectionalScrimStyle(
                textAlignment,
                textColor,
                overlayOpacity
              );

              if (!isLayered) {
                const resolvedSrc = isForcedMobile && mobileSrc ? mobileSrc : desktopSrc;
                return (
                  <div
                    key={banner._id || `${banner.title}-${idx}`}
                    className="w-full shrink-0 relative group/banner"
                    aria-hidden={idx !== safeIndex}
                  >
                    <div className="relative w-full aspect-[3/1] bg-[#29030A] overflow-hidden">
                      {renderSmartCtaLink(
                        ctaLink,
                        'block w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400',
                        `${banner.title} — ${ctaText}`,
                        mobileSrc && !isForcedDesktop && !isForcedMobile ? (
                          <picture>
                            <source media="(max-width: 639px)" srcSet={mobileSrc} />
                            <img
                              src={desktopSrc}
                              alt={altText}
                              className="w-full h-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/banner:scale-[1.015]"
                            />
                          </picture>
                        ) : (
                          <img
                            src={resolvedSrc}
                            alt={altText}
                            className="w-full h-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/banner:scale-[1.015]"
                          />
                        )
                      )}
                    </div>
                  </div>
                );
              }

              // Layered HTML CMS Content Block (Shared across Desktop overlay & Mobile responsive stack)
              const renderTypographyBlock = (mobileLayout: boolean) => (
                <div
                  className={
                    mobileLayout
                      ? 'space-y-2 text-center'
                      : `space-y-2.5 lg:space-y-3 ${alignmentCfg.contentBox} ${alignmentCfg.horizontalAlign}`
                  }
                >
                  {banner.smallHeading && (
                    <p
                      className={`text-[10px] sm:text-xs font-semibold uppercase tracking-[0.26em] ${colorCfg.eyebrow}`}
                    >
                      {banner.smallHeading}
                    </p>
                  )}

                  <h2
                    className={`font-serif font-bold tracking-tight leading-[1.1] drop-shadow-sm ${colorCfg.heading} ${
                      mobileLayout
                        ? 'text-2xl'
                        : 'text-xl sm:text-2xl md:text-3xl lg:text-[2.35rem]'
                    }`}
                  >
                    {renderHighlightedTitle(
                      banner.title,
                      banner.highlightedText,
                      colorCfg.highlight
                    )}
                  </h2>

                  <div
                    aria-hidden="true"
                    className={`h-px w-20 bg-gradient-to-r from-[#D4AF37]/85 via-[#F7DF9C] to-[#D4AF37]/30 ${
                      mobileLayout ? 'mx-auto' : alignmentCfg.ruleAlign
                    }`}
                  />

                  {banner.subtitle && (
                    <p
                      className={`uppercase tracking-[0.18em] font-medium ${colorCfg.subtitle} ${
                        mobileLayout ? 'text-[11px]' : 'text-[10px] sm:text-xs'
                      }`}
                    >
                      {banner.subtitle}
                    </p>
                  )}

                  {banner.description && (
                    <p
                      className={`leading-relaxed line-clamp-2 ${colorCfg.description} ${
                        mobileLayout ? 'text-xs max-w-sm mx-auto' : 'text-xs sm:text-[13px]'
                      }`}
                    >
                      {banner.description}
                    </p>
                  )}

                  {ctaText && (
                    <div className="pt-1.5">
                      {renderSmartCtaLink(
                        ctaLink,
                        `inline-flex items-center gap-2 px-5 py-2 sm:py-2.5 rounded-full font-semibold text-xs uppercase tracking-[0.14em] transition-all duration-300 ${buttonClass}`,
                        `${ctaText} — ${banner.title}`,
                        <>
                          <span>{ctaText}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </div>
                  )}
                </div>
              );

              const desktopImgClass =
                'w-full h-full object-cover object-left sm:object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/banner:scale-[1.02]';

              return (
                <div
                  key={banner._id || `${banner.title}-${idx}`}
                  className="w-full shrink-0 relative group/banner"
                  aria-hidden={idx !== safeIndex}
                >
                  {/* Desktop / Tablet Layered Wide Banner */}
                  {!isForcedMobile && (
                    <div
                      className={`${
                        isForcedDesktop ? 'block' : 'hidden sm:block'
                      } relative w-full ${desktopHeightClass} overflow-hidden bg-[#260308]`}
                    >
                      <img src={desktopSrc} alt={altText} className={desktopImgClass} />

                      {/* Subtle localized contrast gradient strictly behind text area */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={scrimStyle}
                        aria-hidden="true"
                      />

                      <div
                        className={`absolute inset-0 z-10 flex flex-col px-8 md:px-12 lg:px-16 py-6 lg:py-8 ${alignmentCfg.horizontalAlign} ${verticalClass}`}
                      >
                        {renderTypographyBlock(false)}
                      </div>
                    </div>
                  )}

                  {/* Mobile Responsive Layout: Uncropped Jewellery Photo + Clean Stacked Velvet Typography (No Overlap) */}
                  {!isForcedDesktop && (
                    <div className={isForcedMobile ? 'flex flex-col' : 'flex sm:hidden flex-col'}>
                      <div className="relative w-full aspect-[16/9] bg-[#260308] overflow-hidden">
                        <img
                          src={mobileSrc || desktopSrc}
                          alt={altText}
                          className="w-full h-full object-cover object-left transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/banner:scale-[1.02]"
                        />
                        <div
                          className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#2B0309] to-transparent pointer-events-none"
                          aria-hidden="true"
                        />
                      </div>

                      <div
                        className={`px-5 pt-4 ${
                          totalSlides > 1 ? 'pb-11' : 'pb-6'
                        } ${colorCfg.mobileCardBg} border-t border-[#C69B3D]/25`}
                      >
                        {renderTypographyBlock(true)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Manual Arrow Navigation */}
          {totalSlides > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous promotional banner"
                className="absolute left-2 sm:left-3 top-[28%] sm:top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#240207]/75 hover:bg-[#450A13] border border-[#E6C56F]/55 text-[#F6DA8D] flex items-center justify-center backdrop-blur-sm shadow-lg opacity-90 sm:opacity-0 sm:group-hover/carousel:opacity-100 focus-visible:opacity-100 transition-all duration-300"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next promotional banner"
                className="absolute right-2 sm:right-3 top-[28%] sm:top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#240207]/75 hover:bg-[#450A13] border border-[#E6C56F]/55 text-[#F6DA8D] flex items-center justify-center backdrop-blur-sm shadow-lg opacity-90 sm:opacity-0 sm:group-hover/carousel:opacity-100 focus-visible:opacity-100 transition-all duration-300"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Pagination Pill Indicators */}
              <div
                className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-[#210207]/75 border border-[#C69B3D]/40 backdrop-blur-sm transition-all duration-300"
                role="tablist"
                aria-label="Promotional banner pagination"
              >
                {activeBanners.map((b, idx) => {
                  const isActiveSlide = idx === safeIndex;
                  return (
                    <button
                      key={b._id || idx}
                      type="button"
                      role="tab"
                      aria-selected={isActiveSlide}
                      aria-label={`View banner ${idx + 1}: ${b.title}`}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isActiveSlide
                          ? 'w-7 bg-gradient-to-r from-[#E6C56F] via-[#F7DF9C] to-[#C69B3D]'
                          : 'w-2 bg-[#F5DCA0]/45 hover:bg-[#F5DCA0]/85'
                      }`}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </ScrollReveal>
  );
};
