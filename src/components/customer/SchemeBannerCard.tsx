import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MessageCircle, Sparkles } from 'lucide-react';
import { SchemePlan } from '@/types';
import { formatPaiseToInr } from '@/utils/currency';
import { useStoreWhatsApp } from '@/hooks/useStoreWhatsApp';

interface SchemeBannerCardProps {
  scheme: SchemePlan;
  previewOnly?: boolean;
  compact?: boolean;
}

export const SchemeBannerCard: React.FC<SchemeBannerCardProps> = ({
  scheme,
  previewOnly = false,
  compact = false,
}) => {
  const { buildWhatsAppUrl } = useStoreWhatsApp();
  const isRightAligned = scheme.textAlignment !== 'left';
  const bannerSrc = scheme.bannerImageUrl || '';
  const logoSrc = scheme.logoImageUrl || '/logo.jpg';
  const ctaLabel = scheme.ctaText?.trim() || 'JOIN NOW';
  const summaryText = scheme.shortDescription || scheme.tagline || scheme.description;

  const minAmount =
    scheme.minMonthlyAmountPaise ?? scheme.minimumMonthlyAmountPaise;
  const hasMinAmount = typeof minAmount === 'number' && minAmount > 0;
  const durationBadge =
    scheme.durationLabel ||
    (scheme.tenureMonths && scheme.tenureMonths > 0
      ? `${scheme.tenureMonths} Months`
      : '');

  const whatsappUrl = buildWhatsAppUrl({
    type: 'SCHEME',
    schemeName: scheme.name,
    customMessage: scheme.whatsappMessage,
  });

  const innerContent = (
    <div
      className={`group relative w-full overflow-hidden rounded-2xl border border-gold-500/55 bg-burgundy-950 shadow-luxury transition-all duration-500 ${
        compact ? 'min-h-[200px] sm:min-h-[230px]' : 'min-h-[230px] sm:min-h-[280px] lg:min-h-[320px]'
      }`}
    >
      {/* Responsive Banner Artwork */}
      {bannerSrc ? (
        <picture>
          {scheme.mobileBannerImageUrl && (
            <source media="(max-width: 639px)" srcSet={scheme.mobileBannerImageUrl} />
          )}
          <img
            src={bannerSrc}
            alt={scheme.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        </picture>
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#4D0B14] via-[#34060D] to-[#1D0206]"
          aria-hidden="true"
        />
      )}

      {/* Directional Gradient Scrim Keeping Jewellery Side Bright & Clear */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 ${
          bannerSrc
            ? isRightAligned
              ? 'bg-gradient-to-t sm:bg-gradient-to-l from-[#1C0206]/95 via-[#2E050B]/75 sm:via-[#2E050B]/60 to-transparent'
              : 'bg-gradient-to-t sm:bg-gradient-to-r from-[#1C0206]/95 via-[#2E050B]/75 sm:via-[#2E050B]/60 to-transparent'
            : 'bg-gradient-to-r from-[#260309]/90 to-[#470B15]/70'
        }`}
      />

      {/* Delicate Antique Gold Inner Frame */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-2.5 sm:inset-3.5 rounded-xl border border-gold-400/30 group-hover:border-gold-300/50 transition-colors"
      />

      {/* Content Layout */}
      <div
        className={`relative z-10 h-full w-full flex flex-col justify-center px-6 py-7 sm:px-10 sm:py-9 lg:px-14 ${
          isRightAligned ? 'sm:items-end sm:text-center' : 'sm:items-start sm:text-center'
        }`}
      >
        <div className="w-full sm:w-[54%] lg:w-[50%] flex flex-col items-center text-center space-y-3">
          {/* Official Brand Crest */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-gold-400/80 overflow-hidden bg-burgundy-950 p-0.5 shadow-luxury-gold">
              <img
                src={logoSrc}
                alt="Sri Ramas Jewellery Crest"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span className="text-[10px] font-serif text-gold-300/90 tracking-wider">
              ஸ்ரீ ராமாஸ் • Since 1987
            </span>
          </div>

          {/* Scheme Headline */}
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-wide text-[#F6DFA4] drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] leading-tight">
            {scheme.name}
          </h2>

          {/* Optional Summary Copy */}
          {summaryText && !compact && (
            <p className="text-xs sm:text-sm text-gold-100/85 max-w-md leading-relaxed line-clamp-2">
              {summaryText}
            </p>
          )}

          {/* Optional Metadata Pills (Only when configured by Admin) */}
          {(durationBadge || hasMinAmount) && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
              {durationBadge && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-burgundy-950/75 border border-gold-500/40 text-[11px] font-medium text-gold-200">
                  <Clock className="w-3 h-3 text-gold-400" />
                  <span>{durationBadge}</span>
                </span>
              )}
              {hasMinAmount && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-burgundy-950/75 border border-gold-500/40 text-[11px] font-medium text-gold-200">
                  <Sparkles className="w-3 h-3 text-gold-400" />
                  <span>From {formatPaiseToInr(minAmount)}</span>
                </span>
              )}
            </div>
          )}

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {previewOnly ? (
              <span className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-gold-300/75 bg-burgundy-950/60 text-[#FCE7B2] text-xs font-bold uppercase tracking-[0.2em] shadow-sm">
                <span>✦</span>
                <span>{ctaLabel}</span>
                <span>✦</span>
              </span>
            ) : (
              <>
                <Link
                  to={`/schemes/${scheme.slug}`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-gold-300/80 bg-burgundy-950/70 hover:bg-brand-gold-gradient text-[#FCE7B2] hover:text-burgundy-950 text-xs font-bold uppercase tracking-[0.18em] transition-all duration-300 shadow-md"
                >
                  <span>{ctaLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#25D366]/90 hover:bg-[#20bd5a] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return innerContent;
};
