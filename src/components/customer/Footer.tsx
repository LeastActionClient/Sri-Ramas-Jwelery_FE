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
    <footer className="bg-burgundy-950 text-gold-100 border-t-2 border-gold-600/40 mt-auto">
      {/* Trust Badges Bar */}
      <div className="border-b border-gold-800/50 bg-burgundy-900/60 py-6 px-4">
        <StaggerReveal staggerMs={75} className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="group flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gold-400/10 border border-gold-400/30 group-hover:border-gold-400 group-hover:bg-gold-400/20 flex items-center justify-center text-gold-300 transition-all duration-300">
              <Award className="w-6 h-6 transition-transform duration-300 group-hover:scale-105" />
            </div>
            <h4 className="font-serif font-bold text-sm text-gold-200">Since 1987 Legacy</h4>
            <p className="text-xs text-gold-300/70">39+ Years of Unwavering Trust</p>
          </div>

          <div className="group flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gold-400/10 border border-gold-400/30 group-hover:border-gold-400 group-hover:bg-gold-400/20 flex items-center justify-center text-gold-300 transition-all duration-300">
              <ShieldCheck className="w-6 h-6 transition-transform duration-300 group-hover:scale-105" />
            </div>
            <h4 className="font-serif font-bold text-sm text-gold-200">100% BIS Hallmarked</h4>
            <p className="text-xs text-gold-300/70">Certified 916 Gold with Unique HUID</p>
          </div>

          <div className="group flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gold-400/10 border border-gold-400/30 group-hover:border-gold-400 group-hover:bg-gold-400/20 flex items-center justify-center text-gold-300 transition-all duration-300">
              <Gem className="w-6 h-6 transition-transform duration-300 group-hover:scale-105" />
            </div>
            <h4 className="font-serif font-bold text-sm text-gold-200">Certified Diamonds</h4>
            <p className="text-xs text-gold-300/70">Conflict-Free IGI &amp; SGL Graded Gems</p>
          </div>

          <div className="group flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gold-400/10 border border-gold-400/30 group-hover:border-gold-400 group-hover:bg-gold-400/20 flex items-center justify-center text-gold-300 transition-all duration-300">
              <Scale className="w-6 h-6 transition-transform duration-300 group-hover:scale-105" />
            </div>
            <h4 className="font-serif font-bold text-sm text-gold-200">Exact Weight Precision</h4>
            <p className="text-xs text-gold-300/70">Certified Purity &amp; Exact Gram Specifications</p>
          </div>
        </StaggerReveal>
      </div>

      {/* Main 4-Column Footer Links & Showroom Info */}
      <ScrollReveal variant="fade-up" distance={16} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Column 1: Brand Identity */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gold-400 bg-burgundy-900 p-0.5 shadow-luxury-gold shrink-0">
                <img
                  src="/logo.jpg"
                  alt="Sri Ramas Jewellery"
                  className="w-full h-full object-cover object-center rounded-full"
                />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold tracking-wider text-gold-100">
                  SRI RAMAS JEWELLERY
                </h3>
                <p className="text-xs text-gold-400 font-serif">ஸ்ரீ ராமாஸ் ஜுவல்லரி • Since 1987</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gold-200/80 leading-relaxed">
              Established in 1987, Sri Ramas Jewellery is a distinguished South Indian destination for temple heirlooms, bridal gold ornaments, silver treasures, and certified diamonds.
            </p>

            <div className="bg-burgundy-900/80 border border-gold-600/30 rounded-lg p-3 text-xs text-gold-300/80 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-gold-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Showroom Showcase &amp; Advisory Platform</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Online checkout, shopping carts, and payment processing are disabled platform-wide. Every selection and enrolment is personally guided at our physical showrooms.
              </p>
            </div>
          </div>

          {/* Column 2: Jewellery Categories */}
          <div className="lg:col-span-2">
            <h4 className="font-serif font-bold text-sm tracking-wider uppercase text-gold-300 mb-4 border-b border-gold-800 pb-2">
              Jewellery Categories
            </h4>
            <ul className="space-y-2.5 text-xs text-gold-200/85">
              {activeFooterCategories.length > 0 ? (
                activeFooterCategories.map((category) => (
                  <li key={category._id}>
                    <Link
                      to={`/products?categoryId=${category._id}`}
                      className="hover:text-gold-300 transition-colors inline-block"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li>
                  <Link to="/products" className="hover:text-gold-300 transition-colors">
                    Complete Collection Showcase
                  </Link>
                </li>
              )}
              <li className="pt-1">
                <Link to="/categories" className="hover:text-gold-300 transition-colors font-semibold text-gold-400">
                  View All Categories →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Services & Programmes */}
          <div className="lg:col-span-3">
            <h4 className="font-serif font-bold text-sm tracking-wider uppercase text-gold-300 mb-4 border-b border-gold-800 pb-2">
              Services &amp; Programmes
            </h4>
            <ul className="space-y-2.5 text-xs text-gold-200/85">
              <li>
                <Link to="/schemes" className="hover:text-gold-300 transition-colors">
                  Jewellery Savings Schemes
                </Link>
              </li>
              <li>
                <Link to="/digigold" className="hover:text-gold-300 transition-colors">
                  DigiGold Rates &amp; Calculator
                </Link>
              </li>
              <li>
                <Link to="/digisilver" className="hover:text-gold-300 transition-colors">
                  DigiSilver Rates &amp; Calculator
                </Link>
              </li>
              <li>
                <Link to="/rates" className="hover:text-gold-300 transition-colors">
                  Live Gold &amp; Silver Bullion Rates
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-gold-300 transition-colors">
                  Our Heritage &amp; Craftsmanship
                </Link>
              </li>
              <li>
                <Link to="/stores" className="hover:text-gold-300 transition-colors">
                  Showroom Directory
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Showroom Details & Contact */}
          <div className="lg:col-span-3">
            <h4 className="font-serif font-bold text-sm tracking-wider uppercase text-gold-300 mb-4 border-b border-gold-800 pb-2">
              {primaryStore?.storeName || primaryStore?.name || 'Showroom Contact'}
            </h4>
            <div className="space-y-3 text-xs text-gold-200/85">
              {storeAddress ? (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{storeAddress}</span>
                </div>
              ) : (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                  <Link to="/stores" className="hover:text-gold-300 underline">
                    View Showroom Directory
                  </Link>
                </div>
              )}

              {primaryPhones.length > 0 && (
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-x-2 gap-y-1">
                    {primaryPhones.map((num, idx) => (
                      <a key={idx} href={`tel:${num.replace(/\s+/g, '')}`} className="hover:text-gold-300">
                        {num}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {whatsappNumber && (
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                  <a
                    href={showroomWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gold-300 font-medium text-gold-200"
                  >
                    WhatsApp Showroom Desk →
                  </a>
                </div>
              )}

              {primaryStore?.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-gold-400 shrink-0" />
                  <a href={`mailto:${primaryStore.email}`} className="hover:text-gold-300 break-all">
                    {primaryStore.email}
                  </a>
                </div>
              )}

              {hasOpeningHours && (
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                  <span>{primaryStore?.openingHours}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div className="border-t border-gold-800/40 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gold-400/80">
          <div>
            © 1987–2026 <span className="text-gold-300 font-semibold">Sri Ramas Jewellery</span>. All Rights Reserved. Master Crafted in India.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/privacy-policy" className="hover:text-gold-200 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-gold-200 transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link to="/admin/login" className="hover:text-gold-200 flex items-center gap-1 transition-colors">
              <Lock className="w-3 h-3 text-gold-400" />
              <span>Administrative Portal</span>
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </footer>
  );
};
