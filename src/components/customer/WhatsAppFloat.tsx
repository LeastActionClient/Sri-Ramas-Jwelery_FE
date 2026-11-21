import React from 'react';
import { useStoreWhatsApp } from '@/hooks/useStoreWhatsApp';

export const WhatsAppFloat: React.FC = () => {
  const { buildWhatsAppUrl } = useStoreWhatsApp();
  const whatsappUrl = buildWhatsAppUrl({
    type: 'GENERAL',
  });

  const floatingSocials = [
    {
      name: 'Instagram',
      title: 'Follow on Instagram',
      href: 'https://www.instagram.com/sriramasjewellery?stkn=MW1zbjhlcWp2djRtMA%3D%3D&utm_source=qr',
      ariaLabel: 'Follow Sri Ramas Jewellery on Instagram',
      bgClass: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] hover:brightness-110',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
    },
    {
      name: 'Facebook',
      title: 'Follow on Facebook',
      href: 'https://www.facebook.com/share/1C66ZZMv1E/?mibextid=wwXIfr',
      ariaLabel: 'Follow Sri Ramas Jewellery on Facebook',
      bgClass: 'bg-[#1877F2] hover:bg-[#166fe5]',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'YouTube',
      title: 'Subscribe on YouTube',
      href: 'https://youtube.com/@sriramasjewellerytnj?si=7H9OjTbr4YQBmNx9',
      ariaLabel: 'Subscribe to Sri Ramas Jewellery on YouTube',
      bgClass: 'bg-[#FF0000] hover:bg-[#e60000]',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
  ];

  return (
    <aside
      aria-label="Quick Connect Social & WhatsApp Actions"
      className="fixed bottom-5 sm:bottom-7 right-3.5 sm:right-6 z-40 flex flex-col items-center gap-2 sm:gap-2.5 select-none"
    >
      {/* Social Media Floating Badges: Vertically stacked above WhatsApp */}
      {floatingSocials.map((social) => (
        <div key={social.name} className="relative group/item flex items-center justify-center">
          <span
            className="pointer-events-none absolute right-full mr-2.5 px-2.5 py-1 text-xs font-serif font-medium tracking-wide text-[#FAF7F0] bg-[#1A0307]/95 border border-[#C49A3A]/60 rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 hidden sm:block"
            role="tooltip"
          >
            {social.title}
          </span>
          <a
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.ariaLabel}
            title={social.title}
            className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-gold-300/80 hover:border-gold-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 ${social.bgClass}`}
          >
            {social.icon}
          </a>
        </div>
      ))}

      {/* Main WhatsApp Floating Button: Anchored at the bottom of the vertical stack */}
      <div className="relative group/item flex items-center justify-center mt-0.5">
        <span
          className="pointer-events-none absolute right-full mr-2.5 px-2.5 py-1 text-xs font-serif font-medium tracking-wide text-[#FAF7F0] bg-[#1A0307]/95 border border-[#C49A3A]/60 rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 hidden sm:block"
          role="tooltip"
        >
          Chat on WhatsApp
        </span>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with Sri Ramas Jewellery showroom on WhatsApp"
          title="Chat on WhatsApp"
          className="group relative flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full shadow-2xl border-2 border-gold-300 transition-all duration-300 hover:scale-110 active:scale-95"
        >
          {/* Live pulsing online indicator */}
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-gold-400" />
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6 sm:w-7 sm:h-7 text-white transition-transform group-hover:scale-105"
          >
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.39-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.71 4.3 3.8 2.53 1.09 2.53.73 2.98.69.46-.04 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29" />
          </svg>
        </a>
      </div>
    </aside>
  );
};
