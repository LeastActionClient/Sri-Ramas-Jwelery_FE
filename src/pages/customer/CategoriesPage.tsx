import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/services/api/categories.api';
import { CategoryCard } from '@/components/customer/CategoryCard';
import { ScrollReveal, StaggerReveal } from '@/components/motion';
import { RefreshCw, Sparkles } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const {
    data: categories = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <ScrollReveal variant="fade-up" immediate>
        <div className="bg-brand-maroon-gradient text-gold-100 rounded-2xl p-8 sm:p-12 border border-gold-500/40 shadow-luxury text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-semibold uppercase tracking-widest border border-gold-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Collections</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gold-100">
            Jewellery Categories
          </h1>
          <p className="text-xs sm:text-sm text-gold-200/80 max-w-xl mx-auto font-light leading-relaxed">
            Explore exquisite categories designed to crown every milestone. From auspicious bridal mangalsutras and kadas to everyday lightweight 916 gold.
          </p>
        </div>
      </ScrollReveal>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-[#DEC48C]/60 bg-[#FAF1DE]">
              <div className="aspect-square bg-[#E9D7B7]" />
              <div className="h-11 bg-[#F4E6CA]" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-[#FCF7EC] rounded-2xl border border-[#DEC48C] p-10 text-center space-y-3">
          <p className="font-serif font-bold text-lg text-[#450A13]">
            Unable to load jewellery categories.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#4D0F18] text-[#FBE9C2] text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-[#FCF7EC] rounded-2xl border border-[#DEC48C] p-12 text-center space-y-2">
          <Sparkles className="w-6 h-6 text-[#A4792B] mx-auto" />
          <p className="font-serif font-bold text-lg text-[#450A13]">
            No active categories found
          </p>
          <p className="text-xs text-[#6B4A3E]">
            Categories published from the Admin Dashboard will appear here automatically.
          </p>
        </div>
      ) : (
        <StaggerReveal
          staggerMs={65}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6"
        >
          {categories.map((category) => (
            <CategoryCard key={category._id} category={category} />
          ))}
        </StaggerReveal>
      )}
    </div>
  );
};
