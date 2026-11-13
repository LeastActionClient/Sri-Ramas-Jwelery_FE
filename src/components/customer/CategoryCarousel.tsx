import React, { useRef, useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { Category } from '@/types';
import { CategoryCard } from './CategoryCard';
import { ScrollReveal } from '@/components/motion';

interface CategoryCarouselProps {
  categories: Category[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

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

  // Filter out any explicitly disabled categories
  const validCategories = categories.filter((c) => c.isActive !== false);
  const effectiveList = validCategories.length > 0 ? validCategories : categories;
  const totalItems = effectiveList.length;

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
    // Keep hasMovedRef for a tiny tick to prevent accidental navigation after drag
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 60);
  };

  // Prevent link navigation if the user was hand-scrolling / dragging
  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      aria-label="Explore Our Jewellery Categories"
      className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8"
    >
      {/* Clean, Minimal Luxury Heading */}
      <div className="text-center max-w-2xl mx-auto space-y-1">
        <span className="text-[10px] sm:text-[11px] font-serif uppercase tracking-[0.25em] text-[#A4792B] font-semibold block">
          Curated Showroom Collections
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#380711] tracking-wide">
          Shop By Category
        </h2>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-4 sm:gap-6 lg:gap-8 animate-pulse py-6">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="flex flex-col items-center gap-3">
              <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full bg-stone-100" />
              <div className="h-3 w-16 bg-stone-100 rounded" />
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
        <ScrollReveal variant="fade-up" distance={16}>
          {/* 
            Hand Scrolling UI (Smooth Drag & Touch):
            - Arrows removed completely.
            - Mouse click-and-drag hand scroll on desktop with grab cursor.
            - Native touch swipe with momentum on mobile/tablet.
            - Centered when fitting screen width; horizontally scrollable with tight, elegant spacing.
          */}
          <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onClickCapture={handleClickCapture}
            className={`w-full overflow-x-auto select-none touch-pan-x py-2 px-1 scroll-smooth ${
              isGrabbing ? 'cursor-grabbing' : 'cursor-grab'
            } [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}
            style={{
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div className="flex items-start gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-14 w-max min-w-full justify-center px-4 sm:px-6 md:px-8">
              {effectiveList.map((cat) => (
                <div key={cat._id} className="shrink-0 flex justify-center px-1 sm:px-2">
                  <CategoryCard category={cat} />
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
};
