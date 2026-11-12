import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Category } from '@/types';
import { ImageReveal } from '@/components/motion';

interface CategoryCardProps {
  category: Category;
  previewOnly?: boolean;
  className?: string;
}

/**
 * Renders a delicate antique-gold outline icon matching the category motif.
 */
const CategoryMotifIcon: React.FC<{ slug?: string; name?: string }> = ({ slug = '', name = '' }) => {
  const key = `${slug} ${name}`.toLowerCase();
  const commonProps = {
    className: 'w-4 h-4 text-[#A87D24] shrink-0',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (key.includes('haram') || key.includes('long chain')) {
    return (
      <svg {...commonProps} aria-hidden="true">
        <path d="M6 3c0 7 2.5 14 6 16.5C15.5 17 18 10 18 3" />
        <path d="M8.5 5c0 5 1.8 10 3.5 11.5C13.7 15 15.5 10 15.5 5" />
        <circle cx="12" cy="19.5" r="1.75" />
      </svg>
    );
  }

  if (key.includes('thali') || key.includes('mangalsutra')) {
    return (
      <svg {...commonProps} aria-hidden="true">
        <path d="M5 4c0 6.5 3.1 12.5 7 14.5C15.9 16.5 19 10.5 19 4" />
        <circle cx="12" cy="19" r="2.2" />
        <circle cx="9.2" cy="16.5" r="0.8" fill="currentColor" stroke="none" />
        <circle cx="14.8" cy="16.5" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (key.includes('necklace') || key.includes('choker')) {
    return (
      <svg {...commonProps} aria-hidden="true">
        <path d="M5 5c1 6.5 3.8 11 7 11s6-4.5 7-11" />
        <path d="M12 16v3" />
        <polygon points="12,22 10.2,19.5 12,17.8 13.8,19.5" />
      </svg>
    );
  }

  if (key.includes('earring') || key.includes('jhumka')) {
    return (
      <svg {...commonProps} aria-hidden="true">
        <circle cx="8" cy="6.5" r="1.5" />
        <path d="M5.8 12.5c0-2 1-3.5 2.2-3.5s2.2 1.5 2.2 3.5H5.8Z" />
        <circle cx="16" cy="6.5" r="1.5" />
        <path d="M13.8 12.5c0-2 1-3.5 2.2-3.5s2.2 1.5 2.2 3.5h-4.4Z" />
        <path d="M6.5 14.5v1M8 14.5v1.3M9.5 14.5v1M14.5 14.5v1M16 14.5v1.3M17.5 14.5v1" />
      </svg>
    );
  }

  if (key.includes('bangle') || key.includes('kada') || key.includes('bracelet')) {
    return (
      <svg {...commonProps} aria-hidden="true">
        <ellipse cx="10.5" cy="12.5" rx="6" ry="5" />
        <ellipse cx="13.5" cy="11.5" rx="6" ry="5" />
      </svg>
    );
  }

  if (key.includes('ring')) {
    return (
      <svg {...commonProps} aria-hidden="true">
        <circle cx="12" cy="14" r="5.5" />
        <polygon points="12,3.5 9.5,6.5 12,9.2 14.5,6.5" />
      </svg>
    );
  }

  return <Sparkles className="w-3.5 h-3.5 text-[#A87D24] shrink-0" aria-hidden="true" />;
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  previewOnly = false,
  className = '',
}) => {
  const cardContent = (
    <div
      className={`group rounded-2xl overflow-hidden bg-[#FAF1DE] border border-[#D3AE59]/85 hover:border-[#E2BC5A] shadow-sm hover:shadow-[0_14px_34px_-10px_rgba(69,10,19,0.34)] transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 flex flex-col ${className}`}
    >
      {/* Tall Luxury Burgundy Jewellery Frame */}
      <div className="relative aspect-[4/5] bg-[#3A060E] overflow-hidden border-b border-[#D3AE59]/65 group-hover:border-[#E2BC5A]/80 transition-colors duration-[400ms]">
        {category.imageUrl ? (
          <ImageReveal
            src={category.imageUrl}
            alt={category.name}
            loading="lazy"
            className="w-full h-full object-cover object-center transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] group-hover:brightness-[1.06]"
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = '/logo.jpg';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gold-300/75 p-4 text-center">
            <CategoryMotifIcon slug={category.slug} name={category.name} />
            <span className="text-[11px] font-sans text-gold-200/80">Image Pending</span>
          </div>
        )}
        {/* Warm rim illumination on hover */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#240308]/35 via-transparent to-[#F6DA8D]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-[400ms]"
        />
      </div>

      {/* Warm Ivory Label Bar */}
      <div className="bg-gradient-to-b from-[#FDF8ED] to-[#F5E6C8] group-hover:from-[#FFFBF2] group-hover:to-[#F2DFB8] transition-colors duration-[400ms] px-2.5 py-3.5 sm:py-4 flex items-center justify-center gap-1.5 min-h-[56px] sm:min-h-[62px]">
        <CategoryMotifIcon slug={category.slug} name={category.name} />
        <h3 className="font-sans font-semibold text-xs sm:text-[13.5px] text-[#3B060E] group-hover:text-[#7E112A] transition-colors duration-300 leading-tight text-center">
          {category.name}
        </h3>
        {!previewOnly && (
          <ArrowRight
            aria-hidden="true"
            className="w-3.5 h-3.5 text-[#9A7220] shrink-0 opacity-75 md:opacity-55 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
          />
        )}
      </div>
    </div>
  );

  if (previewOnly) {
    return cardContent;
  }

  return (
    <Link
      to={`/products?categoryId=${category._id}`}
      className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory-50"
    >
      {cardContent}
    </Link>
  );
};
