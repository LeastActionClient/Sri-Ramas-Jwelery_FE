import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CalendarCheck,
  Percent,
  Gift,
  Zap,
  ShieldCheck,
  RefreshCw,
  Gem,
  Coins,
  X,
  MessageCircle,
} from 'lucide-react';
import { SchemePlan } from '@/types';
import { useStoreWhatsApp } from '@/hooks/useStoreWhatsApp';

interface SchemeCardProps {
  scheme: SchemePlan;
  isFirst?: boolean;
  isReversed?: boolean;
  onRemoveButton?: () => void;
  previewMode?: boolean;
}

function getBenefitIcon(text: string, index: number, className = 'w-4 h-4 text-[#8C6018] stroke-[1.8] shrink-0') {
  const lower = (text || '').toLowerCase();
  if (lower.includes('tenure') || lower.includes('duration') || lower.includes('month') || lower.includes('time')) {
    return <Calendar className={className} />;
  }
  if (lower.includes('benefit') || lower.includes('percent') || lower.includes('%') || lower.includes('attractive')) {
    return <Percent className={className} />;
  }
  if (lower.includes('bonus') || lower.includes('maturity') || lower.includes('gift') || lower.includes('reward')) {
    return <Gift className={className} />;
  }
  if (lower.includes('anytime') || lower.includes('instant') || lower.includes('quick') || lower.includes('buy')) {
    return <Zap className={className} />;
  }
  if (lower.includes('secure') || lower.includes('safety') || lower.includes('100%') || lower.includes('trust')) {
    return <ShieldCheck className={className} />;
  }
  if (lower.includes('convert') || lower.includes('exchange') || lower.includes('jewellery') || lower.includes('refresh')) {
    return <RefreshCw className={className} />;
  }
  if (lower.includes('wedding') || lower.includes('bridal') || lower.includes('special') || lower.includes('ring')) {
    return <Gem className={className} />;
  }
  if (lower.includes('value') || lower.includes('coin') || lower.includes('saving') || lower.includes('gold')) {
    return <Coins className={className} />;
  }
  if (lower.includes('plan')) {
    return <CalendarCheck className={className} />;
  }

  // Consistent column-based defaults
  if (index === 0) return <Calendar className={className} />;
  if (index === 1) return <ShieldCheck className={className} />;
  return <Gift className={className} />;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({
  scheme,
  isFirst,
  isReversed = false,
  onRemoveButton,
  previewMode = false,
}) => {
  const { buildWhatsAppUrl } = useStoreWhatsApp();

  // Use ONLY benefits actually configured on the scheme - NO fake fallback array!
  const rawBenefits = Array.isArray(scheme.benefits) ? scheme.benefits.filter(Boolean) : [];
  const benefits = rawBenefits.slice(0, 3);

  // Description text - NO fake fallback string!
  const descriptionText = (scheme.shortDescription || scheme.description || '').trim();

  // Dynamic image path with fallback
  const schemeImage =
    scheme.bannerImageUrl ||
    (scheme.slug?.includes('atchaya')
      ? '/images/schemes/atchaya-virucham.jpg'
      : scheme.slug?.includes('pudhaiyaal-2')
      ? '/images/schemes/swarna-pudhaiyaal-2.jpg'
      : scheme.slug?.includes('pudhaiyaal')
      ? '/images/schemes/swarna-pudhaiyaal.jpg'
      : '/images/schemes/sirapu-thittam.jpg');

  // Navigation target to Contact Page form with scheme pre-fill
  const enquireUrl = `/contact?type=SCHEME&scheme=${encodeURIComponent(scheme.name)}${scheme._id ? `&schemeId=${scheme._id}` : ''}`;

  // WhatsApp Enquiry link with pre-filled message
  const whatsappUrl = buildWhatsAppUrl({
    type: 'SCHEME',
    schemeName: scheme.name,
    customMessage: scheme.whatsappMessage || undefined,
  });

  if (previewMode) {
    return (
      <div
        className="relative flex flex-col items-stretch rounded-2xl border border-[#E5D2B8] shadow-sm overflow-hidden w-full bg-gradient-to-b from-[#FFFDF8] via-[#FAF3E5] to-[#F4E8D3]"
      >
        {/* Scheme Image Preview */}
        <div className="w-full h-[180px] shrink-0 relative overflow-hidden bg-stone-900 border-b border-[#E5D2B8]/80">
          <img
            src={schemeImage}
            alt={scheme.name}
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/schemes/sirapu-thittam.jpg';
            }}
          />
        </div>

        {/* Content Section */}
        <div className="p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div>
            <h4 className="font-serif text-lg font-bold text-[#38060F] leading-tight">
              {scheme.name || 'Savings Scheme Name'}
            </h4>
            {descriptionText && (
              <p className="text-xs text-stone-600 font-normal leading-relaxed mt-1.5">
                {descriptionText}
              </p>
            )}
          </div>

          {benefits.length > 0 && (
            <div className="pt-2 border-t border-[#E8D7BF]/80">
              <div className="grid grid-cols-3 gap-1.5">
                {benefits.map((b, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 bg-[#F7EFE1] p-1.5 rounded-lg border border-[#E5D3BC]/80 text-[10px] text-stone-700 font-medium"
                  >
                    {getBenefitIcon(b, idx, 'w-3 h-3 text-[#8C6018] shrink-0')}
                    <span className="truncate">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-wrap gap-2">
            {scheme.buttonName !== '' && (
              <div className="relative inline-flex items-center">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#460813] text-white text-xs font-semibold">
                  <span>{scheme.buttonName || 'Enquire Now'}</span>
                  <span>→</span>
                </span>
                {onRemoveButton && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onRemoveButton();
                    }}
                    className="absolute -top-1.5 -right-2 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px]"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#25D366] text-white text-xs font-semibold">
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              <span>WhatsApp</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col ${
        isReversed ? 'md:flex-row-reverse' : 'md:flex-row'
      } items-stretch justify-between rounded-2xl sm:rounded-3xl border border-[#E5D2B8] shadow-[0_6px_28px_rgba(180,140,80,0.12)] hover:shadow-[0_12px_36px_rgba(180,140,80,0.22)] transition-all duration-300 overflow-hidden w-full group md:h-[350px] lg:h-[360px]`}
      style={{
        background: 'linear-gradient(180deg, #FFFDF8 0%, #FAF3E5 55%, #F4E8D3 100%)',
      }}
    >
      {/* Pinned 'NEW' Ribbon Badge on first card or when marked */}
      {(isFirst || scheme.displayOrder === 1) && (
        <div
          className={`absolute top-0 ${
            isReversed
              ? 'right-0 rounded-bl-2xl rounded-tr-2xl'
              : 'left-0 rounded-br-2xl rounded-tl-2xl'
          } bg-[#7B0D1A] text-white text-[11px] font-bold tracking-wider px-4 py-1 shadow-sm z-20 select-none`}
        >
          NEW
        </div>
      )}

      {/* 1. Main Content Section: Sized consistently and aligned */}
      <div className="flex-1 p-6 sm:p-7 md:p-8 lg:p-9 flex flex-col justify-between h-full min-w-0">
        <div>
          {/* Scheme Title: Fully visible without distortion */}
          <h3 className="font-serif text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#38060F] leading-tight break-words line-clamp-2">
            {scheme.name}
          </h3>

          {/* Scheme Description: Rendered only if present from admin/DB */}
          {descriptionText ? (
            <p className="text-xs sm:text-sm md:text-[15px] text-stone-600 font-normal leading-relaxed mt-2.5 max-w-2xl line-clamp-3">
              {descriptionText}
            </p>
          ) : null}
        </div>

        {/* 2. Benefits Strip (Rendered ONLY if benefits were actually added) */}
        {benefits.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-[#E8D7BF]/80">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {benefits.map((benefit, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 bg-[#F7EFE1]/90 px-3.5 py-2 rounded-xl border border-[#E5D3BC]/90 shadow-2xs"
                >
                  {getBenefitIcon(benefit, idx, 'w-4 h-4 text-[#8C6018] shrink-0 stroke-[1.8]')}
                  <span className="text-xs sm:text-[13px] font-medium text-stone-700 leading-snug line-clamp-1">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Action Section: BOTH Enquire Now and WhatsApp Enquiry buttons */}
        <div className="mt-4 pt-3 flex flex-col min-[480px]:flex-row items-stretch min-[480px]:items-center gap-3">
          {scheme.buttonName !== '' && (
            <div className="relative inline-flex items-center w-full min-[480px]:w-auto">
              <Link
                to={enquireUrl}
                state={{
                  scheme: {
                    id: scheme._id,
                    name: scheme.name,
                    description: descriptionText,
                  },
                }}
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-[#460813] hover:bg-[#600C1B] text-white text-xs sm:text-sm font-semibold shadow-md transition-all duration-200 group active:scale-95 whitespace-nowrap w-full min-[480px]:w-auto text-center"
              >
                <span>{scheme.buttonName?.trim() || 'Enquire Now'}</span>
                <span className="text-sm group-hover:translate-x-1 transition-transform">→</span>
              </Link>

              {/* Editable small cancel (X) icon when rendered in preview/editor mode */}
              {onRemoveButton && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemoveButton();
                  }}
                  className="absolute -top-1.5 -right-2.5 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-md border border-white transition-all transform hover:scale-110 z-20 cursor-pointer"
                  title="Remove Button from Scheme Card"
                >
                  <X className="w-3 h-3 stroke-[3]" />
                </button>
              )}
            </div>
          )}

          {/* WhatsApp Enquiry Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs sm:text-sm font-semibold shadow-md transition-all duration-200 active:scale-95 whitespace-nowrap w-full min-[480px]:w-auto text-center"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>WhatsApp Enquiry</span>
          </a>
        </div>
      </div>

      {/* 4. Scheme Image Section: Exactly cropped and perfectly uniform across ALL cards */}
      <div
        className={`w-full md:w-[420px] lg:w-[480px] xl:w-[520px] h-[240px] md:h-full shrink-0 relative overflow-hidden bg-stone-900 ${
          isReversed
            ? 'border-b md:border-b-0 md:border-r border-[#E5D2B8]/80'
            : 'border-t md:border-t-0 md:border-l border-[#E5D2B8]/80'
        }`}
      >
        <img
          src={schemeImage}
          alt={scheme.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/schemes/sirapu-thittam.jpg';
          }}
        />
        {/* Subtle vignette/sheen overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10"
        />
      </div>
    </div>
  );
};
