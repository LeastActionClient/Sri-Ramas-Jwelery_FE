import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Award,
  Gem,
  Scale,
  Lock,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';
import { categoriesApi } from '@/services/api/categories.api';
import { ScrollReveal, StaggerReveal } from '@/components/motion';
import { useStoreWhatsApp } from '@/hooks/useStoreWhatsApp';

export const Footer: React.FC = () => {
  const { primaryStore, whatsappNumber, buildWhatsAppUrl } = useStoreWhatsApp();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
  });

  const activeFooterCategories = categories
    .filter((category) => category.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? a.displayOrder ?? 0) - (b.sortOrder ?? b.displayOrder ?? 0))
    .slice(0, 6);

  const formatCategoryName = (name: string) => {
    if (!name) return '';
    const trimmed = name.trim();
    if (trimmed.toLowerCase() === 'new') return 'New Arrivals';
    return trimmed
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const storeAddress = primaryStore
    ? [
        primaryStore.addressLine1 || primaryStore.address,
        primaryStore.addressLine2,
        [primaryStore.city, primaryStore.state].filter(Boolean).join(', '),
        primaryStore.postalCode || primaryStore.pincode,
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  const primaryPhones =
    primaryStore?.phoneNumbers && primaryStore.phoneNumbers.length > 0
      ? primaryStore.phoneNumbers
      : primaryStore?.phone
        ? [primaryStore.phone]
        : [];

  const hasOpeningHours = Boolean(
    primaryStore?.openingHours &&
      primaryStore.openingHours.trim() &&
      !primaryStore.openingHours.toLowerCase().includes('confirm with showroom') &&
      !primaryStore.openingHours.toLowerCase().includes('to be confirmed')
  );

  const showroomWhatsAppUrl = buildWhatsAppUrl({
    type: 'SHOWROOM',
    storeName: primaryStore?.storeName || primaryStore?.name,
  });

  return (
    <footer className="bg-[#180306] text-gold-100 border-t-2 border-[#C49A3A]/40 mt-auto">
      {/* Trust Badges Bar */}
      <div className="border-b border-[#C49A3A]/25 bg-gradient-to-r from-[#180306] via-[#2A050D] to-[#180306] py-7 px-4">
        <StaggerReveal staggerMs={75} className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="group flex flex-col items-center gap-2.5 p-2">
            <div className="w-13 h-13 p-3 rounded-full bg-gradient-to-br from-[#C49A3A]/20 to-[#180306] border border-[#C49A3A]/40 group-hover:border-[#FFE28A] group-hover:bg-[#C49A3A]/25 flex items-center justify-center text-[#F5DE9C] transition-all duration-300 shadow-md">
              <Award className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 text-[#FFE28A]" />
            </div>
            <h4 className="font-serif font-bold text-sm tracking-wide text-[#F5DE9C] group-hover:text-white transition-colors">
              Since 1987 Legacy
            </h4>
            <p className="text-[11px] sm:text-xs text-gold-300/75 leading-tight">
              39+ Years of Unwavering Trust
            </p>
          </div>

          <div className="group flex flex-col items-center gap-2.5 p-2">
            <div className="w-13 h-13 p-3 rounded-full bg-gradient-to-br from-[#C49A3A]/20 to-[#180306] border border-[#C49A3A]/40 group-hover:border-[#FFE28A] group-hover:bg-[#C49A3A]/25 flex items-center justify-center text-[#F5DE9C] transition-all duration-300 shadow-md">
              <ShieldCheck className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 text-[#FFE28A]" />
            </div>
            <h4 className="font-serif font-bold text-sm tracking-wide text-[#F5DE9C] group-hover:text-white transition-colors">
              100% BIS Hallmarked
            </h4>
            <p className="text-[11px] sm:text-xs text-gold-300/75 leading-tight">
              Certified 916 Gold with Unique HUID
            </p>
          </div>

          <div className="group flex flex-col items-center gap-2.5 p-2">
            <div className="w-13 h-13 p-3 rounded-full bg-gradient-to-br from-[#C49A3A]/20 to-[#180306] border border-[#C49A3A]/40 group-hover:border-[#FFE28A] group-hover:bg-[#C49A3A]/25 flex items-center justify-center text-[#F5DE9C] transition-all duration-300 shadow-md">
              <Gem className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 text-[#FFE28A]" />
            </div>
            <h4 className="font-serif font-bold text-sm tracking-wide text-[#F5DE9C] group-hover:text-white transition-colors">
              Certified Diamonds
            </h4>
            <p className="text-[11px] sm:text-xs text-gold-300/75 leading-tight">
              Conflict-Free IGI &amp; SGL Graded Gems
            </p>
          </div>

          <div className="group flex flex-col items-center gap-2.5 p-2">
            <div className="w-13 h-13 p-3 rounded-full bg-gradient-to-br from-[#C49A3A]/20 to-[#180306] border border-[#C49A3A]/40 group-hover:border-[#FFE28A] group-hover:bg-[#C49A3A]/25 flex items-center justify-center text-[#F5DE9C] transition-all duration-300 shadow-md">
              <Scale className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 text-[#FFE28A]" />
            </div>
            <h4 className="font-serif font-bold text-sm tracking-wide text-[#F5DE9C] group-hover:text-white transition-colors">
              Exact Weight Precision
            </h4>
            <p className="text-[11px] sm:text-xs text-gold-300/75 leading-tight">
              Certified Purity &amp; Exact Gram Specs
            </p>
          </div>
        </StaggerReveal>
      </div>

      {/* Main 4-Column Footer Links & Showroom Info */}
      <ScrollReveal variant="fade-up" distance={16} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Column 1: Brand Identity */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#C49A3A] bg-[#24050B] p-0.5 shadow-lg shadow-black/50 shrink-0">
                <img
                  src="/logo.jpg"
                  alt="Sri Ramas Jewellery"
                  className="w-full h-full object-cover object-center rounded-full"
                />
              </div>
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#FAF7F0] via-[#FFE28A] to-[#F5DE9C]">
                  SRI RAMAS JEWELLERY
                </h3>
                <p className="text-xs text-[#C49A3A] font-serif tracking-wide">ஸ்ரீ ராமாஸ் ஜுவல்லரி • Since 1987</p>
              </div>
            </div>

            <p className="text-xs sm:text-[13px] text-gold-200/80 leading-relaxed font-sans">
              Established in 1987, Sri Ramas Jewellery is a distinguished South Indian destination for authentic temple heirlooms, bridal gold ornaments, silver treasures, and certified solitaires.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C49A3A]/10 border border-[#C49A3A]/30 text-[11px] font-medium text-[#F5DE9C]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                BIS 916 Hallmarked
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C49A3A]/10 border border-[#C49A3A]/30 text-[11px] font-medium text-[#F5DE9C]">
                South Indian Heritage
              </span>
            </div>
          </div>

          {/* Column 2: Jewellery Categories */}
          <div className="lg:col-span-2">
            <div>
              <h4 className="font-serif font-bold text-sm tracking-[0.14em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#F5DE9C] to-[#C49A3A]">
                Categories
              </h4>
              <div className="h-0.5 w-8 bg-gradient-to-r from-[#C49A3A] to-transparent mt-1.5 mb-4" />
            </div>
            <ul className="space-y-2.5 text-xs sm:text-[13px]">
              {activeFooterCategories.length > 0 ? (
                activeFooterCategories.map((category) => (
                  <li key={category._id}>
                    <Link
                      to={`/products?categoryId=${category._id}`}
                      className="group inline-flex items-center gap-2 text-gold-200/80 hover:text-[#FFE28A] transition-all duration-200 hover:translate-x-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C49A3A]/60 group-hover:bg-[#FFE28A] group-hover:scale-125 transition-all shrink-0" />
                      <span>{formatCategoryName(category.name)}</span>
                    </Link>
                  </li>
                ))
              ) : (
                <li>
                  <Link
                    to="/products"
                    className="group inline-flex items-center gap-2 text-gold-200/80 hover:text-[#FFE28A] transition-all duration-200 hover:translate-x-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C49A3A]/60 group-hover:bg-[#FFE28A] transition-all shrink-0" />
                    <span>Complete Collections</span>
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Column 3: Services & Programmes */}
          <div className="lg:col-span-3">
            <div>
              <h4 className="font-serif font-bold text-sm tracking-[0.14em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#F5DE9C] to-[#C49A3A]">
                Services &amp; Programmes
              </h4>
              <div className="h-0.5 w-8 bg-gradient-to-r from-[#C49A3A] to-transparent mt-1.5 mb-4" />
            </div>
            <ul className="space-y-2.5 text-xs sm:text-[13px]">
              <li>
                <Link
                  to="/schemes"
                  className="group inline-flex items-center gap-2 text-gold-200/80 hover:text-[#FFE28A] transition-all duration-200 hover:translate-x-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C49A3A]/60 group-hover:bg-[#FFE28A] group-hover:scale-125 transition-all shrink-0" />
                  <span>Jewellery Savings Schemes</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/digigold"
                  className="group inline-flex items-center gap-2 text-gold-200/80 hover:text-[#FFE28A] transition-all duration-200 hover:translate-x-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C49A3A]/60 group-hover:bg-[#FFE28A] group-hover:scale-125 transition-all shrink-0" />
                  <span>DigiGold Rates &amp; Calculator</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/digisilver"
                  className="group inline-flex items-center gap-2 text-gold-200/80 hover:text-[#FFE28A] transition-all duration-200 hover:translate-x-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C49A3A]/60 group-hover:bg-[#FFE28A] group-hover:scale-125 transition-all shrink-0" />
                  <span>DigiSilver Rates &amp; Calculator</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="group inline-flex items-center gap-2 text-gold-200/80 hover:text-[#FFE28A] transition-all duration-200 hover:translate-x-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C49A3A]/60 group-hover:bg-[#FFE28A] group-hover:scale-125 transition-all shrink-0" />
                  <span>Our Heritage &amp; Craftsmanship</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="group inline-flex items-center gap-2 text-gold-200/80 hover:text-[#FFE28A] transition-all duration-200 hover:translate-x-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C49A3A]/60 group-hover:bg-[#FFE28A] group-hover:scale-125 transition-all shrink-0" />
                  <span>Contact &amp; Showroom Advisory</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Showroom Details & Contact */}
          <div className="lg:col-span-3 space-y-3.5">
            <div>
              <h4 className="font-serif font-bold text-sm tracking-[0.14em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#F5DE9C] to-[#C49A3A]">
                {primaryStore?.storeName || primaryStore?.name || 'Showroom Contact'}
              </h4>
              <div className="h-0.5 w-8 bg-gradient-to-r from-[#C49A3A] to-transparent mt-1.5 mb-4" />
            </div>

            <div className="space-y-3 text-xs sm:text-[13px] text-gold-200/85">
              {storeAddress ? (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#C49A3A] shrink-0 mt-0.5" />
                  <span className="leading-relaxed text-gold-200/90">{storeAddress}</span>
                </div>
              ) : (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#C49A3A] shrink-0 mt-0.5" />
                  <Link to="/contact" className="hover:text-[#FFE28A] underline">
                    Showroom Advisory &amp; Location
                  </Link>
                </div>
              )}

              {primaryPhones.length > 0 && (
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-[#C49A3A] shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-x-2 gap-y-1">
                    {primaryPhones.map((num, idx) => (
                      <a
                        key={idx}
                        href={`tel:${num.replace(/\s+/g, '')}`}
                        className="hover:text-[#FFE28A] text-gold-100 font-medium transition-colors"
                      >
                        {num}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {whatsappNumber && (
                <div className="pt-1">
                  <a
                    href={showroomWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] hover:text-white transition-all duration-200 font-medium text-xs sm:text-[13px] group shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366] group-hover:scale-110 transition-transform" />
                    <span>WhatsApp Showroom Desk</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              )}

              {primaryStore?.email && (
                <div className="flex items-center gap-2.5 pt-0.5">
                  <Mail className="w-4 h-4 text-[#C49A3A] shrink-0" />
                  <a href={`mailto:${primaryStore.email}`} className="hover:text-[#FFE28A] break-all transition-colors">
                    {primaryStore.email}
                  </a>
                </div>
              )}

              {hasOpeningHours && (
                <div className="flex items-start gap-2.5 text-gold-300/80">
                  <Clock className="w-4 h-4 text-[#C49A3A] shrink-0 mt-0.5" />
                  <span>{primaryStore?.openingHours}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div className="border-t border-[#C49A3A]/25 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] sm:text-xs text-gold-300/70">
          <div>
            © 1987–2026 <span className="text-gold-200 font-semibold">Sri Ramas Jewellery</span>. All Rights Reserved. Master Crafted in India.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link to="/privacy-policy" className="hover:text-[#FFE28A] transition-colors">
              Privacy Policy
            </Link>
            <span className="text-[#C49A3A]/40">•</span>
            <Link to="/terms" className="hover:text-[#FFE28A] transition-colors">
              Terms of Service
            </Link>
            <span className="text-[#C49A3A]/40">•</span>
            <Link to="/admin/login" className="hover:text-[#FFE28A] flex items-center gap-1.5 transition-colors">
              <Lock className="w-3.5 h-3.5 text-[#C49A3A]" />
              <span>Administrative Portal</span>
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </footer>
  );
};
