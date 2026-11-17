import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, ArrowRight, ShieldCheck, Gem } from 'lucide-react';
import { Product } from '@/types';
import { formatWeight } from '@/utils/weight';
import { ImageReveal } from '../motion';

interface ProductCardProps {
  product: Product;
  previewOnly?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, previewOnly = false }) => {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  const primaryImage = React.useMemo(() => {
    if (!product.images || product.images.length === 0) return '';
    const first: any = product.images[0];
    if (typeof first === 'string') return first;
    const primary = (product.images as any[]).find((img) => img?.isPrimary && img?.url);
    if (primary?.url) return primary.url;
    if (first?.url) return first.url;
    return '';
  }, [product.images]);

  const hasValidImage = Boolean(primaryImage) && failedImageUrl !== primaryImage;
  const purity = product.metal?.purity || product.purity || '';
  const grossWeight = product.metal?.grossWeightGrams ?? product.grossWeightGrams ?? null;
  const netWeight = product.metal?.netWeightGrams ?? product.netMetalWeightGrams ?? null;
  const hasWeights = Boolean((grossWeight && grossWeight > 0) || (netWeight && netWeight > 0));
  const categoryName = product.category?.name;
  const metalType = product.metal?.metalType || product.metalType;

  const imageContent = hasValidImage ? (
    <div className="w-full h-full overflow-hidden">
      <img
        key={primaryImage}
        src={primaryImage}
        alt={product.title || product.name || 'Sri Ramas Jewellery'}
        loading="lazy"
        className="w-full h-full block object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105 select-none pointer-events-none"
        onError={() => setFailedImageUrl(primaryImage)}
      />
    </div>
  ) : (
    <div className="w-full h-full bg-[#FAF5EC] flex flex-col items-center justify-center p-5 text-center relative transition-colors duration-[400ms]">
      <div className="absolute inset-3 rounded-lg border border-[#D4AF37]/30 group-hover:border-[#E6C56F]/55 transition-colors duration-[400ms] pointer-events-none" aria-hidden="true" />
      <div className="w-12 h-12 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 group-hover:scale-105 group-hover:border-[#E6C56F]/65 transition-all duration-[400ms] flex items-center justify-center mb-3">
        <Gem className="w-6 h-6 text-[#9A7B38]" />
      </div>
      <p className="font-serif text-xs uppercase tracking-[0.2em] text-[#8C6D2D] font-semibold">
        {categoryName || 'Heritage Craft'}
      </p>
      <p className="text-[11px] text-stone-500 mt-1 max-w-[180px] leading-snug">
        Studio photograph awaiting admin upload
      </p>
    </div>
  );

  return (
    <>
      <div className="group bg-white rounded-xl overflow-hidden border border-gold-300/60 hover:border-[#C99B3B] shadow-md hover:shadow-[0_16px_36px_-12px_rgba(69,10,19,0.28)] hover:-translate-y-1 transition-all duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col w-full">
        {/* Product Image Area: Fixed square aspect ratio, edge-to-edge fill with zero empty dark gaps */}
        <div className="relative aspect-square w-full overflow-hidden bg-[#FDFBF7] flex items-center justify-center">
          {previewOnly ? (
            <div className="w-full h-full block">{imageContent}</div>
          ) : (
            <Link to={`/products/${product.slug}`} className="w-full h-full block">
              {imageContent}
            </Link>
          )}

          {/* Left Feature / New Arrival Badges (only when configured) */}
          {(product.isNewArrival || product.isFeatured) && (
            <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
              {product.isNewArrival && (
                <span className="bg-brand-maroon-gradient text-gold-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow">
                  New Arrival
                </span>
              )}
              {product.isFeatured && (
                <span className="bg-brand-gold-gradient text-burgundy-950 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow">
                  Featured
                </span>
              )}
            </div>
          )}

          {/* Right Purity Badge (only when admin configured real purity) */}
          {purity && (
            <div className="absolute top-2.5 right-2.5 bg-burgundy-950/85 backdrop-blur-sm text-gold-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-gold-500/35 flex items-center gap-1 z-10">
              {product.hallmarkStatus && <ShieldCheck className="w-3 h-3 text-gold-400" />}
              <span>
                {purity}
                {product.hallmarkStatus ? ' Hallmarked' : ''}
              </span>
            </div>
          )}

          {/* Bottom Weight Bar (only shown when real weights exist) */}
          {hasWeights && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-charcoal-950/85 via-charcoal-950/45 to-transparent p-2.5 pt-6 flex items-center justify-between text-[11px] text-gold-100 font-medium z-10">
              {grossWeight && grossWeight > 0 ? (
                <span>Gross: {formatWeight(grossWeight)}</span>
              ) : (
                <span />
              )}
              {netWeight && netWeight > 0 && (
                <span className="text-gold-300/95">Net: {formatWeight(netWeight)}</span>
              )}
            </div>
          )}
        </div>

        {/* Product Details Area */}
        <div className="p-4 flex flex-col flex-1 justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-[11px] text-stone-500">
              <span className="font-mono uppercase tracking-wider truncate">{product.sku}</span>
              <span className="text-gold-700 font-semibold shrink-0">
                {[categoryName, metalType].filter(Boolean).join(' • ')}
              </span>
            </div>

            {previewOnly ? (
              <h3 className="font-serif font-bold text-sm sm:text-base text-burgundy-900 line-clamp-2 min-h-[2.5rem]">
                {product.title || product.name || 'Untitled Jewellery Piece'}
              </h3>
            ) : (
              <Link
                to={`/products/${product.slug}`}
                className="block font-serif font-bold text-sm sm:text-base text-burgundy-900 group-hover:text-burgundy-700 transition-colors line-clamp-2 min-h-[2.5rem]"
              >
                {product.title}
              </Link>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-2.5 border-t border-stone-200">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {previewOnly ? (
                <span className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg border border-gold-600/80 text-burgundy-900 font-medium text-[11px] sm:text-xs opacity-80 whitespace-nowrap">
                  <span className="truncate">View Details</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </span>
              ) : (
                <Link
                  to={`/products/${product.slug}`}
                  className="group/spec flex-1 min-w-0 inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg border border-gold-600/80 text-burgundy-900 hover:bg-[#FAF0D6] hover:border-[#9E751E] font-medium text-[11px] sm:text-xs transition-all duration-200 active:scale-[0.98] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                >
                  <span className="truncate">View Details</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover/spec:translate-x-0.5" />
                </Link>
              )}

              {previewOnly ? (
                <span className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-2 rounded-lg bg-burgundy-900 text-gold-200 font-medium text-[11px] sm:text-xs opacity-80 whitespace-nowrap">
                  <MessageCircle className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                  <span>Enquire</span>
                </span>
              ) : (
                <Link
                  to={{
                    pathname: '/contact',
                    search: `?enquiryType=PRODUCT&productSku=${encodeURIComponent(product.sku || '')}&productName=${encodeURIComponent(product.title || product.name || '')}&category=${encodeURIComponent(categoryName || '')}`,
                  }}
                  state={{
                    product: {
                      id: product._id,
                      name: product.title || product.name,
                      sku: product.sku,
                      category: categoryName,
                      metalType: product.metalType,
                      purity: product.purity,
                      slug: product.slug,
                      url: typeof window !== 'undefined' ? `${window.location.origin}/products/${product.slug}` : `/products/${product.slug}`,
                    },
                  }}
                  className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-2 rounded-lg bg-burgundy-900 hover:bg-burgundy-800 hover:shadow-md text-gold-200 hover:text-gold-100 font-medium text-[11px] sm:text-xs transition-all duration-200 shadow-sm active:scale-[0.97] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                  <span>Enquire</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
