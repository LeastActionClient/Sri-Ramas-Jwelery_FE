import React from 'react';
import { Lock, FileText } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="space-y-2 border-b border-stone-200 pb-5">
        <span className="text-xs font-bold uppercase tracking-widest text-gold-700 flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-gold-600" />
          <span>Trust & Confidentiality</span>
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-burgundy-950">
          Privacy Policy
        </h1>
        <p className="text-xs text-stone-500">
          Last Updated: November 2026 • Sri Ramas Jewellery (Estd. 1987)
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-stone-700 space-y-6 text-xs sm:text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif font-bold text-base text-burgundy-900">
            1. Commitment to Customer Privacy
          </h2>
          <p>
            At Sri Ramas Jewellery, we value the trust our patrons have reposed in our heritage house since 1987. This Privacy Policy outlines how we collect, store, and utilize information submitted via our digital showcase and enquiry platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif font-bold text-base text-burgundy-900">
            2. Nature of Platform & Financial Information
          </h2>
          <p>
            Sri Ramas Jewellery is strictly an enquiry and consultation catalogue. <strong>We do not collect credit card numbers, debit card details, bank account passwords, or UPI financial credentials on this website.</strong> All purchases, payments, and bullion deliveries take place exclusively at our authorized physical showrooms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif font-bold text-base text-burgundy-900">
            3. Information Collected via Enquiries
          </h2>
          <p>
            When you submit a consultation request, product enquiry, or savings scheme query, we collect your name, mobile phone number, email address (optional), city, and specific piece requirements. This information is used solely by our authorized jewellery concierge to communicate with you regarding your enquiry.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif font-bold text-base text-burgundy-900">
            4. Data Confidentiality & Zero Third-Party Selling
          </h2>
          <p>
            We strictly do not rent, sell, or trade your personal telephone numbers or information to any external marketing agencies. All records are stored with administrative access controls and encrypted session management.
          </p>
        </section>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="space-y-2 border-b border-stone-200 pb-5">
        <span className="text-xs font-bold uppercase tracking-widest text-gold-700 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-gold-600" />
          <span>Showroom & Showcase Terms</span>
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-burgundy-950">
          Terms of Service
        </h1>
        <p className="text-xs text-stone-500">
          Sri Ramas Jewellery (Estd. 1987) • Non-Commerce Consultation Portal
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-stone-700 space-y-6 text-xs sm:text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif font-bold text-base text-burgundy-900">
            1. Non-E-Commerce Platform Declaration
          </h2>
          <p>
            This website functions exclusively as a showcase catalogue and customer enquiry conduit for Sri Ramas Jewellery. No commercial sales contracts are formed online. There is no shopping cart, online order placement, or automated payment processing.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif font-bold text-base text-burgundy-900">
            2. Bullion Rates &amp; Indicative Showroom Guidance
          </h2>
          <p>
            Live gold and silver bullion rates and optional DigiGold or DigiSilver weight/amount estimation calculators displayed on this portal reflect market benchmarks for advisory purposes only. Official showroom billing is prepared in person using calibrated electronic balance weights and confirmed counter rates at the time of showroom purchase.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif font-bold text-base text-burgundy-900">
            3. BIS Hallmarking & Certified Diamond Standards
          </h2>
          <p>
            All 22 Karat and 18 Karat gold jewellery items displayed in our showrooms bear the official Bureau of Indian Standards (BIS) Hallmark with unique 6-character HUID laser inscriptions. Diamonds are graded according to international color and clarity standards.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif font-bold text-base text-burgundy-900">
            4. Enquiry Reference Numbers
          </h2>
          <p>
            Enquiry reference numbers (e.g. SRJ-YYYYMM-XXXX) generated upon submitting an enquiry serve solely for communication tracking and do not constitute an order confirmation or price lock.
          </p>
        </section>
      </div>
    </div>
  );
};
