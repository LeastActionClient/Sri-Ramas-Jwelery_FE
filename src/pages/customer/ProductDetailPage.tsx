import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Gem,
  Award,
  Phone,
  ZoomIn,
  X,
  Sparkles,
  Play,
  MessageSquare,
  MessageCircle,
  Share2,
  Check
} from 'lucide-react';
import { productsApi } from '@/services/api/products.api';
import { formatWeight } from '@/utils/weight';
import { useStoreWhatsApp } from '@/hooks/useStoreWhatsApp';
import { ScrollReveal } from '@/components/motion';
import { SEO } from '@/components/common/SEO';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const { displayPhone, telHref, buildWhatsAppUrl } = useStoreWhatsApp();

  // Fetch Product by Slug dynamically from backend/CMS
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getProductBySlug(slug!),
    enabled: !!slug,
  });

  const isOutOfStock = product?.stockStatus === 'OUT_OF_STOCK' || product?.stockQuantity === 0;

  const whatsappEnquiryUrl = useMemo(() => {
    if (!product) return '';
    const prodName = product.title || product.name || 'Jewellery Piece';
    const prodCode = product.sku || '';
    const customMessage = isOutOfStock
      ? `Hello Sri Ramas Jewellery, I would like to enquire about ${prodName}${
          prodCode ? `, Product Code: ${prodCode}` : ''
        }. I see it is currently Out of Stock. Could you please share details on custom crafting timelines or next availability?`
      : `Hello Sri Ramas Jewellery, I would like to enquire about ${prodName}${
          prodCode ? `, Product Code: ${prodCode}` : ''
        }. Please share further details.`;
    return buildWhatsAppUrl({
      type: 'PRODUCT',
      productTitle: prodName,
      productSku: prodCode,
      customMessage,
    });
  }, [product, isOutOfStock, buildWhatsAppUrl]);

  const handleShare = async () => {
    const prodName = product?.title || product?.name || 'Sri Ramas Jewellery';
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: prodName,
          text: `Discover ${prodName}${product?.sku ? ` (${product.sku})` : ''} at Sri Ramas Jewellery`,
          url: currentUrl,
        });
      } catch {
        // User cancelled share
      }
    } else if (navigator.clipboard && currentUrl) {
      await navigator.clipboard.writeText(currentUrl);
      setCopiedShare(true);
      window.setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  // Multi-media list (Images & Videos)
  const mediaList = useMemo(() => {
    if (!product) return [];
    const list: Array<{ url: string; type: 'IMAGE' | 'VIDEO' }> = [];
    if (product.media && Array.isArray(product.media) && product.media.length > 0) {
      product.media.forEach((m) => {
        if (m.url) list.push({ url: m.url, type: m.type || 'IMAGE' });
      });
    } else {
      (product.images || []).forEach((img) => {
        const u = typeof img === 'string' ? img : img.url;
        if (u) list.push({ url: u, type: 'IMAGE' });
      });
      (product.videos || []).forEach((vid) => {
        if (vid) list.push({ url: vid, type: 'VIDEO' });
      });
    }
    return list;
  }, [product]);

  const currentMedia = mediaList[selectedImageIndex] || mediaList[0] || null;
  const isCurrentVideo = Boolean(
    currentMedia?.type === 'VIDEO' ||
    (currentMedia?.url && /\.(mp4|webm|mov)$/i.test(currentMedia.url))
  );
  const currentImage = currentMedia?.url || '';
  const hasValidImage = Boolean(currentImage) && !imgFailed;
  const purity = (product?.metal?.purity || product?.purity || '').trim();
  const grossWeight = product?.metal?.grossWeightGrams ?? product?.grossWeightGrams ?? null;
  const netWeight = product?.metal?.netWeightGrams ?? product?.netMetalWeightGrams ?? null;
  const stoneWeight = product?.stoneWeightGrams ?? (product?.categoryAttributes?.stoneWeightGrams ? Number(product.categoryAttributes.stoneWeightGrams) : null);

  // Dynamically assemble all available specification rows from CMS data
  const specRows = useMemo(() => {
    if (!product) return [];
    const rows: { label: string; value: React.ReactNode }[] = [];
    const catAttrs = (product.categoryAttributes as Record<string, any>) || {};

    // 1. Product Code (SKU)
    if (product.sku) {
      rows.push({ label: 'Product Code', value: product.sku });
    }

    // 2. Precious Metal
    const metal = (product.metalType || product.metal?.metalType || '').toUpperCase();
    if (metal) {
      rows.push({ label: 'Precious Metal', value: metal });
    }

    // 3. Purity, Fineness & Hallmark based on Metal Type
    if (metal === 'GOLD') {
      const goldMap: Record<string, string> = {
        '24K': '24K (999 Purity) Pure Gold',
        '22K': '22K (916 Purity) Hallmark Gold',
        '20K': '20K (833 Purity) Gold',
        '18K': '18K (750 Purity) Fine Gold',
        '14K': '14K (585 Purity) Gold',
        '9K': '9K (375 Purity) Gold',
      };
      if (purity) {
        const text = goldMap[purity] || `${purity} Gold`;
        rows.push({
          label: 'Gold Karat & Purity',
          value: `${text}${product.hallmarkStatus ? ' • BIS 916 Hallmarked' : ''}`,
        });
      } else if (product.hallmarkStatus) {
        rows.push({ label: 'Hallmark Status', value: 'BIS 916 Hallmarked' });
      }
    } else if (metal === 'SILVER') {
      const silverMap: Record<string, string> = {
        '999': '999 Fine Silver (999/1000)',
        '925': '925 Sterling Silver (925/1000)',
        '900': '900 Coin Silver (900/1000)',
        '835': '835 Silver Alloy (835/1000)',
        '800': '800 Silver Alloy (800/1000)',
      };
      if (purity) {
        rows.push({
          label: 'Silver Fineness',
          value: silverMap[purity] || `${purity} / 1000 Fineness`,
        });
      }
    } else if (metal === 'PLATINUM') {
      const ptMap: Record<string, string> = {
        'Pt950': 'Pt950 • 95% Pure Platinum',
        'Pt900': 'Pt900 • 90% Pure Platinum',
        'Pt850': 'Pt850 • 85% Pure Platinum',
        'Pt999': 'Pt999 • 99.9% Pure Platinum',
      };
      rows.push({
        label: 'Platinum Hallmark Grade',
        value: ptMap[purity] || (purity ? `Pt${purity.replace(/\D/g, '')}` : 'Pt950 • 95% Pure Platinum'),
      });
    } else if (metal === 'DIAMOND') {
      const dDetails = product.metalDetails?.diamondDetails || product.metalDetails?.diamond || (product.categoryAttributes as any) || {};
      const caratVal = dDetails.caratWeight || dDetails.totalCaratWeight || product.stoneWeightGrams;
      if (caratVal) {
        rows.push({ label: 'Diamond Carat Weight', value: `${caratVal} ct` });
      }
      if (dDetails.cut || dDetails.diamondCut) {
        rows.push({ label: 'Diamond Cut', value: String(dDetails.cut || dDetails.diamondCut).replace(/_/g, ' ') });
      }
      if (dDetails.color || dDetails.diamondColor) {
        rows.push({ label: 'Diamond Colour', value: String(dDetails.color || dDetails.diamondColor) });
      }
      if (dDetails.clarity || dDetails.diamondClarity) {
        rows.push({ label: 'Diamond Clarity', value: String(dDetails.clarity || dDetails.diamondClarity) });
      }
      if (dDetails.shape || dDetails.diamondShape) {
        rows.push({ label: 'Diamond Shape', value: String(dDetails.shape || dDetails.diamondShape).replace(/_/g, ' ') });
      }
      if (dDetails.certification || dDetails.diamondCertification || product.certification?.agency) {
        rows.push({
          label: 'Diamond Certification',
          value: String(dDetails.certification || dDetails.diamondCertification || product.certification?.agency),
        });
      }
      if (dDetails.stoneCount) {
        rows.push({ label: 'Number of Diamonds', value: `${dDetails.stoneCount} Pieces` });
      }
      if (dDetails.settingType || dDetails.diamondSettingType) {
        rows.push({ label: 'Setting Type', value: String(dDetails.settingType || dDetails.diamondSettingType).replace(/_/g, ' ') });
      }
    } else if (purity) {
      rows.push({
        label: 'Purity',
        value: `${purity}${product.hallmarkStatus ? ' • Hallmarked' : ''}`,
      });
    }

    // 4. Product Classification & Category Details
    const rawClass = product.classification || product.collectionType;
    if (rawClass) {
      const classMap: Record<string, string> = {
        BRIDAL: 'Bridal Collection',
        TRADITIONAL: 'Traditional Heritage',
        DAILY_WEAR: 'Daily Wear',
        HERITAGE: 'Traditional Heritage',
        TEMPLE: 'Temple Heritage',
        FESTIVE: 'Festive Wear',
      };
      rows.push({
        label: 'Product Classification',
        value: classMap[rawClass.toUpperCase()] || rawClass,
      });
    }

    if (product.category?.name) {
      rows.push({ label: 'Main Category', value: product.category.name });
    }
    if (product.subcategory?.name) {
      rows.push({ label: 'Subcategory / Style', value: product.subcategory.name });
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
      <SEO
        title={`${product.title || product.name || 'Jewellery Piece'}`}
        description={
          product.description ||
          `Handcrafted ${product.metalType || 'Gold'} jewellery (${product.sku}) featuring authentic heritage craftsmanship, hallmarked purity, and showroom viewing at Sri Ramas Jewellery.`
        }
        image={currentImage}
        type="product"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Catalogue', path: '/products' },
          ...(product.category
            ? [{ name: product.category.name, path: `/products?categoryId=${product.categoryId}` }]
            : []),
          { name: product.title || product.name || 'Piece', path: `/products/${product.slug}` }
        ]}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.title || product.name,
          description:
            product.description ||
            `Handcrafted ${product.metalType || 'Gold'} jewellery from Sri Ramas Jewellery.`,
          image: currentImage,
          sku: product.sku,
          category: product.category?.name,
          material: product.metalType || 'Gold',
          brand: {
            '@type': 'Brand',
            name: 'Sri Ramas Jewellery'
          },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'INR',
            availability: isOutOfStock
              ? 'https://schema.org/OutOfStock'
              : 'https://schema.org/InStock',
            seller: {
              '@type': 'JewelryStore',
              name: 'Sri Ramas Jewellery',
              telephone: '+91 78711 66317'
            }
          }
        }}
      />

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
              onClick={() => hasValidImage && !isCurrentVideo && setIsZoomOpen(true)}
              className={`relative aspect-square w-full rounded-2xl overflow-hidden border border-gold-300/60 shadow-md bg-[#FAF6F0] group flex items-center justify-center ${
                hasValidImage && !isCurrentVideo ? 'cursor-zoom-in' : ''
              }`}
            >
              {hasValidImage ? (
                isCurrentVideo ? (
                  <video
                    src={currentImage}
                    controls
                    playsInline
                    className="w-full h-full object-contain object-center bg-black"
                  />
                ) : (
                  <>
                    <img
                      src={currentImage}
                      alt={product.title || product.name}
                      onError={() => setImgFailed(true)}
                      className={`w-full h-full block object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105 select-none ${
                        isOutOfStock ? 'filter grayscale contrast-[0.88] opacity-80' : ''
                      }`}
                    />
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <ZoomIn className="w-4 h-4" />
                    </div>
                  </>
                )
              ) : (
                <div className="w-full h-full bg-[#FAF5EC] flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#C49A3A]/20 border border-[#C49A3A]/50 flex items-center justify-center mb-4">
                    <Gem className="w-8 h-8 text-[#9A7B38]" />
                  </div>
                  <p className="font-serif text-sm uppercase tracking-[0.2em] text-[#8C6D2D] font-semibold">
                    {product.category?.name || 'Sri Ramas Heritage'}
                  </p>
                  <p className="text-xs text-stone-500 mt-2 max-w-xs">
                    Studio photograph awaits admin upload for this catalogue piece.
                  </p>
                </div>
              )}

              {/* Status Badge Overlay: Out of Stock takes precedence with B&W / Stone UI */}
              {isOutOfStock ? (
                <div className="absolute top-3 left-3 z-20">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/95 text-stone-100 border border-stone-400/60 text-[11px] font-bold uppercase tracking-wider shadow-xl backdrop-blur-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span>Out of Stock</span>
                  </span>
                </div>
              ) : purity ? (
                <div className="absolute top-3 left-3 bg-[#380711]/90 backdrop-blur-xs text-[#F5DE9C] text-[11px] font-bold px-3 py-1 rounded-full border border-[#C49A3A]/40 flex items-center gap-1.5 shadow-sm">
                  {product.hallmarkStatus && <ShieldCheck className="w-3.5 h-3.5 text-[#C49A3A]" />}
                  <span>
                    {purity}
                    {product.hallmarkStatus ? ' Hallmarked' : ''}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Thumbnail Gallery Navigation */}
            {mediaList.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
                {mediaList.map((med, idx) => {
                  const isVid = med.type === 'VIDEO' || /\.(mp4|webm|mov)$/i.test(med.url);
                  return (
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
                      {isVid ? (
                        <div className="w-full h-full bg-stone-900 flex items-center justify-center text-white">
                          <Play className="w-6 h-6 text-gold-400 fill-gold-400" />
                        </div>
                      ) : (
                        <img
                          src={med.url}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover object-center bg-stone-100"
                        />
                      )}
                    </button>
                  );
                })}
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
              DYNAMIC SPECIFICATIONS ACCORDION SECTION
              - Compact by default: click to open or close with down/up arrow.
            */}
            <div
              className={`bg-white rounded-2xl border transition-all duration-300 shadow-xs overflow-hidden ${
                isSpecsOpen
                  ? 'border-[#C49A3A] shadow-md ring-1 ring-[#C49A3A]/30'
                  : 'border-stone-200 hover:border-gold-300 hover:shadow-sm'
              }`}
            >
              <button
                type="button"
                onClick={() => setIsSpecsOpen((prev) => !prev)}
                aria-expanded={isSpecsOpen}
                className="w-full px-5 py-4 bg-stone-50/90 hover:bg-gold-50/40 transition-colors flex items-center justify-between gap-3 text-left cursor-pointer group/spec"
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <Award className="w-4 h-4 text-[#C49A3A] shrink-0" />
                  <span className="font-serif font-bold text-sm sm:text-base text-[#380711] tracking-wide">
                    Product Specifications
                  </span>
                  {specRows.length > 0 && (
                    <span className="text-[11px] font-semibold text-stone-600 bg-stone-200/80 group-hover/spec:bg-gold-100 group-hover/spec:text-gold-900 px-2.5 py-0.5 rounded-full transition-colors">
                      {specRows.length} details
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {product.hallmarkStatus && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      BIS 916 Verified
                    </span>
                  )}
                  <span className="w-8 h-8 rounded-full bg-stone-100 group-hover/spec:bg-gold-100 flex items-center justify-center transition-all duration-300">
                    <ChevronDown
                      className={`w-4 h-4 text-burgundy-900 transition-transform duration-300 ${
                        isSpecsOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </span>
                </div>
              </button>

              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isSpecsOpen
                    ? 'max-h-[900px] opacity-100 border-t border-stone-200'
                    : 'max-h-0 opacity-0 border-t-0'
                }`}
              >
                {specRows.length > 0 ? (
                  <dl className="divide-y divide-stone-100 text-xs sm:text-sm bg-white">
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
                  <div className="p-5 text-center text-xs text-stone-500 italic bg-white">
                    Hallmark and gram weight details are verified on piece tag — enquire with our showroom specialists.
                  </div>
                )}
              </div>
            </div>

            {/* 
              ENQUIRY ACTION BUTTONS
              1. WhatsApp Enquiry: High-contrast WhatsApp Green (#25D366) with bold white text.
                 Prefilled message: "Hello Sri Ramas Jewellery, I would like to enquire about [Product Name], Product Code: [Product Code]. Please share further details."
              2. Call Showroom: High-contrast burgundy and antique gold styling with active tel: link.
              3. Enquire About This Product: Formal showcase contact form.
              4. Share Product: Native share or clipboard link copy.
            */}
            <ScrollReveal variant="fade-up" immediate>
              {/* Out of Stock Notice Banner */}
              {isOutOfStock && (
                <div className="p-4 rounded-xl bg-stone-100 border border-stone-300 text-stone-800 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
                  <span className="text-lg leading-none">ℹ️</span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 uppercase tracking-wider text-xs">Currently Out of Showroom Stock</span>
                      <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-100 text-[10px] font-bold uppercase tracking-wider">
                        Out of Stock
                      </span>
                    </div>
                    <p className="text-stone-600 leading-relaxed text-xs">
                      This design is currently unavailable for immediate showroom viewing. It can be handcrafted to order or pre-reserved. Enquire below for making timelines and gold rate confirmation.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2">
                {/* Primary Action Buttons: WhatsApp & Call Showroom */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* WhatsApp Enquiry Button */}
                  <a
                    href={whatsappEnquiryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Enquire about this product on WhatsApp"
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <MessageCircle className="w-5 h-5 text-white shrink-0 fill-current" />
                    <span>{isOutOfStock ? 'Enquire Out of Stock / Custom Order' : 'WhatsApp Enquiry'}</span>
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

                {/* Secondary Action Buttons: Formal Showcase Enquiry Form & Share */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Link
                    to={{
                      pathname: '/contact',
                      search: `?enquiryType=PRODUCT&productSku=${encodeURIComponent(product.sku || '')}&productName=${encodeURIComponent(product.title || product.name || '')}`,
                    }}
                    state={{
                      product: {
                        id: product._id,
                        name: product.title || product.name,
                        sku: product.sku,
                        category: (product as any).category?.name || '',
                        metalType: product.metalType,
                        purity: product.purity,
                        slug: product.slug,
                        url: typeof window !== 'undefined' ? window.location.href : `/products/${product.slug}`,
                      },
                    }}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm tracking-wide bg-burgundy-900/90 hover:bg-burgundy-800 text-gold-100 border border-gold-500/30 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <MessageSquare className="w-4 h-4 text-gold-400 shrink-0" />
                    <span>Enquire via Form</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm tracking-wide bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {copiedShare ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-emerald-700 font-bold">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 text-stone-600 shrink-0" />
                        <span>Share Product</span>
                      </>
                    )}
                  </button>
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
