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
  ExternalLink,
  FileText,
  Navigation,
} from 'lucide-react';
import { categoriesApi } from '@/services/api/categories.api';
import { ScrollReveal, StaggerReveal } from '@/components/motion';
import { useStoreWhatsApp } from '@/hooks/useStoreWhatsApp';

export const Footer: React.FC = () => {
  const { primaryStore, buildWhatsAppUrl } = useStoreWhatsApp();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
  });

  const activeFooterCategories = categories
    .filter((category) => category.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? a.displayOrder ?? 0) - (b.sortOrder ?? b.displayOrder ?? 0))
    .slice(0, 5);

  const formatCategoryName = (name: string) => {
    if (!name) return '';
    const trimmed = name.trim();
    if (trimmed.toLowerCase() === 'new') return 'New Arrivals';
    return trimmed
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Official Verified Client Contact & Store Information
  const callingNumber = '7871166317';
  const displayCallingNumber = '+91 78711 66317';
  const whatsappNumber = '+916382573997';
  const displayWhatsAppNumber = '+91 63825 73997';
  const officialEmail = 'sriramasjewel1987@gmail.com';
  const googleMapsUrl = 'https://maps.app.goo.gl/7sxg7JxUVmCF7CQs5?g_st=iw';

  const storeAddressLines = [
    '18/995, South East Rampart',
    'Near Old Bus Stand',
    'Thanjavur, Tamil Nadu – 613001',
  ];

  const showroomWhatsAppUrl = buildWhatsAppUrl({
    type: 'SHOWROOM',
    storeName: 'Sri Ramas Jewellery',
    phoneNumber: '916382573997',
    customMessage: 'Hello Sri Ramas Jewellery, I would like to make an enquiry regarding your jewellery collections.',
  });

  const socialLinks = [
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/sriramasjewellery?stkn=MW1zbjhlcWp2djRtMA%3D%3D&utm_source=qr',
      ariaLabel: 'Follow Sri Ramas Jewellery on Instagram',
      color: 'hover:text-[#E4405F] hover:border-[#E4405F]/50',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
    },
    {
      name: 'Facebook',
      href: 'https://www.facebook.com/share/1C66ZZMv1E/?mibextid=wwXIfr',
      ariaLabel: 'Follow Sri Ramas Jewellery on Facebook',
      color: 'hover:text-[#1877F2] hover:border-[#1877F2]/50',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'YouTube',
      href: 'https://youtube.com/@sriramasjewellerytnj?si=7H9OjTbr4YQBmNx9',
      ariaLabel: 'Subscribe to Sri Ramas Jewellery on YouTube',
      color: 'hover:text-[#FF0000] hover:border-[#FF0000]/50',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="bg-[#180306] text-gold-100 border-t-2 border-[#C49A3A]/40 mt-auto">
      {/* 1. Trust Badges Bar */}
      <div className="border-b border-[#C49A3A]/25 bg-gradient-to-r from-[#180306] via-[#2A050D] to-[#180306] py-3.5 sm:py-4 px-4">
        <StaggerReveal staggerMs={75} className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 text-center">
          <div className="group flex flex-col items-center gap-1.5 p-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#C49A3A]/20 to-[#180306] border border-[#C49A3A]/40 group-hover:border-[#FFE28A] group-hover:bg-[#C49A3A]/25 flex items-center justify-center text-[#F5DE9C] transition-all duration-300 shadow-md">
              <Award className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-300 group-hover:scale-110 text-[#FFE28A]" />
            </div>
            <h4 className="font-serif font-bold text-sm tracking-wide text-[#F5DE9C] group-hover:text-white transition-colors">
              Since 1987 Legacy
            </h4>
            <p className="text-sm text-gold-300/80 leading-tight">
              Forever Committed to Purity &amp; Trust
            </p>
          </div>

          <div className="group flex flex-col items-center gap-1.5 p-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#C49A3A]/20 to-[#180306] border border-[#C49A3A]/40 group-hover:border-[#FFE28A] group-hover:bg-[#C49A3A]/25 flex items-center justify-center text-[#F5DE9C] transition-all duration-300 shadow-md">
              <ShieldCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-300 group-hover:scale-110 text-[#FFE28A]" />
            </div>
            <h4 className="font-serif font-bold text-sm tracking-wide text-[#F5DE9C] group-hover:text-white transition-colors">
              100% BIS Hallmarked
            </h4>
            <p className="text-sm text-gold-300/80 leading-tight">
              Govt. Registered HM/C-6920329418
            </p>
          </div>

          <div className="group flex flex-col items-center gap-1.5 p-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#C49A3A]/20 to-[#180306] border border-[#C49A3A]/40 group-hover:border-[#FFE28A] group-hover:bg-[#C49A3A]/25 flex items-center justify-center text-[#F5DE9C] transition-all duration-300 shadow-md">
              <Gem className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-300 group-hover:scale-110 text-[#FFE28A]" />
            </div>
            <h4 className="font-serif font-bold text-sm tracking-wide text-[#F5DE9C] group-hover:text-white transition-colors">
              Certified Jewellery
            </h4>
            <p className="text-sm text-gold-300/80 leading-tight">
              IS 1417 : 2016 Gold Quality Standards
            </p>
          </div>

          <div className="group flex flex-col items-center gap-1.5 p-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#C49A3A]/20 to-[#180306] border border-[#C49A3A]/40 group-hover:border-[#FFE28A] group-hover:bg-[#C49A3A]/25 flex items-center justify-center text-[#F5DE9C] transition-all duration-300 shadow-md">
              <Scale className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-300 group-hover:scale-110 text-[#FFE28A]" />
            </div>
            <h4 className="font-serif font-bold text-sm tracking-wide text-[#F5DE9C] group-hover:text-white transition-colors">
              Honesty in Pricing
            </h4>
            <p className="text-sm text-gold-300/80 leading-tight">
              Transparent Rates &amp; Weight Precision
            </p>
          </div>
        </StaggerReveal>
      </div>

      {/* 2. Main 4-Column Footer Layout */}
      <ScrollReveal variant="fade-up" distance={16} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Column 1: Brand Identity & Social Links (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#C49A3A] bg-[#24050B] p-0.5 shadow-lg shadow-black/50 shrink-0">
                <img
                  src="/logo.jpg"
                  alt="Sri Ramas Jewellery"
                  className="w-full h-full object-cover object-center rounded-full"
                />
              </div>
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#FAF7F0] via-[#FFE28A] to-[#F5DE9C]">
                  SRI RAMAS JEWELLERY
                </h3>
                <p className="text-sm text-[#C49A3A] font-serif tracking-wide">ஸ்ரீ ராமாஸ் • Since 1987</p>
              </div>
            </div>

            <p className="text-sm text-gold-200/90 leading-relaxed font-sans">
              Since 1987, forever committed to purity in gold, honesty in pricing, and the trust of generations. Your Sri Ramas — the pride of good fortune.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C49A3A]/10 border border-[#C49A3A]/30 text-sm font-medium text-[#F5DE9C]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                BIS Certified
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C49A3A]/10 border border-[#C49A3A]/30 text-sm font-medium text-[#F5DE9C]">
                GST: 33DANPK0210A1ZK
              </span>
            </div>

            {/* Social Media Links (Horizontal Row, No Wordings) */}
            <div className="pt-1 flex flex-wrap items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.ariaLabel}
                  title={social.name}
                  className={`w-9 h-9 rounded-full bg-[#24050B] border border-[#C49A3A]/30 text-gold-200 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm ${social.color}`}
                >
                  <span className="shrink-0">{social.icon}</span>
                </a>
              ))}
              <a
                href={showroomWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp Enquiry Desk"
                title="WhatsApp Enquiry Desk"
                className="w-9 h-9 rounded-full bg-[#25D366]/15 hover:bg-[#25D366] border border-[#25D366]/40 text-[#25D366] hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Contact Information & Showroom (3 cols on lg) */}
          <div className="lg:col-span-3 space-y-2.5">
            <div>
              <h4 className="font-serif font-bold text-sm tracking-[0.14em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#F5DE9C] to-[#C49A3A]">
                Contact &amp; Showroom
              </h4>
              <div className="h-0.5 w-8 bg-gradient-to-r from-[#C49A3A] to-transparent mt-1 mb-2.5" />
            </div>

            <div className="space-y-2 text-sm text-gold-200/90">
              {/* Clickable Full Address linking directly to Google Maps */}
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Click to open Sri Ramas Jewellery in Google Maps"
                className="group/addr flex items-start gap-2.5 p-2 rounded-lg bg-[#24050B]/60 hover:bg-[#2E070F] border border-[#C49A3A]/30 hover:border-[#FFE28A]/60 transition-all duration-200 cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-[#FFE28A] shrink-0 mt-0.5 group-hover/addr:scale-110 transition-transform" />
                <div className="space-y-0.5 text-sm">
                  <div className="flex items-center gap-1.5">
                    <strong className="text-[#FFE28A] text-sm font-semibold">Store Address:</strong>
                    <Navigation className="w-3 h-3 text-[#FFE28A] opacity-75 group-hover/addr:translate-x-0.5 transition-transform" />
                  </div>
                  {storeAddressLines.map((line, idx) => (
                    <div key={idx} className="text-gold-100/90 group-hover/addr:text-white transition-colors leading-tight text-sm">
                      {line}
                    </div>
                  ))}
                  <span className="inline-block pt-0.5 text-sm text-[#D4AF60] group-hover/addr:underline">
                    View on Google Maps →
                  </span>
                </div>
              </a>

              {/* Calling Number */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#C49A3A]/15 border border-[#C49A3A]/30 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5 text-[#FFE28A]" />
                </div>
                <a
                  href={`tel:${callingNumber}`}
                  className="hover:text-[#FFE28A] text-white font-semibold text-sm tracking-wide transition-colors"
                >
                  {displayCallingNumber}
                </a>
              </div>

              {/* WhatsApp Enquiry Number */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                </div>
                <a
                  href={`https://wa.me/916382573997`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#25D366] hover:text-white font-semibold text-sm tracking-wide transition-colors inline-flex items-center gap-1.5"
                >
                  {displayWhatsAppNumber}
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              </div>

              {/* Email */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#C49A3A]/15 border border-[#C49A3A]/30 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-[#FFE28A]" />
                </div>
                <a
                  href={`mailto:${officialEmail}`}
                  className="hover:text-[#FFE28A] text-gold-100 font-semibold text-sm break-all transition-colors"
                >
                  {officialEmail}
                </a>
              </div>

              {/* Store Timings */}
              <div className="flex items-center gap-2.5 text-gold-300/80 pt-0.5">
                <div className="w-7 h-7 rounded-full bg-[#C49A3A]/15 border border-[#C49A3A]/30 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 text-[#FFE28A]" />
                </div>
                <div className="text-sm leading-tight">
                  <span className="text-gold-200 font-medium">9:00 AM – 9:30 PM</span>
                  <span className="text-gold-400/90 ml-1.5">(Open All Days)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Quick Links (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-2.5">
            <div>
              <h4 className="font-serif font-bold text-sm tracking-[0.14em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#F5DE9C] to-[#C49A3A]">
                Quick Links
              </h4>
              <div className="h-0.5 w-8 bg-gradient-to-r from-[#C49A3A] to-transparent mt-1 mb-2.5" />
            </div>
            <ul className="space-y-2 text-sm text-gold-200/90">
              <li>
                <Link to="/about" className="group inline-flex items-center gap-2 hover:text-[#FFE28A] transition-all duration-200 hover:translate-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C49A3A]/60 group-hover:bg-[#FFE28A] transition-all shrink-0" />
                  <span>About Us &amp; Legacy</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="group inline-flex items-center gap-2 hover:text-[#FFE28A] transition-all duration-200 hover:translate-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C49A3A]/60 group-hover:bg-[#FFE28A] transition-all shrink-0" />
                  <span>Contact &amp; Showroom</span>
                </Link>
              </li>
              <li>
                <Link to="/schemes" className="group inline-flex items-center gap-2 hover:text-[#FFE28A] transition-all duration-200 hover:translate-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C49A3A]/60 group-hover:bg-[#FFE28A] transition-all shrink-0" />
                  <span>Jewellery Savings Schemes</span>
                </Link>
              </li>
              <li>
                <Link to="/digigold" className="group inline-flex items-center gap-2 hover:text-[#FFE28A] transition-all duration-200 hover:translate-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C49A3A]/60 group-hover:bg-[#FFE28A] transition-all shrink-0" />
                  <span>DigiGold Rates</span>
                </Link>
              </li>
              <li>
                <Link to="/digisilver" className="group inline-flex items-center gap-2 hover:text-[#FFE28A] transition-all duration-200 hover:translate-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C49A3A]/60 group-hover:bg-[#FFE28A] transition-all shrink-0" />
                  <span>DigiSilver Rates</span>
                </Link>
              </li>
              <li>
                <Link to="/products" className="group inline-flex items-center gap-2 hover:text-[#FFE28A] transition-all duration-200 hover:translate-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C49A3A]/60 group-hover:bg-[#FFE28A] transition-all shrink-0" />
                  <span>Jewellery Collections</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Certifications & Legal (3 cols on lg) */}
          <div className="lg:col-span-3 space-y-2.5">
            <div>
              <h4 className="font-serif font-bold text-sm tracking-[0.14em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#F5DE9C] to-[#C49A3A]">
                Certifications &amp; Legal
              </h4>
              <div className="h-0.5 w-8 bg-gradient-to-r from-[#C49A3A] to-transparent mt-1 mb-2.5" />
            </div>

            <ul className="space-y-2 text-sm text-gold-200/90">
              {/* Direct PDF Link: GST Certificate */}
              <li>
                <a
                  href="/documents/sri-ramas-jewellery-gst-certificate.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 p-1 -ml-1 rounded hover:bg-[#24050B] text-gold-100 hover:text-[#FFE28A] transition-all"
                  title="Open Official GST Registration Certificate (PDF)"
                >
                  <FileText className="w-4 h-4 text-[#C49A3A] group-hover:scale-110 transition-transform shrink-0" />
                  <span className="font-semibold underline decoration-[#C49A3A]/60 underline-offset-2">GST Certificate</span>
                  <ExternalLink className="w-3 h-3 text-[#C49A3A] opacity-70 group-hover:opacity-100" />
                </a>
              </li>

              {/* Direct PDF Link: BIS Certificate */}
              <li>
                <a
                  href="/documents/sri-ramas-jewellery-bis-certificate.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 p-1 -ml-1 rounded hover:bg-[#24050B] text-gold-100 hover:text-[#FFE28A] transition-all"
                  title="Open Official BIS Hallmark Registration Certificate (PDF)"
                >
                  <ShieldCheck className="w-4 h-4 text-[#25D366] group-hover:scale-110 transition-transform shrink-0" />
                  <span className="font-semibold underline decoration-[#C49A3A]/60 underline-offset-2">BIS Certificate</span>
                  <ExternalLink className="w-3 h-3 text-[#C49A3A] opacity-70 group-hover:opacity-100" />
                </a>
              </li>

              <li className="pt-1 border-t border-[#C49A3A]/20">
                <Link to="/privacy-policy" className="group inline-flex items-center gap-2 hover:text-[#FFE28A] transition-all">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C49A3A]/60 group-hover:bg-[#FFE28A] transition-all shrink-0" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link to="/terms" className="group inline-flex items-center gap-2 hover:text-[#FFE28A] transition-all">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C49A3A]/60 group-hover:bg-[#FFE28A] transition-all shrink-0" />
                  <span>Terms &amp; Conditions</span>
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="group inline-flex items-center gap-2 hover:text-[#FFE28A] text-gold-300/80 transition-all pt-0.5">
                  <Lock className="w-3.5 h-3.5 text-[#C49A3A]" />
                  <span>Staff Portal</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 3. Bottom Bar: Copyright & Least Action Logo */}
        <div className="border-t border-[#C49A3A]/25 mt-5 pt-3.5 sm:mt-6 sm:pt-4 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gold-300/80">
          <div>
            © 1987–2026 <span className="text-gold-200 font-semibold">Sri Ramas Jewellery</span>. All Rights Reserved. 18/995, South East Rampart, Thanjavur – 613001.
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gold-400 font-serif text-sm">ஸ்ரீ ராமாஸ் ஜுவல்லரி • தஞ்சாவூர்</span>
          </div>

          {/* Least Action Company Logo */}
          <div className="flex items-center gap-2.5">
            <span className="text-gold-300/70 text-sm">Crafted by</span>
            <a
              href="https://www.leastactioncompany.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-white px-3 py-1.5 rounded-md shadow-sm hover:shadow-md transition-all hover:opacity-95"
              title="Least Action Company - Sense Solve Scale"
            >
              <img
                src="/images/least-action-logo.png"
                alt="Least Action Company - Sense Solve Scale"
                className="h-7 sm:h-8 w-auto object-contain"
              />
            </a>
          </div>
        </div>
      </ScrollReveal>
    </footer>
  );
};
