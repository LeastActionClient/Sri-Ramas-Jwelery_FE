import React from 'react';
import { ShieldCheck, FileText, ExternalLink, CheckCircle2 } from 'lucide-react';
import { ScrollReveal } from '@/components/motion';

export const BisTrustSection: React.FC = () => {
  return (
    <section className="relative w-full bg-[#FAF5EE] py-8 sm:py-10 lg:py-12 border-b border-[#C49A3A]/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#38060F]/10 border border-[#38060F]/20 text-[#38060F] text-xs font-semibold uppercase tracking-[0.2em]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#38060F]" />
            <span>GOVERNMENT OF INDIA CERTIFICATION</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#38060F]">
            100% Certified Hallmarked Jewellery
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Every piece crafted at Sri Ramas Jewellery is independently tested and certified for purity and authentic fineness by the Bureau of Indian Standards (BIS).
          </p>
        </div>

        {/* Main Trust Banner & Details Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center bg-white rounded-3xl p-5 sm:p-6 lg:p-8 border-2 border-[#E5D2B8] shadow-luxury">
          {/* Left Column: Exact Client-Provided BIS Graphic (Preserving original aspect ratio & composition) */}
          <ScrollReveal variant="slide-left" distance={16} className="lg:col-span-6 flex items-center justify-center">
            <div className="w-full max-w-lg p-4 sm:p-6 rounded-2xl bg-[#FFFDF8] border border-[#E5D2B8] shadow-sm flex items-center justify-center">
              <img
                src="/images/bis-certification-badge.jpg"
                alt="100% Certified Jewellery - Bureau of Indian Standards (BIS)"
                className="w-full h-auto object-contain max-h-[160px] sm:max-h-[200px]"
              />
            </div>
          </ScrollReveal>

          {/* Right Column: Official Registration Credentials & Document Links */}
          <ScrollReveal variant="slide-right" distance={16} className="lg:col-span-6 space-y-5">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-stone-700">
                  <strong className="text-stone-900 block font-semibold">BIS Registration Certificate:</strong>
                  Official Certificate No: <span className="font-mono font-bold text-[#38060F]">HM/C-6920329418</span> issued by Bureau of Indian Standards.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-stone-700">
                  <strong className="text-stone-900 block font-semibold">Indian Standard Conformance:</strong>
                  Governed under <span className="font-semibold text-stone-900">IS 1417 : 2016</span> (Gold and Gold Alloys, Jewellery / Artefacts – Fineness and Marking).
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-stone-700">
                  <strong className="text-stone-900 block font-semibold">Unique HUID Laser Hallmark:</strong>
                  Each gold ornament bears a distinct 6-digit alphanumeric Hallmark Unique Identification (HUID) code verifying authenticity.
                </div>
              </div>
            </div>

            {/* Direct Official PDF Document Links */}
            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href="/documents/sri-ramas-jewellery-bis-certificate.pdf"
                target="_blank"
                rel="noopener noreferrer"
                title="View Bureau of Indian Standards (BIS) Certificate"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#38060F] hover:bg-[#520916] text-[#FFE28A] text-xs font-bold tracking-wide shadow-md transition-all group"
              >
                <FileText className="w-4 h-4 text-[#FFE28A] group-hover:scale-110 transition-transform" />
                <span>View BIS Certificate (PDF)</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#FFE28A]/80" />
              </a>

              <a
                href="/documents/sri-ramas-jewellery-gst-certificate.pdf"
                target="_blank"
                rel="noopener noreferrer"
                title="View Government of India GST Registration Certificate"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#C59B3C] hover:bg-[#FAF5EE] text-[#38060F] text-xs font-bold tracking-wide transition-all group"
              >
                <FileText className="w-4 h-4 text-[#C59B3C] group-hover:scale-110 transition-transform" />
                <span>View GST Certificate (PDF)</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#C59B3C]" />
              </a>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
