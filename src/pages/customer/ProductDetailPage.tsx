import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, ShieldCheck, CheckCircle2, ChevronRight, Gem, Info, Award, Phone } from 'lucide-react';
import { productsApi } from '@/services/api/products.api';
import { formatWeight, formatCarat } from '@/utils/weight';
import { useStoreWhatsApp } from '@/hooks/useStoreWhatsApp';
import { ScrollReveal, ImageReveal, AnimatedCTA } from '@/components/motion';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);
  const { buildWhatsAppUrl, displayPhone, telHref } = useStoreWhatsApp();

  // Fetch Product by Slug
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getProductBySlug(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center animate-pulse space-y-4">
        <div className="h-8 bg-stone-200 rounded max-w-sm mx-auto" />
        <div className="h-64 bg-stone-200 rounded-xl max-w-2xl mx-auto" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-burgundy-950">
          Piece Not Found
        </h2>
        <p className="text-sm text-stone-600">
          The requested jewellery piece may have been updated or retired.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-burgundy-900 text-gold-200 text-xs font-semibold"
        >
          Return to Catalogue
        </Link>
      </div>
    );
  }

  const images = product.images || [];
  const currentImage = images[selectedImageIndex]?.url || '';
  const hasValidImage = Boolean(currentImage) && !imgFailed;
  const purity = product.metal?.purity || product.purity || '';
  const grossWeight = product.metal?.grossWeightGrams ?? product.grossWeightGrams ?? null;
  const netWeight = product.metal?.netWeightGrams ?? product.netMetalWeightGrams ?? null;

  const whatsappUrl = buildWhatsAppUrl({
    type: 'PRODUCT',
    productTitle: product.title,
    productSku: product.sku,
    categoryName: product.category?.name,
  });

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-stone-500 overflow-x-auto whitespace-nowrap pb-2">
          <Link to="/" className="hover:text-burgundy-800">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <Link to="/products" className="hover:text-burgundy-800">Catalogue</Link>
          {product.category && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              <Link to={`/products?categoryId=${product.categoryId}`} className="hover:text-burgundy-800">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-burgundy-900 font-semibold truncate max-w-xs">{product.title}</span>
        </nav>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Gallery (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-burgundy-950 border border-gold-400/40 shadow-luxury flex items-center justify-center">
              {hasValidImage ? (
                <ImageReveal
                  key={currentImage}
                  src={currentImage}
                  alt={product.title}
                  wrapperClassName="w-full h-full bg-white p-2"
                  className="w-full h-full object-contain object-center transition-transform duration-500 ease-luxury hover:scale-[1.03]"
                  onImageError={() => setImgFailed(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#4B0814] via-[#31040B] to-[#1D0206] flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/45 flex items-center justify-center mb-4">
                    <Gem className="w-8 h-8 text-[#E6C56F]" />
                  </div>
                  <p className="font-serif text-sm uppercase tracking-[0.2em] text-[#E6C56F] font-semibold">
                    {product.category?.name || 'Heritage Jewellery'}
                  </p>
                  <p className="text-xs text-[#E7D4AF]/80 mt-2 max-w-xs">
                    Studio photograph awaits admin upload for this catalogue piece.
                  </p>
                </div>
              )}

              {purity && (
                <div className="absolute top-4 left-4 bg-burgundy-950/85 backdrop-blur-sm text-gold-300 text-xs px-3 py-1 rounded-full border border-gold-500/35 flex items-center gap-1.5">
                  {product.hallmarkStatus && <ShieldCheck className="w-4 h-4 text-gold-400" />}
                  <span>
                    {purity}
                    {product.hallmarkStatus ? ' Hallmarked' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Carousel */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedImageIndex(idx);
                      setImgFailed(false);
                    }}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                      selectedImageIndex === idx
                        ? 'border-gold-500 ring-2 ring-gold-400/30'
                        : 'border-stone-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Specifications & Pricing (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex items-center gap-3 text-xs text-stone-500 mb-1">
                <span className="font-mono uppercase font-bold tracking-wider text-burgundy-800">
                  SKU: {product.sku}
                </span>
                <span>•</span>
                <span className="text-gold-700 font-semibold">{product.metal?.metalType}</span>
                {product.collectionType && (
                  <>
                    <span>•</span>
                    <span className="uppercase text-stone-600">{product.collectionType}</span>
                  </>
                )}
              </div>

              <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-burgundy-950 leading-tight">
                {product.title}
              </h1>

              <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed font-light">
                {product.description || 'Exclusive bridal heirloom piece mastercrafted by Sri Ramas Jewellery artisans.'}
              </p>
            </div>

            {/* Metal & Weight Specifications Box */}
            <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-4 shadow-sm">
              <h2 className="font-serif font-bold text-sm text-burgundy-900 border-b border-stone-200 pb-2 flex items-center gap-2">
                <Award className="w-4 h-4 text-gold-600" />
                <span>Specifications</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-stone-500 block">Precious Metal</span>
                  <span className="font-semibold text-stone-900 mt-0.5 block">
                    {product.metal?.metalType}
                  </span>
                </div>

                {purity && (
                  <div>
                    <span className="text-stone-500 block">Purity</span>
                    <span className="font-semibold text-burgundy-900 mt-0.5 block">
                      {purity}
                      {product.hallmarkStatus ? ' (Hallmarked)' : ''}
                    </span>
                  </div>
                )}

                {grossWeight && grossWeight > 0 && (
                  <div>
                    <span className="text-stone-500 block">Gross Weight</span>
                    <span className="font-mono font-semibold text-stone-900 mt-0.5 block">
                      {formatWeight(grossWeight)}
                    </span>
                  </div>
                )}

                {netWeight && netWeight > 0 && (
                  <div>
                    <span className="text-stone-500 block">Net Metal Weight</span>
                    <span className="font-mono font-semibold text-stone-900 mt-0.5 block">
                      {formatWeight(netWeight)}
                    </span>
                  </div>
                )}
              </div>

              {!purity && !grossWeight && !netWeight && (
                <p className="text-xs text-stone-500 italic">
                  Exact gram weight and hallmark details are verified on piece tag — enquire with our showroom advisors for piece specifications.
                </p>
              )}

              {/* Stone specs if present */}
              {product.stones && product.stones.length > 0 && (
                <div className="pt-3 border-t border-stone-100">
                  <span className="text-xs font-semibold text-stone-700 block mb-2 flex items-center gap-1.5">
                    <Gem className="w-3.5 h-3.5 text-gold-600" />
                    <span>Gemstone & Diamond Inlays</span>
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-ivory-50 p-3 rounded-lg border border-gold-200/60">
                    {product.stones.map((st, i) => (
                      <div key={i}>
                        <span className="text-stone-500 block">{st.stoneType}</span>
                        <span className="font-semibold text-stone-900">
                          {st.carats ? formatCarat(st.carats) : ''} {st.pieces ? `(${st.pieces} pcs)` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Showroom Consultation & Craftsmanship Notice */}
            <div className="bg-ivory-50 rounded-xl border border-gold-400/60 p-5 space-y-3 shadow-sm">
              <div className="flex items-start gap-2.5 text-xs text-stone-700">
                <Info className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
                <div className="space-y-1 leading-relaxed">
                  <p className="font-serif font-bold text-sm text-burgundy-950">
                    Showroom Consultation &amp; Customisation
                  </p>
                  <p className="text-[11px] sm:text-xs text-stone-600">
                    Sri Ramas Jewellery is a boutique showroom showcase. Please reach our showroom specialists on WhatsApp or by telephone for availability, bespoke sizing, exact weight options, and private viewing appointments.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <ScrollReveal variant="fade-up" immediate>
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AnimatedCTA
                    variant="whatsapp"
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    icon={<MessageCircle className="w-4 h-4" />}
                    className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md"
                  >
                    Enquire on WhatsApp
                  </AnimatedCTA>

                  <AnimatedCTA
                    variant="burgundy"
                    href={telHref}
                    icon={<Phone className="w-4 h-4 text-gold-400" />}
                    className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-luxury"
                  >
                    Call Showroom ({displayPhone})
                  </AnimatedCTA>
                </div>

                <div className="flex items-center justify-between text-xs text-stone-500 pt-2 px-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Showroom Inspection Guaranteed
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Custom Sizing &amp; Engraving
                  </span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </>
  );
};
