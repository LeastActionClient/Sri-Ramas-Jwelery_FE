import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
  previewOnly?: boolean;
  className?: string;
}

/**
 * Curated isolated jewellery assets on seamless white/transparent background.
 * Versioned with query param ?v=2 to bust any browser cache of older burgundy velvet assets.
 */
const ISOLATED_CATEGORY_ASSET_MAP: Record<string, string> = {
  necklaces: '/images/categories/necklaces.jpg?v=2',
  necklace: '/images/categories/necklaces.jpg?v=2',
  choker: '/images/categories/necklaces.jpg?v=2',
  'haram-long-chains': '/images/categories/haram-long-chains.jpg?v=2',
  haram: '/images/categories/haram-long-chains.jpg?v=2',
  'long-chains': '/images/categories/haram-long-chains.jpg?v=2',
  chains: '/images/categories/haram-long-chains.jpg?v=2',
  earrings: '/images/categories/earrings.jpg?v=2',
  earring: '/images/categories/earrings.jpg?v=2',
  jhumka: '/images/categories/earrings.jpg?v=2',
  bangles: '/images/categories/bangles.jpg?v=2',
  bangle: '/images/categories/bangles.jpg?v=2',
  kada: '/images/categories/bangles.jpg?v=2',
  rings: '/images/categories/rings.jpg?v=2',
  ring: '/images/categories/rings.jpg?v=2',
  'thali-mangalsutra': '/images/categories/thali-mangalsutra.jpg?v=2',
  thali: '/images/categories/thali-mangalsutra.jpg?v=2',
  mangalsutra: '/images/categories/thali-mangalsutra.jpg?v=2',
  'diamond-jewellery': '/images/categories/diamond-jewellery.jpg?v=2',
  diamond: '/images/categories/diamond-jewellery.jpg?v=2',
  'platinum-jewellery': '/images/categories/platinum-jewellery.jpg?v=2',
  platinum: '/images/categories/platinum-jewellery.jpg?v=2',
  'gold-jewellery': '/images/categories/gold-jewellery.jpg?v=2',
  gold: '/images/categories/gold-jewellery.jpg?v=2',
  'silver-jewellery': '/images/categories/silver-jewellery.jpg?v=2',
  silver: '/images/categories/silver-jewellery.jpg?v=2',
  'daily-wear': '/images/categories/daily-wear.jpg?v=2',
  'coins-gifts': '/images/categories/coins-gifts.jpg?v=2',
  coins: '/images/categories/coins-gifts.jpg?v=2',
  gifts: '/images/categories/coins-gifts.jpg?v=2',
  new: '/images/categories/gold-jewellery.jpg?v=2',
  'new-arrivals': '/images/categories/gold-jewellery.jpg?v=2',
};

/**
 * Resolves the jewellery image for a category:
 * 1. Priority goes to custom image uploaded/saved by admin (Cloudinary, /uploads, or external URL).
 * 2. Fallback to curated isolated jewellery cutouts when no image is configured or available.
 */
