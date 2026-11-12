import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Phone, Mail, Clock, Navigation, Calendar, Building2 } from 'lucide-react';
import { cmsApi } from '@/services/api/cms.api';
import { useStoreWhatsApp } from '@/hooks/useStoreWhatsApp';
import { ScrollReveal, StaggerReveal, ImageReveal, AnimatedCTA } from '@/components/motion';

export const StoresPage: React.FC = () => {
  const { buildWhatsAppUrl } = useStoreWhatsApp();

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: cmsApi.getStores,
  });

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Banner */}
        <ScrollReveal variant="fade-up" immediate>
          <div className="bg-brand-maroon-gradient text-gold-100 rounded-2xl p-8 sm:p-12 border border-gold-500/40 shadow-luxury text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-semibold uppercase tracking-widest border border-gold-400/30">
              <MapPin className="w-3.5 h-3.5" />
              <span>Showroom Network</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-gold-100">
              Our Showroom Boutiques
            </h1>
            <p className="text-xs sm:text-sm text-gold-200/80 max-w-xl mx-auto font-light leading-relaxed">
              Step into our showrooms to inspect our bridal collections and consult personally with our jewellery advisors.
            </p>
          </div>
        </ScrollReveal>

        {/* Showrooms Grid */}
        {isLoading ? (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 border border-gold-300 animate-pulse space-y-4">
            <div className="h-6 bg-stone-200 rounded w-1/3" />
            <div className="h-4 bg-stone-200 rounded w-2/3" />
          </div>
        ) : stores.length > 0 ? (
          <StaggerReveal
            staggerMs={80}
            className={
              stores.length === 1
                ? 'max-w-3xl mx-auto'
                : stores.length === 2
                ? 'grid grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto gap-8'
                : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
            }
          >
            {stores.map((store) => {
              const fullAddress = [
                store.addressLine1 || store.address,
                store.addressLine2,
                [store.city, store.state].filter(Boolean).join(', '),
                store.postalCode || store.pincode,
              ]
                .filter(Boolean)
                .join(', ');
              const phones =
                store.phoneNumbers && store.phoneNumbers.length > 0
                  ? store.phoneNumbers
                  : store.phone
                  ? [store.phone]
                  : [];

              return (
                <div
                  key={store._id}
                  className="group bg-gradient-to-br from-[#FCF7EC] via-white to-[#F7EBD2] rounded-2xl border border-gold-400/55 overflow-hidden shadow-luxury flex flex-col justify-between transition-all duration-300 ease-luxury hover:-translate-y-1 hover:border-gold-500/85 hover:shadow-luxury-gold"
                >
                  {store.imageUrl ? (
                    <div className="h-52 bg-burgundy-950 overflow-hidden">
                      <ImageReveal
                        src={store.imageUrl}
                        alt={store.name}
                        wrapperClassName="w-full h-full"
                        className="w-full h-full object-cover transition-transform duration-500 ease-luxury group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="h-32 bg-brand-maroon-gradient flex items-center justify-center gap-3 text-gold-200 border-b border-gold-500/30">
                      <Building2 className="w-6 h-6 text-gold-300 transition-transform duration-300 group-hover:scale-110" />
                      <span className="font-serif text-sm uppercase tracking-[0.2em]">
                        {store.city || 'Sri Ramas Showroom'}
                      </span>
                    </div>
                  )}

                  <div className="p-6 sm:p-8 space-y-4 flex-1">
                    {store.isFlagship && (
                      <span className="inline-block px-3 py-1 rounded-full bg-brand-gold-gradient text-burgundy-950 text-[10px] font-bold uppercase tracking-wider shadow">
                        Flagship Heritage Boutique
                      </span>
                    )}

                    <h2 className="font-serif text-2xl font-bold text-burgundy-950">
                      {store.name}
                    </h2>

                    <div className="space-y-3 text-xs sm:text-[13px] text-stone-700 pt-2 border-t border-[#DFC389]/60">
                      {fullAddress && (
                        <p className="flex items-start gap-2.5 leading-relaxed">
                          <MapPin className="w-4 h-4 text-gold-700 shrink-0 mt-0.5" />
                          <span>{fullAddress}</span>
                        </p>
                      )}
                      <div className="flex items-start gap-2.5">
                        <Phone className="w-4 h-4 text-gold-700 shrink-0 mt-0.5" />
                        {phones.length > 0 ? (
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {phones.map((num, idx) => (
                              <a
                                key={idx}
                                href={`tel:${num.replace(/\s+/g, '')}`}
                                className="hover:text-gold-800 font-medium text-burgundy-950"
                              >
                                {num}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="italic text-stone-500">
                            Contact number awaits showroom update
                          </span>
                        )}
                      </div>
                      {store.email && (
                        <p className="flex items-center gap-2.5">
                          <Mail className="w-4 h-4 text-gold-700 shrink-0" />
                          <a href={`mailto:${store.email}`} className="hover:text-gold-800">
                            {store.email}
                          </a>
                        </p>
                      )}
                      {store.openingHours &&
                        !store.openingHours.toLowerCase().includes('confirm') && (
                          <p className="flex items-start gap-2.5">
                            <Clock className="w-4 h-4 text-gold-700 shrink-0 mt-0.5" />
                            <span>{store.openingHours}</span>
                          </p>
                        )}
                    </div>
                  </div>

                  <div className="p-6 bg-[#FAF1DE]/70 border-t border-[#DFC389]/60 flex items-center justify-between gap-3">
                    {store.googleMapsUrl ? (
                      <a
                        href={store.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/link inline-flex items-center gap-1.5 text-xs font-semibold text-burgundy-900 hover:text-gold-800 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5 text-gold-700 transition-transform duration-300 group-hover/link:translate-x-0.5" />
                        <span className="luxury-underline">Get Directions</span>
                      </a>
                    ) : (
                      <span />
                    )}

                    <AnimatedCTA
                      variant="burgundy"
                      href={buildWhatsAppUrl({
                        type: 'SHOWROOM',
                        storeName: store.name,
                        phoneNumber: store.whatsappNumber || store.phone,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      icon={<Calendar className="w-3.5 h-3.5 text-gold-400" />}
                      className="px-4 py-2 rounded-lg text-xs font-medium"
                    >
                      Enquire on WhatsApp
                    </AnimatedCTA>
                  </div>
                </div>
              );
            })}
          </StaggerReveal>
        ) : (
          <ScrollReveal variant="fade-up">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl p-10 border border-gold-300 text-center space-y-4">
              <MapPin className="w-10 h-10 text-gold-600 mx-auto" />
              <h2 className="font-serif text-2xl font-bold text-burgundy-950">
                Showroom Locations Updating
              </h2>
              <p className="text-xs text-stone-600 max-w-md mx-auto">
                Showroom addresses and visiting hours are managed directly via the Sri Ramas Admin Console. Contact our advisors on WhatsApp to book a private visit.
              </p>
              <AnimatedCTA
                variant="burgundy"
                href={buildWhatsAppUrl({ type: 'SHOWROOM' })}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 rounded-lg text-xs"
              >
                Connect on WhatsApp
              </AnimatedCTA>
            </div>
          </ScrollReveal>
        )}
      </div>
    </>
  );
};
