import React, { useEffect, useRef, useState } from 'react';
import { MOTION_EASE_CSS, MOTION_TIMING, usePrefersReducedMotion, useViewportTier } from '@/utils/motion';

interface StaggerRevealProps {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
  getItemClassName?: (child: React.ReactNode, index: number) => string;
  staggerMs?: number;
  durationMs?: number;
  distance?: number;
  variant?: 'fade-up' | 'scale';
  role?: string;
}

/**
 * Staggers a collection of child elements cleanly when the group enters the viewport.
 */
export const StaggerReveal: React.FC<StaggerRevealProps> = ({
  children,
  className = '',
  itemClassName = '',
  getItemClassName,
  staggerMs = MOTION_TIMING.staggerMs,
  durationMs = 560,
  distance = 18,
  variant = 'fade-up',
  role,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const tier = useViewportTier();
  const [revealed, setRevealed] = useState(true);

  useEffect(() => {
    if (reducedMotion || typeof window === 'undefined') return;
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    let observer: IntersectionObserver | null = null;
    let rafId = 0;

    try {
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setRevealed(true);
            obs.unobserve(node);
          }
        },
        { threshold: 0.06, rootMargin: '0px 0px -24px 0px' }
      );
      observer = obs;

      rafId = window.requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.94) {
          setRevealed(true);
          return;
        }

        setRevealed(false);
        obs.observe(node);
      });
    } catch {
      // Fail open
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      if (observer) observer.disconnect();
    };
  }, [reducedMotion]);

  const effectiveStagger = tier === 'mobile' ? Math.min(staggerMs, 45) : staggerMs;
  const items = React.Children.toArray(children);

  return (
    <div ref={containerRef} role={role} className={className}>
      {items.map((child, idx) => {
        const delay = Math.min(idx, 11) * effectiveStagger;
        const hiddenTransform =
          variant === 'scale'
            ? 'translate3d(0, 12px, 0) scale(0.96)'
            : `translate3d(0, ${distance}px, 0)`;

        const style: React.CSSProperties = reducedMotion
          ? {}
          : {
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translate3d(0, 0, 0) scale(1)' : hiddenTransform,
              transition: `opacity ${durationMs}ms ${MOTION_EASE_CSS} ${delay}ms, transform ${durationMs}ms ${MOTION_EASE_CSS} ${delay}ms`,
            };

        const customItemClass = getItemClassName ? getItemClassName(child, idx) : '';
        const combinedClass = [itemClassName, customItemClass].filter(Boolean).join(' ');

        return (
          <div
            key={(child as React.ReactElement)?.key ?? idx}
            style={style}
            className={combinedClass || undefined}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};
