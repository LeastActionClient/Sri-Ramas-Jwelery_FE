import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Gem,
  Award,
  Phone,
  ZoomIn,
  X,
  Sparkles
} from 'lucide-react';
import { productsApi } from '@/services/api/products.api';
import { formatWeight } from '@/utils/weight';
import { useStoreWhatsApp } from '@/hooks/useStoreWhatsApp';
import { ScrollReveal } from '@/components/motion';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const { displayPhone, telHref, whatsappNumber } = useStoreWhatsApp();

  // Fetch Product by Slug dynamically from backend/CMS
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getProductBySlug(slug!),
    enabled: !!slug,
  });

  const images = product?.images || [];
  const currentImage = images[selectedImageIndex]?.url || '';
  const hasValidImage = Boolean(currentImage) && !imgFailed;
  const purity = (product?.metal?.purity || product?.purity || '').trim();
  const grossWeight = product?.metal?.grossWeightGrams ?? product?.grossWeightGrams ?? null;
  const netWeight = product?.metal?.netWeightGrams ?? product?.netMetalWeightGrams ?? null;
  const stoneWeight = product?.stoneWeightGrams ?? (product?.categoryAttributes?.stoneWeightGrams ? Number(product.categoryAttributes.stoneWeightGrams) : null);

  // Prefilled WhatsApp Enquiry Message matching requirement:
  // "Hello Sri Ramas Jewellery, I am interested in the [Product Name] (SKU: [Product SKU]). Please share more details."
  const whatsappUrl = useMemo(() => {
    if (!product) return '';
    const prodName = product.name || product.title || 'Jewellery Piece';
    const prodSku = product.sku || '';
    const message = `Hello Sri Ramas Jewellery, I am interested in the ${prodName} (SKU: ${prodSku}). Please share more details.`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  }, [product, whatsappNumber]);

  // Dynamically assemble all available specification rows from CMS data
  const specRows = useMemo(() => {
    if (!product) return [];
    const rows: { label: string; value: React.ReactNode }[] = [];

    // 1. Product Code (SKU)
    if (product.sku) {
      rows.push({ label: 'Product Code', value: product.sku });
    }

    // 2. Precious Metal
    const metal = product.metalType || product.metal?.metalType;
    if (metal) {
      rows.push({ label: 'Precious Metal', value: metal.toUpperCase() });
    }

    // 3. Purity & Hallmark
    if (purity) {
      rows.push({
        label: 'Purity',
        value: `${purity}${product.hallmarkStatus ? ' • BIS 916 Hallmarked' : ''}`,
      });
    } else if (product.hallmarkStatus) {
      rows.push({ label: 'Hallmark Status', value: 'BIS 916 Hallmarked' });
    }

    // 4. Jewellery Type / Subcategory
    const catAttrs = product.categoryAttributes || {};
    const jType = catAttrs.jewelleryType || catAttrs.productType || product.subcategory?.name;
    if (jType) {
      rows.push({ label: 'Product Type', value: String(jType) });
    } else if (product.category?.name) {
      rows.push({ label: 'Jewellery Category', value: product.category.name });
    }

    // 5. Weight Details (only shown if entered with positive values)
    if (grossWeight && grossWeight > 0) {
      rows.push({ label: 'Gross Weight', value: formatWeight(grossWeight) });
    }
    if (netWeight && netWeight > 0) {
      rows.push({ label: 'Net Metal Weight', value: formatWeight(netWeight) });
    }
    if (stoneWeight && stoneWeight > 0) {
      rows.push({ label: 'Stone Weight', value: formatWeight(stoneWeight) });
    }

    // 6. Stone Details & Gemstones
    const stoneDetails = catAttrs.stoneDetails || catAttrs.stones;
    if (stoneDetails) {
      rows.push({ label: 'Stone Details', value: String(stoneDetails) });
    }
    const gemstone = catAttrs.gemstone || catAttrs.gemstones;
    if (gemstone) {
      rows.push({ label: 'Gemstone', value: String(gemstone) });
    }
    if (product.stones && product.stones.length > 0 && !stoneDetails) {
      const formattedStones = product.stones
        .map((s) => `${s.stoneType}${s.carats ? ` (${s.carats} cts)` : ''}${s.pieces ? ` [${s.pieces} pcs]` : ''}`)
        .join(', ');
      if (formattedStones) {
        rows.push({ label: 'Stone Inlays', value: formattedStones });
      }
    }

    // 7. Design & Craftsmanship
    const design = catAttrs.design || catAttrs.designDetails;
    if (design) {
      rows.push({ label: 'Design & Style', value: String(design) });
    }
    const craftsmanship = catAttrs.craftsmanship || catAttrs.makingDetails;
    if (craftsmanship) {
      rows.push({ label: 'Craftsmanship', value: String(craftsmanship) });
    }

    // 8. HUID Hallmark Number
    if (product.huid) {
      rows.push({ label: 'HUID Hallmark No.', value: product.huid });
    }

    // 9. Gender / Ideal For
    if (product.gender) {
      rows.push({ label: 'Ideal For', value: product.gender });
    }

    // 10. Occasion
    if (product.occasion && product.occasion.length > 0) {
      rows.push({ label: 'Occasion', value: product.occasion.join(' • ') });
    }

    // 11. Certification
    if (product.certification?.agency || product.certification?.certificateNumber) {
      const certString = [
        product.certification.agency,
        product.certification.certificateNumber ? `ID #${product.certification.certificateNumber}` : '',
      ]
        .filter(Boolean)
        .join(' - ');
      rows.push({ label: 'Certification', value: certString });
    }

    // 12. Dynamic Custom Specifications (any additional key-value pairs stored in CMS)
    const knownKeys = new Set([
      'jewelleryType',
      'productType',
      'stoneDetails',
      'stones',
      'gemstone',
      'gemstones',
      'design',
      'designDetails',
      'craftsmanship',
      'makingDetails',
      'stoneWeightGrams',
    ]);
    Object.entries(catAttrs).forEach(([key, val]) => {
      if (!knownKeys.has(key) && val !== null && val !== undefined && String(val).trim() !== '') {
        const formattedLabel = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/[_-]/g, ' ')
          .replace(/^\w/, (c) => c.toUpperCase())
          .trim();
        rows.push({ label: formattedLabel, value: String(val) });
      }
    });

    return rows;
  }, [product, purity, grossWeight, netWeight, stoneWeight]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center animate-pulse space-y-6">
        <div className="h-6 bg-stone-200 rounded max-w-xs mx-auto" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
          <div className="lg:col-span-6 h-96 bg-stone-200 rounded-2xl" />
          <div className="lg:col-span-6 space-y-4">
            <div className="h-8 bg-stone-200 rounded w-3/4" />
            <div className="h-20 bg-stone-200 rounded" />
            <div className="h-40 bg-stone-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-[#380711]">
          Jewellery Piece Not Found
        </h2>
        <p className="text-sm text-stone-600">
          The requested jewellery piece may have been updated, relocated, or retired.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#380711] text-[#F5DE9C] text-xs font-semibold hover:bg-[#4E0A18] transition-colors"
        >
          Return to Catalogue
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-stone-500 overflow-x-auto whitespace-nowrap pb-1">
          <Link to="/" className="hover:text-[#380711] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <Link to="/products" className="hover:text-[#380711] transition-colors">Catalogue</Link>
          {product.category && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <Link to={`/products?categoryId=${product.categoryId}`} className="hover:text-[#380711] transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span className="text-[#380711] font-semibold truncate max-w-xs">{product.title || product.name}</span>
        </nav>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* 
            LEFT COLUMN: Product Image & Gallery (5 cols on lg)
            - Fills display card completely without unwanted white padding or empty spaces.
            - Interactive click-to-enlarge zoom modal.
            - Thumbnail gallery if multiple images are available.
          */}
          <div className="lg:col-span-5 space-y-4">
            <div
              onClick={() => hasValidImage && setIsZoomOpen(true)}
              className={`relative aspect-square w-full rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-stone-100 group ${
                hasValidImage ? 'cursor-zoom-in' : ''
              }`}
            >
              {hasValidImage ? (
                <>
                  <img
                    src={currentImage}
                    alt={product.title || product.name}
                    onError={() => setImgFailed(true)}
                    className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#380711] via-[#24050B] to-[#120205] flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#C49A3A]/20 border border-[#C49A3A]/50 flex items-center justify-center mb-4">
                    <Gem className="w-8 h-8 text-[#F5DE9C]" />
                  </div>
                  <p className="font-serif text-sm uppercase tracking-[0.2em] text-[#F5DE9C] font-semibold">
                    {product.category?.name || 'Sri Ramas Heritage'}
                  </p>
                  <p className="text-xs text-stone-300 mt-2 max-w-xs">
                    Studio photograph awaits admin upload for this catalogue piece.
                  </p>
                </div>
              )}

              {/* Purity & Hallmark Badge Overlay */}
              {purity && (
                <div className="absolute top-3 left-3 bg-[#380711]/90 backdrop-blur-xs text-[#F5DE9C] text-[11px] font-bold px-3 py-1 rounded-full border border-[#C49A3A]/40 flex items-center gap-1.5 shadow-sm">
                  {product.hallmarkStatus && <ShieldCheck className="w-3.5 h-3.5 text-[#C49A3A]" />}
                  <span>
                    {purity}
                    {product.hallmarkStatus ? ' Hallmarked' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery Navigation */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedImageIndex(idx);
                      setImgFailed(false);
                    }}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      selectedImageIndex === idx
                        ? 'border-[#C49A3A] ring-2 ring-[#C49A3A]/40 scale-102'
                        : 'border-stone-200 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover object-center"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 
            RIGHT COLUMN: Product Details, Specifications & Enquiries (7 cols on lg)
          */}
          <div className="lg:col-span-7 space-y-6">
            {/* Header: SKU, Category & Title */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-600">
                <span className="font-mono uppercase font-bold tracking-wider text-[#380711]">
                  SKU: {product.sku}
                </span>
                <span>•</span>
                <span className="text-[#A4792B] font-bold uppercase tracking-wider">
                  {product.metalType || product.metal?.metalType || 'GOLD'}
                </span>
                {product.category?.name && (
                  <>
                    <span>•</span>
                    <span className="uppercase text-stone-600">{product.category.name}</span>
                  </>
                )}
                {product.isNewArrival && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    New Arrival
                  </span>
                )}
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#380711] leading-tight tracking-wide">
                {product.title || product.name}
              </h1>

              {product.description && (
                <p className="text-sm sm:text-base text-stone-700 leading-relaxed font-normal pt-1">
                  {product.description}
                </p>
              )}
            </div>

            {/* 
              DYNAMIC SPECIFICATIONS SECTION
              Generated completely from Admin CMS data.
              Only fields with actual values are displayed.
            */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 bg-stone-50/80 border-b border-stone-200 flex items-center justify-between">
                <h2 className="font-serif font-bold text-sm text-[#380711] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#C49A3A]" />
                  <span>Product Specifications</span>
                </h2>
                {product.hallmarkStatus && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    BIS 916 Verified
                  </span>
                )}
              </div>

              {specRows.length > 0 ? (
                <dl className="divide-y divide-stone-100 text-xs sm:text-sm">
                  {specRows.map((spec, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-2 px-5 py-3 hover:bg-stone-50/60 transition-colors items-center"
                    >
                      <dt className="text-stone-600 font-medium">{spec.label}</dt>
                      <dd className="font-semibold text-[#380711] text-right sm:text-left">
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div className="p-5 text-center text-xs text-stone-500 italic">
                  Hallmark and gram weight details are verified on piece tag — enquire with our showroom specialists.
                </div>
              )}
            </div>

            {/* 
              ENQUIRY ACTION BUTTONS
              1. WhatsApp Enquiry: High-contrast WhatsApp Green (#25D366) with bold white text.
                 Prefilled message: "Hello Sri Ramas Jewellery, I am interested in the [Product Name] (SKU: [Product SKU]). Please share more details."
              2. Call Showroom: High-contrast burgundy and antique gold styling with active tel: link.
            */}
            <ScrollReveal variant="fade-up" immediate>
              <div className="space-y-3.5 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* WhatsApp Enquiry Button */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Enquire on WhatsApp about ${product.title || product.name}`}
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide bg-[#25D366] hover:bg-[#20ba59] text-white shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-white shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.39-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.71 4.3 3.8 2.53 1.09 2.53.73 2.98.69.46-.04 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29" />
                    </svg>
                    <span>Enquire on WhatsApp</span>
                  </a>

                  {/* Call Showroom Button */}
                  <a
                    href={telHref}
                    aria-label={`Call Showroom at ${displayPhone}`}
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide bg-[#380711] hover:bg-[#4E0A18] text-[#F5DE9C] border border-[#C49A3A]/40 shadow-luxury flex items-center justify-center gap-2.5 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Phone className="w-4 h-4 text-[#C49A3A] shrink-0" />
                    <span>Call Showroom ({displayPhone})</span>
                  </a>
                </div>

                {/* Showroom Trust Assurances */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-700 pt-2 px-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Showroom Inspection Guaranteed
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Custom Sizing &amp; Engraving
                  </span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* Enlarged Image Zoom Lightbox Modal */}
      {isZoomOpen && hasValidImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged jewellery photograph view"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            aria-label="Close enlarged view"
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={currentImage}
            alt={product.title || product.name}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
