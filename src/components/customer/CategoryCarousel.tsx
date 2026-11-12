import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, RefreshCw, Sparkles } from 'lucide-react';
import { Category } from '@/types';
import { CategoryCard } from './CategoryCard';
import { AnimatedCTA, AnimatedHeading, ScrollReveal } from '@/components/motion';

interface CategoryCarouselProps {
  categories: Category[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

function getVisibleCardsCount(width: number): number {
  if (width >= 1280) return 5;
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  return 2;
}

export const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  categories,
  isLoading = false,
  isError = false,
  onRetry,
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(() =>
    typeof window !== 'undefined' ? getVisibleCardsCount(window.innerWidth) : 5
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getVisibleCardsCount(window.innerWidth));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalItems = categories.length;
  const maxIndex = Math.max(0, totalItems - visibleCount);
  const safeIndex = Math.min(currentIndex, maxIndex);
  const totalStops = maxIndex + 1;

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, Math.min(prev, maxIndex) - 1));
  }, [maxIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(maxIndex, Math.min(prev, maxIndex) + 1));
  }, [maxIndex]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = endX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (Math.abs(deltaX) < 40) return;
    if (deltaX < 0) {
      handleNext();
    } else {
      handlePrev();
    }
  };

  const cardWidthPercent = 100 / Math.max(1, visibleCount);
  const translatePercent = safeIndex * cardWidthPercent;

  return (
    <section
      aria-label="Explore Our Jewellery Categories"
      className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8 py-8 sm:py-10 lg:py-12 space-y-6 sm:space-y-8"
    >
      {/* Top Heading & Aligned View All CTA */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DFC389]/50 pb-4">
        <AnimatedHeading
          kicker="Handcrafted Treasures"
          title="Explore Our Jewellery Categories"
          subtitle="From timeless traditions to contemporary elegance, discover collections crafted for every occasion."
          showRule
          titleClassName="text-2xl sm:text-3xl lg:text-[34px] font-extrabold uppercase tracking-wide text-[#450A13]"
          subtitleClassName="text-[#5C3D35] max-w-xl"
          kickerClassName="tracking-[0.26em] text-[#A4792B]"
        />

        <AnimatedCTA
          to="/categories"
          variant="outline"
          icon={<ArrowRight className="w-4 h-4 text-[#7A5216]" />}
          className="self-start sm:self-end shrink-0 px-6 py-2.5 rounded-full bg-gradient-to-b from-[#FCF4E2] to-[#F4E1BA] text-[#3B060E] font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md hover:from-[#FAF0D6] hover:to-[#EED7A5]"
        >
          <span>View All Categories</span>
        </AnimatedCTA>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-pulse">
          {[...Array(5)].map((_, idx) => (
            <div key={idx} className="rounded-xl overflow-hidden border border-[#DEC48C]/60 bg-[#FAF1DE]">
              <div className="aspect-square bg-[#E9D7B7]" />
              <div className="h-10 bg-[#F4E6CA]" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-[#FCF7EC] rounded-2xl border border-[#DEC48C] p-8 text-center space-y-3">
          <p className="font-serif font-bold text-base text-[#450A13]">
            Unable to load jewellery categories right now.
          </p>
          <p className="text-xs text-[#6B4A3E]">
            Please verify backend connectivity or try refreshing the categories showcase.
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#4D0F18] text-[#FBE9C2] text-xs font-semibold hover:bg-[#661622] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      ) : totalItems === 0 ? (
        <div className="bg-[#FCF7EC] rounded-2xl border border-[#DEC48C] p-10 text-center space-y-2">
          <Sparkles className="w-6 h-6 text-[#A4792B] mx-auto" />
          <p className="font-serif font-bold text-base text-[#450A13]">
            No Published Categories Available
          </p>
          <p className="text-xs text-[#6B4A3E]">
            Active jewellery categories added by the showroom team will appear here automatically.
          </p>
        </div>
      ) : (
        <ScrollReveal variant="fade-up" distance={18}>
          {/* Carousel Track + Side Controls */}
          <div className="relative flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={safeIndex <= 0}
              aria-label="Previous categories"
              className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 border border-[#C99B3B]/70 text-[#450A13] shadow-sm flex items-center justify-center shrink-0 transition-all duration-200 hover:bg-[#FAF0DC] hover:border-[#A87D24] hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div
              className="flex-1 min-w-0 overflow-hidden py-2 touch-pan-y"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
                style={{ transform: `translate3d(-${translatePercent}%, 0, 0)` }}
              >
                {categories.map((cat) => (
                  <div
                    key={cat._id}
                    className="shrink-0 px-1.5 sm:px-2.5"
                    style={{ width: `${cardWidthPercent}%` }}
                  >
                    <CategoryCard category={cat} />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={safeIndex >= maxIndex}
              aria-label="Next categories"
              className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 border border-[#C99B3B]/70 text-[#450A13] shadow-sm flex items-center justify-center shrink-0 transition-all duration-200 hover:bg-[#FAF0DC] hover:border-[#A87D24] hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Pagination Indicator Dots */}
          <div
            className="flex items-center justify-center gap-2 mt-4"
            role="tablist"
            aria-label="Category carousel pagination"
          >
            {[...Array(totalStops)].map((_, idx) => {
              const isActive = idx === safeIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Show category slide ${idx + 1} of ${totalStops}`}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                    isActive
                      ? 'w-5 bg-[#4D0F18] ring-2 ring-[#C99B3B]/35'
                      : 'w-2 bg-[#DFC389] hover:bg-[#C69C46]'
                  }`}
                />
              );
            })}
          </div>
        </ScrollReveal>
      )}
    </section>
  );
};
