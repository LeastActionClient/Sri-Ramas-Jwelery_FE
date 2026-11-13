import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { schemesApi } from '@/services/api/schemes.api';
import { useStoreWhatsApp } from '@/hooks/useStoreWhatsApp';
import { formatPaiseToInr } from '@/utils/currency';
import { AnimatedCTA, ScrollReveal } from '@/components/motion';

export const SchemeDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { buildWhatsAppUrl, displayPhone, telHref } = useStoreWhatsApp();

  const {
    data: scheme,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['scheme', slug],
    queryFn: () => schemesApi.getSchemeBySlug(slug!),
    enabled: Boolean(slug),
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-6 animate-pulse">
        <div className="h-6 w-40 bg-stone-200 rounded" />
        <div className="h-72 bg-stone-200 rounded-2xl" />
        <div className="h-44 bg-stone-200 rounded-2xl" />
      </div>
    );
  }

  if (isError || !scheme) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <Award className="w-10 h-10 text-gold-600 mx-auto" />
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
          Savings Scheme Not Found
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          The requested savings scheme may have been updated or retired. Please review our active showroom programmes.
        </p>
        <Link
          to="/schemes"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-burgundy-900 text-gold-200 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Savings Schemes</span>
        </Link>
      </div>
    );
  }

  const minPaise = scheme.minMonthlyAmountPaise ?? scheme.minimumMonthlyAmountPaise;
  const hasMinAmount = typeof minPaise === 'number' && minPaise > 0;
  const durationLabel =
    scheme.durationLabel ||
    (scheme.tenureMonths && scheme.tenureMonths > 0
      ? `${scheme.tenureMonths} Months`
      : '');
  const benefits = (scheme.benefits || []).filter(Boolean);
  const terms = (scheme.terms || []).filter(Boolean);
  const overviewCopy =
    scheme.fullDescription || scheme.shortDescription || scheme.description;

  const whatsappUrl = buildWhatsAppUrl({
    type: 'SCHEME',
    schemeName: scheme.name,
    customMessage: scheme.whatsappMessage,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <div>
        <Link
          to="/schemes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-burgundy-900 hover:text-gold-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Jewellery Savings Schemes</span>
        </Link>
      </div>

      {/* Hero Artwork + Title */}
      <ScrollReveal variant="fade-up" immediate>
        <div className="relative overflow-hidden rounded-3xl border border-gold-500/55 bg-burgundy-950 text-gold-100 shadow-luxury min-h-[260px] sm:min-h-[340px] flex items-center">
          {scheme.bannerImageUrl && (
            <img
              src={scheme.bannerImageUrl}
              alt={scheme.name}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          )}
          <div
            aria-hidden="true"
            className={`absolute inset-0 ${
              scheme.bannerImageUrl
                ? scheme.textAlignment === 'left'
                  ? 'bg-gradient-to-r from-[#1C0206]/95 via-[#2C050B]/80 to-[#2C050B]/35'
                  : 'bg-gradient-to-l from-[#1C0206]/95 via-[#2C050B]/80 to-[#2C050B]/35'
                : 'bg-brand-maroon-gradient'
            }`}
          />

          <div
            className={`relative z-10 w-full p-7 sm:p-12 flex flex-col ${
              scheme.textAlignment === 'left'
                ? 'sm:items-start text-left'
                : 'sm:items-end text-left sm:text-right'
            }`}
          >
            <div className="max-w-xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/20 text-gold-200 text-[11px] font-bold uppercase tracking-widest border border-gold-400/35">
                <Award className="w-3.5 h-3.5 text-gold-300" />
                <span>Sri Ramas Jewellery Savings Scheme</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-[#FCE7B2] leading-tight">
                {scheme.name}
              </h1>

              {scheme.tagline && (
                <p className="text-sm sm:text-base text-gold-100/90 font-light">
                  {scheme.tagline}
                </p>
              )}

              {(durationLabel || hasMinAmount) && (
                <div
                  className={`flex flex-wrap gap-2 pt-1 ${
                    scheme.textAlignment === 'left'
                      ? 'justify-start'
                      : 'justify-start sm:justify-end'
                  }`}
                >
                  {durationLabel && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-burgundy-950/80 border border-gold-400/45 text-xs font-semibold text-gold-200">
                      <Clock className="w-3.5 h-3.5 text-gold-400" />
                      <span>Duration: {durationLabel}</span>
                    </span>
                  )}
                  {hasMinAmount && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-burgundy-950/80 border border-gold-400/45 text-xs font-semibold text-gold-200">
                      <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                      <span>Min. Contribution: {formatPaiseToInr(minPaise)}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Scheme Overview */}
          <div className="bg-white rounded-2xl border border-gold-300/60 p-6 sm:p-8 space-y-4 shadow-sm">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-burgundy-950">
              Programme Overview
            </h2>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
              {overviewCopy ||
                'Visit our showroom or speak with a Sri Ramas Jewellery advisor on WhatsApp to understand plan enrollment options, jewel selection flexibility, and showroom schedule details.'}
            </p>
          </div>

          {/* Key Benefits (when configured) */}
          {benefits.length > 0 && (
            <div className="bg-white rounded-2xl border border-gold-300/60 p-6 sm:p-8 space-y-4 shadow-sm">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-burgundy-950">
                Key Scheme Highlights
              </h2>
              <ul className="space-y-3">
                {benefits.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Official Terms & Conditions (when configured) */}
          {terms.length > 0 && (
            <div className="bg-ivory-50 rounded-2xl border border-gold-300/70 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-gold-700" />
                <h2 className="font-serif text-xl font-bold text-burgundy-950">
                  Official Terms &amp; Guidance
                </h2>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-stone-700">
                {terms.map((term, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="text-gold-700 font-bold mt-0.5">•</span>
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sticky Sidebar: Direct WhatsApp Enrollment Enquiry */}
        <aside className="lg:col-span-4">
          <div className="sticky top-24 bg-white rounded-2xl border-2 border-gold-400/70 p-6 space-y-5 shadow-luxury">
            <div className="space-y-2 border-b border-stone-200 pb-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gold-700">
                Personalised Consultation
              </span>
              <h3 className="font-serif text-xl font-bold text-burgundy-950">
                Enrol at Showroom
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Speak directly with our showroom team on WhatsApp to confirm plan details and begin in-person enrollment for <strong>{scheme.name}</strong>.
              </p>
            </div>

            <div className="space-y-3">
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
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider"
              >
                Call Showroom ({displayPhone})
              </AnimatedCTA>
            </div>

            <p className="text-[11px] text-stone-500 leading-relaxed pt-2 border-t border-stone-200">
              No online payment or advance is collected on this site. Final passbook issuance takes place exclusively at Sri Ramas Jewellery showrooms.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