export function resolveCategoryIsolatedImage(category: Partial<Category>): string {
  // 1. Check custom uploaded or configured image URL
  const customUrl = (category.imageUrl || '').trim();
  if (customUrl) {
    if (customUrl.startsWith('/images/categories/') && !customUrl.includes('?')) {
      return `${customUrl}?v=2`;
    }
    return customUrl;
  }

  // 2. Fallback to curated isolated jewellery assets
  const rawIdentifier = `${category.slug || ''} ${category.name || ''}`.toLowerCase();

  if (rawIdentifier.includes('necklace') || rawIdentifier.includes('choker') || rawIdentifier.includes('nck')) {
    return '/images/categories/necklaces.jpg?v=2';
  }
  if (
    rawIdentifier.includes('haram') ||
    rawIdentifier.includes('long chain') ||
    rawIdentifier.includes('chain') ||
    rawIdentifier.includes('kasu') ||
    rawIdentifier.includes('hrm')
  ) {
    return '/images/categories/haram-long-chains.jpg?v=2';
  }
  if (rawIdentifier.includes('earring') || rawIdentifier.includes('jhumka') || rawIdentifier.includes('ear')) {
    return '/images/categories/earrings.jpg?v=2';
  }
  if (rawIdentifier.includes('anklet') || rawIdentifier.includes('kolusu')) {
    return '/images/categories/silver-jewellery.jpg?v=2';
  }
  if (rawIdentifier.includes('toe ring') || rawIdentifier.includes('metti')) {
    return '/images/categories/silver-jewellery.jpg?v=2';
  }
  if (
    rawIdentifier.includes('bangle') ||
    rawIdentifier.includes('kada') ||
    rawIdentifier.includes('bracelet') ||
    rawIdentifier.includes('bng')
  ) {
    return '/images/categories/bangles.jpg?v=2';
  }
  if (rawIdentifier.includes('ring') || rawIdentifier.includes('rng')) {
    return '/images/categories/rings.jpg?v=2';
  }
  if (rawIdentifier.includes('thali') || rawIdentifier.includes('mangal') || rawIdentifier.includes('thl')) {
    return '/images/categories/thali-mangalsutra.jpg?v=2';
  }
  if (rawIdentifier.includes('diamond')) {
    return '/images/categories/diamond-jewellery.jpg?v=2';
  }
  if (rawIdentifier.includes('platinum')) {
    return '/images/categories/platinum-jewellery.jpg?v=2';
  }
  if (rawIdentifier.includes('silver')) {
    return '/images/categories/silver-jewellery.jpg?v=2';
  }
  if (rawIdentifier.includes('coin') || rawIdentifier.includes('gift')) {
    return '/images/categories/coins-gifts.jpg?v=2';
  }
  if (rawIdentifier.includes('daily')) {
    return '/images/categories/daily-wear.jpg?v=2';
  }
  if (rawIdentifier.includes('new') || rawIdentifier.includes('arrival')) {
    return '/images/categories/gold-jewellery.jpg?v=2';
  }
  if (rawIdentifier.includes('gold')) {
    return '/images/categories/gold-jewellery.jpg?v=2';
  }

  const slug = (category.slug || category.name || 'necklaces')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  return ISOLATED_CATEGORY_ASSET_MAP[slug] || '/images/categories/necklaces.jpg?v=2';
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  previewOnly = false,
  className = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const primarySrc = resolveCategoryIsolatedImage(category);
  const fallbackSrc = '/images/categories/necklaces.jpg?v=2';

  React.useEffect(() => {
    setImgFailed(false);
  }, [category.imageUrl, category.imagePublicId, category.name, category.slug]);

  const itemContent = (
    <div
      className={`group flex flex-col items-center justify-start text-center cursor-pointer select-none py-1 transition-transform duration-300 w-full ${className}`}
    >
      {/* 
        1. Circular Jewellery Image Frame:
        Strictly locked 1:1 circle with identical width and height on all viewports.
        Absolute positioning prevents image intrinsic dimensions from distorting circle into an oval.
      */}
      <div className="relative w-32 h-32 min-[360px]:w-36 min-[360px]:h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 lg:w-56 lg:h-56 mx-auto shrink-0 select-none">
        {/* Decorative subtle outer gold halo ring on hover */}
        <div className="absolute -inset-1 rounded-full border border-[#DFC389]/50 group-hover:border-[#A4792B] group-hover:scale-105 transition-all duration-300 pointer-events-none" />

        {/* Circular Viewport with Luxury Gold Border & Soft Shadow */}
        <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-[#FFFDF8] via-[#FAF4EA] to-[#F3E7D3] border-2 sm:border-[3px] border-[#DFC389] group-hover:border-[#A4792B] shadow-[0_6px_20px_rgba(69,10,19,0.12)] group-hover:shadow-[0_10px_28px_rgba(69,10,19,0.22)] ring-2 sm:ring-4 ring-[#FAF4EA] group-hover:ring-[#DFC389]/50 transition-all duration-300">
          <img
            key={primarySrc}
            src={imgFailed ? fallbackSrc : primarySrc}
            alt={category.name}
            loading="lazy"
            draggable={false}
            onError={() => {
              if (!imgFailed) setImgFailed(true);
            }}
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-110 pointer-events-none select-none"
          />
          {/* Subtle elegant radial sheen overlay */}
          <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-white/10 opacity-50 group-hover:opacity-30 transition-opacity" />
        </div>
      </div>

      {/* 2. Category Name Directly Below (Dark Burgundy #380711, hover antique gold #A4792B) */}
      <span className="mt-2.5 sm:mt-3.5 font-serif text-xs sm:text-sm md:text-base font-bold tracking-wider uppercase text-[#380711] group-hover:text-[#A4792B] transition-colors duration-200 text-center leading-snug line-clamp-1 max-w-[130px] sm:max-w-[200px]">
        {category.name}
      </span>
    </div>
  );

  if (previewOnly) {
    return itemContent;
  }

  return (
    <Link
      to={`/products?categoryId=${category._id}`}
      aria-label={`Explore ${category.name} collection`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A3A] rounded-2xl transition-transform duration-300"
    >
      {itemContent}
    </Link>
  );
};
