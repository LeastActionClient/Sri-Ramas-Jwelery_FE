import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useState } from 'react';

let pluginsRegistered = false;

/**
 * Registers GSAP ScrollTrigger safely once in the browser environment.
 */
export function ensureGsapRegistered(): void {
  if (typeof window === 'undefined' || pluginsRegistered) return;
  gsap.registerPlugin(ScrollTrigger);
  pluginsRegistered = true;
}

/**
 * Shared motion design constants calibrated for luxury jewellery presentation.
 */
export const MOTION_EASE_CSS = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const MOTION_EASE_GSAP = 'power3.out';
export const MOTION_EASE_SMOOTH = 'power2.out';

export const MOTION_TIMING = {
  microMs: 220,
  hoverMs: 400,
  revealMs: 650,
  heroDurationSec: 0.85,
  staggerMs: 70,
  staggerSec: 0.08,
  pageTransitionMs: 260,
} as const;

/**
 * Synchronously checks whether the user prefers reduced motion.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Reactive hook listening to the OS prefers-reduced-motion media query.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => prefersReducedMotion());

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setReduced(e.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reduced;
}

export type ViewportTier = 'mobile' | 'tablet' | 'desktop';

/**
 * Tracks responsive viewport tier to simplify parallax/motion cleanly on touch viewports.
 */
export function useViewportTier(): ViewportTier {
  const [tier, setTier] = useState<ViewportTier>(() => {
    if (typeof window === 'undefined') return 'desktop';
    if (window.innerWidth < 768) return 'mobile';
    if (window.innerWidth < 1024) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateTier = () => {
      if (window.innerWidth < 768) setTier('mobile');
      else if (window.innerWidth < 1024) setTier('tablet');
      else setTier('desktop');
    };
    window.addEventListener('resize', updateTier, { passive: true });
    return () => window.removeEventListener('resize', updateTier);
  }, []);

  return tier;
}
