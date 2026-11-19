import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Category } from '@/types';
import { CategoryCard } from './CategoryCard';
import { ScrollReveal } from '@/components/motion';

interface CategoryCarouselProps {
  categories: Category[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

/**
 * Curated showroom default categories used as fallback to ensure the carousel
 * always has sufficient items to display the 50% peek card affordance and smooth scrolling.
 */
const CURATED_DEFAULT_CATEGORIES: Category[] = [
  {
    _id: 'cat-necklaces',
    name: 'Necklaces',
    slug: 'necklaces',
    imageUrl: '/images/categories/necklaces.jpg?v=2',
    isActive: true,
    sortOrder: 1,
    displayOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'cat-haram-long-chains',
    name: 'Haram & Long Chains',
    slug: 'haram-long-chains',
    imageUrl: '/images/categories/haram-long-chains.jpg?v=2',
    isActive: true,
    sortOrder: 2,
    displayOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'cat-earrings',
    name: 'Earrings',
    slug: 'earrings',
    imageUrl: '/images/categories/earrings.jpg?v=2',
    isActive: true,
    sortOrder: 3,
    displayOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'cat-bangles',
    name: 'Bangles',
    slug: 'bangles',
    imageUrl: '/images/categories/bangles.jpg?v=2',
    isActive: true,
    sortOrder: 4,
    displayOrder: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'cat-rings',
    name: 'Rings',
    slug: 'rings',
    imageUrl: '/images/categories/rings.jpg?v=2',
    isActive: true,
    sortOrder: 5,
    displayOrder: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'cat-thali-mangalsutra',
    name: 'Thali & Mangalsutra',
    slug: 'thali-mangalsutra',
    imageUrl: '/images/categories/thali-mangalsutra.jpg?v=2',
    isActive: true,
    sortOrder: 6,
    displayOrder: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'cat-antique-temple-jewellery',
    name: 'Antique Temple Jewellery',
    slug: 'antique-temple-jewellery',
    imageUrl: '/images/categories/gold-jewellery.jpg?v=2',
    isActive: true,
    sortOrder: 7,
    displayOrder: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  categories,
  isLoading = false,
  isError = false,
  onRetry,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Combine active categories from props or fallback to curated defaults if empty/short
  const effectiveList = useMemo(() => {
    const valid = (categories || []).filter((c) => c.isActive !== false && !c.parentCategory);
    if (valid.length >= 5) {
      return valid;
    }
    // If fewer than 5 items, supplement with curated defaults so peek affordance works reliably
    const existingSlugs = new Set(valid.map((c) => c.slug?.toLowerCase()));
    const missingDefaults = CURATED_DEFAULT_CATEGORIES.filter(
      (c) => !existingSlugs.has(c.slug.toLowerCase())
    );
    return [...valid, ...missingDefaults];
  }, [categories]);

  const totalItems = effectiveList.length;

  const checkScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    // Sub-pixel tolerant check
    setCanScrollRight(Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const measure = () => {
      setContainerWidth(el.clientWidth);
      checkScrollState();
    };

    measure();

    const ro = new ResizeObserver(() => {
      measure();
    });
    ro.observe(el);

    el.addEventListener('scroll', checkScrollState, { passive: true });
    window.addEventListener('resize', measure);

    const t = setTimeout(measure, 100);

    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', checkScrollState);
      window.removeEventListener('resize', measure);
      clearTimeout(t);
    };
  }, [checkScrollState, effectiveList.length]);

  /**
   * Responsive layout parameters tailored for uniform circular category cards:
   * - Extra Large Desktop (>= 1440px): 4.5 visible circular cards with 50% peek.
   * - Desktop (1280px - 1439px): 4.2 visible circular cards with 50% peek.
   * - Laptop (1024px - 1279px): 3.5 visible circular cards.
   * - Tablet (768px - 1023px): 2.8 visible circular cards.
   * - Large Mobile (480px - 767px): 2.2 visible circular cards.
   * - Small Mobile (< 480px): 1.6 visible circular cards.
   */
  const layout = useMemo(() => {
    const w = containerWidth || (typeof window !== 'undefined' ? window.innerWidth : 1200);
    if (w >= 1440) {
      return { itemsVisible: 4.5, gap: 28, paddingLeft: 64 };
    }
    if (w >= 1280) {
      return { itemsVisible: 4.2, gap: 24, paddingLeft: 48 };
    }
    if (w >= 1024) {
      return { itemsVisible: 3.5, gap: 24, paddingLeft: 40 };
    }
    if (w >= 768) {
      return { itemsVisible: 2.8, gap: 20, paddingLeft: 32 };
    }
    if (w >= 480) {
      return { itemsVisible: 2.3, gap: 16, paddingLeft: 20 };
    }
    return { itemsVisible: 1.8, gap: 12, paddingLeft: 16 };
  }, [containerWidth]);

  /**
   * Mathematical card width calculation ensuring the peek card lands cleanly
   * across the right viewport container boundary.
   */
  const computedCardWidth = useMemo(() => {
    const w = containerWidth || (typeof window !== 'undefined' ? window.innerWidth : 1200);
    const fullItems = Math.floor(layout.itemsVisible);
    const totalGaps = fullItems * layout.gap;
    const available = w - layout.paddingLeft - totalGaps;
    const width = Math.floor(available / layout.itemsVisible);
    return Math.max(140, width);
  }, [containerWidth, layout]);

  const scrollByDirection = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const step = computedCardWidth + layout.gap;
    const multiplier = layout.itemsVisible >= 3.5 ? 2 : 1;
    const scrollAmount = step * multiplier;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Hand-scrolling mouse drag handlers (desktop grab & scroll)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    isDownRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
    setIsGrabbing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDownRef.current || !scrollContainerRef.current) return;
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.3;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
    }
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDownRef.current = false;
    setIsGrabbing(false);
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 60);
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      aria-label="Explore Our Jewellery Categories"
      className="w-full space-y-6 sm:space-y-8 select-none"
    >
      {/* Clean, Minimal Luxury Heading */}
      <div className="text-center max-w-2xl mx-auto space-y-1 px-4">
        <span className="text-[10px] sm:text-[11px] font-serif uppercase tracking-[0.25em] text-[#A4792B] font-semibold block">
          Curated Showroom Collections
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#380711] tracking-wide">
          Shop By Category
        </h2>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-start gap-4 sm:gap-6 lg:gap-8 animate-pulse py-6 pl-4 sm:pl-8 lg:pl-12">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="flex flex-col items-center gap-3 shrink-0">
              <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-full bg-stone-100" />
              <div className="h-3 w-20 bg-stone-100 rounded" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center space-y-3">
          <p className="font-serif font-bold text-base text-[#380711]">
            Unable to load jewellery categories right now.
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#380711] text-[#FBE9C2] text-xs font-semibold hover:bg-[#520A19] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      ) : totalItems === 0 ? (
        <div className="p-10 text-center space-y-2">
          <Sparkles className="w-6 h-6 text-[#A4792B] mx-auto" />
          <p className="font-serif font-bold text-base text-[#380711]">
            No Published Categories Available
          </p>
        </div>
      ) : (
        <ScrollReveal variant="fade-up" distance={16} className="relative group/carousel w-full">
          {/* Left Navigation Chevron Button (Desktop / Tablet) */}
          <button
            type="button"
            onClick={() => scrollByDirection('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll categories left"
            className={`hidden sm:flex absolute left-2 sm:left-4 top-[40%] -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white text-[#380711] border-2 border-[#C49A3A] shadow-[0_8px_24px_rgba(56,7,17,0.22)] items-center justify-center transition-all duration-300 ${
              canScrollLeft
                ? 'opacity-100 hover:bg-[#380711] hover:text-[#FFE28A] hover:border-[#380711] hover:scale-110 active:scale-95 cursor-pointer'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Right Navigation Chevron Button (Desktop / Tablet) */}
          <button
            type="button"
            onClick={() => scrollByDirection('right')}
            disabled={!canScrollRight}
            aria-label="Scroll categories right"
            className={`hidden sm:flex absolute right-2 sm:right-4 top-[40%] -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white text-[#380711] border-2 border-[#C49A3A] shadow-[0_8px_24px_rgba(56,7,17,0.22)] items-center justify-center transition-all duration-300 ${
              canScrollRight
                ? 'opacity-100 hover:bg-[#380711] hover:text-[#FFE28A] hover:border-[#380711] hover:scale-110 active:scale-95 cursor-pointer'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronRight className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* 
            Horizontal Scrolling Track with Mathematically Precise 50% Peek Affordance:
            - Desktop: Exactly 4 full category cards + the 5th card sliced cleanly in half (~50% peek) at the right edge.
            - Tablet: 3 full cards + 4th card peeking at 50%.
            - Mobile: 2 full cards + 3rd card peeking at ~45-50%.
            - Small Mobile: 1 full card + 2nd card peeking at 50%.
            - Fluid mouse grab & scroll, native touch swipe, and chevron arrow navigation.
            - The card itself remains 100% whole, uncropped, and centered internally.
          */}
          <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onClickCapture={handleClickCapture}
            className={`w-full overflow-x-auto touch-pan-x py-3 scroll-smooth ${
              isGrabbing ? 'cursor-grabbing' : 'cursor-grab'
            } [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}
            style={{
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div
              className="flex items-start w-max"
              style={{
                gap: `${layout.gap}px`,
                paddingLeft: `${layout.paddingLeft}px`,
                paddingRight: `${layout.paddingLeft}px`,
              }}
            >
              {effectiveList.map((cat) => (
                <div
                  key={cat._id}
                  className="shrink-0 flex justify-center"
                  style={{
                    width: computedCardWidth ? `${computedCardWidth}px` : undefined,
                  }}
                >
                  <CategoryCard category={cat} />
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Subtle Swipe Affordance Cue */}
          <div className="flex sm:hidden items-center justify-center gap-1 pt-2 text-[11px] font-medium text-stone-400 select-none">
            <span>Swipe to explore more categories</span>
            <ChevronRight className="w-3.5 h-3.5 text-gold-600 animate-pulse" />
          </div>
        </ScrollReveal>
      )}
    </div>
  );
};
