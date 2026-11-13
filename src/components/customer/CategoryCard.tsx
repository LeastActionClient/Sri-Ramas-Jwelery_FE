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
 * Resolves the isolated jewellery image on clean white background for any category.
 * Always resolves to the pristine studio-isolated cutouts on pure white background,
 * bypassing any legacy database images containing burgundy velvet or promotional graphics.
 */
export function resolveCategoryIsolatedImage(category: Partial<Category>): string {
  // Normalize slug and name to match against curated isolated jewellery cutouts
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

  const rawUrl = (category.imageUrl || '').trim();
  if (rawUrl.startsWith('/images/categories/')) {
    return `${rawUrl}?v=2`;
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

  const itemContent = (
    <div
      className={`group flex flex-col items-center justify-start text-center cursor-pointer select-none py-1 transition-transform duration-300 ${className}`}
    >
      {/* 
        1. Isolated Jewellery Product Image (140px–176px visual presence)
        Naturally floating on the clean white background with generous breathing space
      */}
      <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 flex items-center justify-center pointer-events-none p-1 sm:p-2">
        <img
          src={imgFailed ? fallbackSrc : primarySrc}
          alt={category.name}
          loading="lazy"
          draggable={false}
          onError={() => {
            if (!imgFailed) setImgFailed(true);
          }}
          className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(56,7,17,0.06)] transition-transform duration-300 ease-out group-hover:scale-106 pointer-events-none select-none"
        />
      </div>

      {/* 2. Category Name Directly Below (Dark Burgundy #380711, hover antique gold #C49A3A) */}
      <span className="mt-3 font-serif text-xs sm:text-[13px] md:text-sm font-bold tracking-wider uppercase text-[#380711] group-hover:text-[#C49A3A] transition-colors duration-200 text-center leading-snug line-clamp-2 max-w-[170px]">
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
      className="block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C49A3A] rounded-lg transition-transform duration-300"
    >
      {itemContent}
    </Link>
  );
};
