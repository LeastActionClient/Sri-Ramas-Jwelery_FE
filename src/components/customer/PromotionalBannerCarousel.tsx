import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { HeroBanner } from '@/types';

interface PromotionalBannerCarouselProps {
  banners: HeroBanner[];
  isLoading?: boolean;
  forceViewport?: 'desktop' | 'mobile';
  autoPlayMs?: number;
  className?: string;
}

export const PromotionalBannerCarousel: React.FC<PromotionalBannerCarouselProps> = ({
  banners,
  isLoading = false,
  forceViewport,
  autoPlayMs = 5500,
  className = 'w-full max-w-full relative overflow-hidden h-[56vh] min-h-[320px] sm:h-[calc(100vh-48px)] bg-[#140204] select-none m-0 p-0 group/carousel'
}) => {
  const navigate = useNavigate();
  const now = new Date().getTime();

  // Filter and sort active banners
  const activeBanners = useMemo(
    () =>
      [...(banners || [])]
        .filter((banner) => {
          if (banner.isActive === false) return false;
          const media = banner.mediaUrl || banner.desktopImageUrl || banner.imageUrl;
          if (!media) return false;
          if (banner.startDate) {
            const start = new Date(banner.startDate).getTime();
            if (!isNaN(start) && start > now) return false;
          }
          if (banner.endDate) {
            const end = new Date(banner.endDate).getTime();
            if (!isNaN(end) && end < now) return false;
          }
          return true;
        })
        .sort((a, b) => (a.displayOrder ?? a.sortOrder ?? 0) - (b.displayOrder ?? b.sortOrder ?? 0)),
    [banners, now]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const totalSlides = activeBanners.length;
  const safeIndex = totalSlides > 0 ? currentIndex % totalSlides : 0;

  // Auto-play timer with pause on hover/focus and prefers-reduced-motion check
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

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const handleBannerClick = (destination: string) => {
    const target = destination.trim() || '/products';
    if (/^https?:\/\//i.test(target)) {
      window.open(target, '_blank', 'noopener,noreferrer');
    } else {
      navigate(target);
    }
  };

  if (isLoading) {
    return (
      <section
        aria-label="Featured Promotions Loading"
        className="w-full h-[56vh] min-h-[320px] sm:h-[calc(100vh-48px)] bg-gradient-to-r from-[#2B0309] via-[#420510] to-[#2B0309] animate-pulse"
      />
    );
  }

  if (totalSlides === 0) {
    return null;
  }

  return (
    <section
      aria-label="Promotional Jewellery Collections"
      className={className}
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
      {/* Slide Track: Full Viewport Width & Height, 0 margins */}
      <div
        className="flex h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
        style={{ transform: `translateX(-${safeIndex * 100}%)` }}
      >
        {activeBanners.map((banner, idx) => {
          const desktopSrc = banner.mediaUrl || banner.desktopImageUrl || banner.imageUrl || '';
          const mobileSrc = banner.mobileImageUrl;
          const isVideo = banner.mediaType === 'VIDEO' || /\.(mp4|webm|mov)(\?.*)?$/i.test(desktopSrc);
          const altText = banner.imageAlt || banner.buttonName || banner.title || 'Sri Ramas Jewellery Promotional Banner';
          const ctaLink = banner.navigationDestination || banner.ctaLink || banner.targetLink || '/products';
          const ctaText = banner.buttonName || banner.ctaText || 'Explore Collection';
          const isForcedMobile = forceViewport === 'mobile';
          const resolvedSrc = isForcedMobile && mobileSrc ? mobileSrc : desktopSrc;

          return (
            <div
              key={banner._id || `banner-${idx}`}
              onClick={() => handleBannerClick(ctaLink)}
              className="w-full h-full shrink-0 relative flex items-center justify-center cursor-pointer overflow-hidden group/slide"
              aria-hidden={idx !== safeIndex}
              role="group"
              aria-roledescription="slide"
              aria-label={`${idx + 1} of ${totalSlides}: ${altText}`}
            >
              {/* Media fills 100% of the Banner Section Edge-to-Edge */}
              {isVideo ? (
                <video
                  src={resolvedSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover object-center pointer-events-none"
                />
              ) : (
                <img
                  src={resolvedSrc}
                  alt={altText}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  className="w-full h-full object-cover object-center pointer-events-none transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/slide:scale-[1.01]"
                />
              )}

              {/* Single Admin-Configured CTA Button: Centered above pagination on mobile, anchored bottom-right on desktop */}
              {ctaText && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-10 md:right-14 bottom-12 sm:bottom-10 z-20 pointer-events-auto max-w-[92vw]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => handleBannerClick(ctaLink)}
                    aria-label={`${ctaText} — ${altText}`}
                    className="group/btn inline-flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-9 md:px-11 py-2 sm:py-4 md:py-4.5 rounded-full font-serif font-bold sm:font-extrabold text-xs sm:text-base md:text-lg tracking-wider sm:tracking-widest uppercase bg-brand-maroon-gradient text-gold-100 border sm:border-2 border-gold-400 hover:border-gold-300 hover:text-white shadow-[0_4px_20px_rgba(0,0,0,0.7)] hover:shadow-[0_0_36px_rgba(212,175,55,0.65)] hover:scale-[1.04] transition-all duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 cursor-pointer whitespace-nowrap"
                  >
                    <span>{ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 md:w-5.5 md:h-5.5 text-gold-300 group-hover/btn:text-gold-200 group-hover/btn:translate-x-1.5 transition-transform shrink-0" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Manual Arrow Navigation Buttons (Vertically Centered - Won't collide with Bottom CTA or Pagination) */}
      {totalSlides > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous promotional banner"
            className="absolute left-2.5 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-[#1e0205]/85 hover:bg-[#3d050d] border border-[#E6C56F]/65 text-[#F6DA8D] flex items-center justify-center backdrop-blur-sm shadow-xl opacity-90 sm:opacity-0 sm:group-hover/carousel:opacity-100 focus-visible:opacity-100 transition-all duration-300"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next promotional banner"
            className="absolute right-2.5 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-[#1e0205]/85 hover:bg-[#3d050d] border border-[#E6C56F]/65 text-[#F6DA8D] flex items-center justify-center backdrop-blur-sm shadow-xl opacity-90 sm:opacity-0 sm:group-hover/carousel:opacity-100 focus-visible:opacity-100 transition-all duration-300"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          {/* Centered Pagination Pill Indicators: Anchored cleanly at bottom-3 on mobile, bottom-4 on desktop */}
          <div
            className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#180205]/85 border border-[#C69B3D]/50 backdrop-blur-sm shadow-lg transition-all duration-300"
            role="tablist"
            aria-label="Promotional banner pagination"
          >
            {activeBanners.map((b, idx) => {
              const isActiveSlide = idx === safeIndex;
              return (
                <button
                  key={b._id || `indicator-${idx}`}
                  type="button"
                  role="tab"
                  aria-selected={isActiveSlide}
                  aria-label={`View banner ${idx + 1}: ${b.buttonName || b.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    isActiveSlide
                      ? 'w-8 bg-gradient-to-r from-[#E6C56F] via-[#F7DF9C] to-[#C69B3D]'
                      : 'w-2.5 bg-[#F5DCA0]/40 hover:bg-[#F5DCA0]/80'
                  }`}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};
