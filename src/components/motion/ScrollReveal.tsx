import React, { useEffect, useRef, useState } from 'react';
import { MOTION_EASE_CSS, MOTION_TIMING, usePrefersReducedMotion } from '@/utils/motion';

export type ScrollRevealVariant =
  | 'fade-up'
  | 'fade-in'
  | 'slide-up'
  | 'slide-left'
  | 'slide-right'
  | 'scale';

interface ScrollRevealProps {
  children: React.ReactNode;
  variant?: ScrollRevealVariant;
  delay?: number;
  duration?: number;
  distance?: number;
  threshold?: number;
  once?: boolean;
  immediate?: boolean;
  className?: string;
}

function getHiddenTransform(variant: ScrollRevealVariant, distance: number): string {
  switch (variant) {
    case 'fade-in':
      return 'translate3d(0, 0, 0)';
    case 'slide-left':
      return `translate3d(${distance}px, 0, 0)`;
    case 'slide-right':
      return `translate3d(-${distance}px, 0, 0)`;
    case 'scale':
      return 'translate3d(0, 10px, 0) scale(0.96)';
    case 'slide-up':
      return `translate3d(0, ${Math.round(distance * 1.25)}px, 0)`;
    case 'fade-up':
    default:
      return `translate3d(0, ${distance}px, 0)`;
  }
}

/**
 * Lightweight IntersectionObserver scroll reveal container using GPU transforms and opacity.
 * Content remains visible by default if reduced-motion is enabled or browser observers fail.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  variant = 'fade-up',
  delay = 0,
  duration = MOTION_TIMING.revealMs,
  distance = 20,
  threshold = 0.08,
  once = true,
  immediate = false,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<'visible' | 'hidden'>('visible');

  useEffect(() => {
    if (reducedMotion || immediate || typeof window === 'undefined') {
      return;
    }

    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      return;
    }

    let observer: IntersectionObserver | null = null;
    let rafId = 0;

    try {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setPhase('visible');
              if (once) {
                obs.unobserve(entry.target);
              }
            } else if (!once) {
              setPhase('hidden');
            }
          });
        },
        { threshold, rootMargin: '0px 0px -32px 0px' }
      );
      observer = obs;

      rafId = window.requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        // Only arm hidden initial state when element rests comfortably below initial viewport
        const isBelowFold = rect.top > window.innerHeight * 0.94;
        if (!isBelowFold) {
          setPhase('visible');
          return;
        }

        setPhase('hidden');
        obs.observe(node);
      });
    } catch {
      // Fail open so content is never hidden if observation fails
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      if (observer) observer.disconnect();
    };
  }, [reducedMotion, immediate, threshold, once]);

  const isVisible = reducedMotion || phase === 'visible';
  const style: React.CSSProperties = reducedMotion
    ? {}
    : {
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate3d(0, 0, 0) scale(1)' : getHiddenTransform(variant, distance),
        transition: `opacity ${duration}ms ${MOTION_EASE_CSS} ${delay}ms, transform ${duration}ms ${MOTION_EASE_CSS} ${delay}ms`,
        willChange: isVisible ? 'auto' : 'opacity, transform',
      };

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
};
