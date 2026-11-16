import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, MessageCircle } from 'lucide-react';
import { useStoreWhatsApp } from '@/hooks/useStoreWhatsApp';

const HERO_NAVBAR_THRESHOLD = 96;

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const [isOverHero, setIsOverHero] = useState(true);
  const { buildWhatsAppUrl } = useStoreWhatsApp();

  const generalWhatsAppUrl = buildWhatsAppUrl({ type: 'GENERAL' });
  const mobileMenuOpen = mobileMenuPath === location.pathname;
  const setMobileMenuOpen = (open: boolean) => {
    setMobileMenuPath(open ? location.pathname : null);
  };

  useEffect(() => {
    if (!isHomePage) return;

    const updateNavbarState = () => {
      const heroEl = document.getElementById('hero-section');

      if (!heroEl) {
        setIsOverHero(window.scrollY < window.innerHeight - HERO_NAVBAR_THRESHOLD);
        return;
      }

      const heroRect = heroEl.getBoundingClientRect();
      setIsOverHero(heroRect.bottom > HERO_NAVBAR_THRESHOLD);
    };

    const rafId = requestAnimationFrame(updateNavbarState);
    window.addEventListener('scroll', updateNavbarState, { passive: true });
    window.addEventListener('resize', updateNavbarState, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', updateNavbarState);
      window.removeEventListener('resize', updateNavbarState);
    };
  }, [isHomePage]);

  const isHeroOverlay = isHomePage && isOverHero && !mobileMenuOpen;

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Collections', path: '/products' },
    { label: 'Schemes', path: '/schemes' },
    { label: 'DigiGold', path: '/digigold' },
    { label: 'DigiSilver', path: '/digisilver' },
    { label: 'Heritage', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <header
      className={`${
        isHomePage ? 'fixed top-0 left-0 right-0' : 'sticky top-0'
      } z-40 transition-all duration-300 ease-out w-full max-w-full overflow-hidden ${
        isHeroOverlay
          ? 'bg-transparent border-b border-transparent shadow-none'
          : 'bg-burgundy-900/95 backdrop-blur-md border-b border-gold-500/35 shadow-luxury'
      }`}
    >
      {/* Subtle top gradient scrim so navbar text remains legible over the hero */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-burgundy-950/75 via-burgundy-950/30 to-transparent transition-opacity duration-300 ${
          isHeroOverlay ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Main Brand Header with Inline Navigation Bar */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`flex items-center justify-between gap-2 xl:gap-3 transition-all duration-300 ${
            isHeroOverlay ? 'h-20 sm:h-[88px] pt-2 sm:pt-3' : 'h-16 sm:h-18'
          }`}
        >
          {/* Left: Brand Identity with Official Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group shrink-0 mr-1 xl:mr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 rounded-lg"
          >
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-gold-400 p-0.5 shadow-luxury-gold group-hover:scale-105 group-hover:border-gold-300 transition-all duration-300 bg-burgundy-950 shrink-0">
              <img
                src="/logo.jpg"
                alt="Sri Ramas Jewellery Official Logo"
                className="w-full h-full object-cover object-center rounded-full"
              />
            </div>
            <div className={`flex flex-col ${isHeroOverlay ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]' : ''}`}>
              <span className="font-serif text-sm sm:text-base xl:text-lg font-bold tracking-wider text-gold-100 group-hover:text-gold-300 transition-colors whitespace-nowrap">
                SRI RAMAS JEWELLERY
              </span>
              <div className="hidden sm:flex items-center gap-1.5 text-[9px] xl:text-[10px] text-gold-300/80 font-medium">
                <span className="font-serif">ஸ்ரீ ராமாஸ் ஜுவல்லரி</span>
                <span className="text-gold-600">•</span>
                <span className="tracking-widest uppercase text-gold-400">Since 1987</span>
              </div>
            </div>
          </Link>

          {/* Center: Desktop Navigation Bar with Smooth Underline Indicator */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center justify-center flex-1 min-w-0 mx-1 xl:mx-2 gap-0.5 xl:gap-1.5 2xl:gap-2.5"
          >
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `luxury-underline px-2 py-1.5 xl:px-2.5 xl:py-1.5 rounded-lg text-xs xl:text-[13px] font-medium tracking-wide whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                    isActive
                      ? isHeroOverlay
                        ? 'luxury-underline-active bg-gold-500/20 backdrop-blur-sm text-gold-200 font-semibold shadow-inner'
                        : 'luxury-underline-active bg-gold-500/20 text-gold-300 font-semibold shadow-inner'
                      : isHeroOverlay
                        ? 'text-gold-100 hover:text-gold-300 hover:bg-burgundy-950/45 drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]'
                        : 'text-gold-100/90 hover:text-gold-300 hover:bg-burgundy-800/60'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2.5 shrink-0 ml-1">
            <a
              href={generalWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-brand-gold-gradient text-burgundy-950 font-bold text-xs uppercase tracking-wider shadow-luxury-gold hover:brightness-[1.04] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 active:scale-95 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Enquire Now</span>
            </a>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
              className={`p-2 rounded-lg text-gold-200 hover:text-gold-100 transition-all duration-200 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                isHeroOverlay ? 'hover:bg-burgundy-950/50' : 'hover:bg-burgundy-800'
              }`}
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer with Smooth Enter/Exit Transition */}
      <div
        id="mobile-nav-drawer"
        aria-hidden={!mobileMenuOpen}
        className={`relative z-10 lg:hidden bg-burgundy-950/95 backdrop-blur-md transition-all duration-300 ease-out overflow-hidden ${
          mobileMenuOpen
            ? 'max-h-[440px] opacity-100 border-t border-gold-700/40 p-4 space-y-4 shadow-2xl visible'
            : 'max-h-0 opacity-0 border-t-0 p-0 pointer-events-none invisible'
        }`}
      >
        <div className="grid grid-cols-2 gap-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              tabIndex={mobileMenuOpen ? 0 : -1}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gold-500/20 text-gold-300 font-semibold border-l-2 border-gold-400'
                    : 'text-gold-100/80 hover:text-gold-200 hover:bg-burgundy-900'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="pt-2 border-t border-gold-800/50 flex flex-col gap-2">
          <a
            href={generalWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={mobileMenuOpen ? 0 : -1}
            onClick={() => setMobileMenuOpen(false)}
            className="w-full py-2.5 rounded-lg bg-brand-gold-gradient text-burgundy-950 font-bold text-xs uppercase tracking-wider text-center shadow-luxury active:scale-[0.98] transition-all inline-flex items-center justify-center gap-1.5"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enquire on WhatsApp</span>
          </a>
          <div className="flex items-center justify-end text-xs text-gold-300/80 px-2 pt-1">
            <Link
              to="/admin/login"
              tabIndex={mobileMenuOpen ? 0 : -1}
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-gold-200 text-[11px] underline"
            >
              Staff Portal
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
