import React, { useEffect, useRef, useState } from 'react';
import { MOTION_EASE_CSS, usePrefersReducedMotion } from '@/utils/motion';

interface AnimatedHeadingProps {
  kicker?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: 'left' | 'center';
  theme?: 'light' | 'dark';
  showRule?: boolean;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  kickerClassName?: string;
}

/**
 * Editorial luxury heading reveal with subtle eyebrow letter-spacing settle, hairline rule, and serif slide-up.
 */
export const AnimatedHeading: React.FC<AnimatedHeadingProps> = ({
  kicker,
  title,
  subtitle,
  align = 'left',
  theme = 'light',
  showRule = false,
  as = 'h2',
  className = '',
  titleClassName = '',
  subtitleClassName = '',
  kickerClassName = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [revealed, setRevealed] = useState(true);

  useEffect(() => {
    if (reducedMotion || typeof window === 'undefined') return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    let observer: IntersectionObserver | null = null;
    let rafId = 0;

    try {
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            setRevealed(true);
            obs.unobserve(node);
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -24px 0px' }
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

  const isVisible = reducedMotion || revealed;
  const isCenter = align === 'center';

  const kickerStyle: React.CSSProperties = reducedMotion
    ? {}
    : {
        opacity: isVisible ? 1 : 0,
        letterSpacing: isVisible ? undefined : '0.12em',
        transition: `opacity 520ms ${MOTION_EASE_CSS}, letter-spacing 650ms ${MOTION_EASE_CSS}`,
      };

  const titleStyle: React.CSSProperties = reducedMotion
    ? {}
    : {
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 14px, 0)',
        transition: `opacity 620ms ${MOTION_EASE_CSS} 80ms, transform 620ms ${MOTION_EASE_CSS} 80ms`,
      };

  const subStyle: React.CSSProperties = reducedMotion
    ? {}
    : {
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 12px, 0)',
        transition: `opacity 620ms ${MOTION_EASE_CSS} 160ms, transform 620ms ${MOTION_EASE_CSS} 160ms`,
      };

  const ruleStyle: React.CSSProperties = reducedMotion
    ? {}
    : {
        transform: isVisible ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: isCenter ? 'center' : 'left',
        transition: `transform 600ms ${MOTION_EASE_CSS} 60ms`,
      };

  const HeadingTag = as;
  const defaultTitleColor = theme === 'dark' ? 'text-gold-100' : 'text-burgundy-950';
  const defaultKickerColor = theme === 'dark' ? 'text-gold-300' : 'text-gold-700';
  const defaultSubColor = theme === 'dark' ? 'text-gold-200/85' : 'text-stone-600';

  return (
    <div ref={ref} className={`${isCenter ? 'text-center' : 'text-left'} space-y-1.5 ${className}`}>
      {kicker && (
        <div className={`flex items-center gap-2.5 ${isCenter ? 'justify-center' : ''}`}>
          {showRule && (
            <span
              style={ruleStyle}
              className="w-8 h-px bg-[#C99B3B]/85 inline-block"
              aria-hidden="true"
            />
          )}
          <span
            style={kickerStyle}
            className={`text-[11px] sm:text-xs font-bold uppercase tracking-[0.22em] ${defaultKickerColor} ${kickerClassName}`}
          >
            {kicker}
          </span>
          {showRule && isCenter && (
            <span
              style={ruleStyle}
              className="w-8 h-px bg-[#C99B3B]/85 inline-block"
              aria-hidden="true"
            />
          )}
        </div>
      )}

      <HeadingTag
        style={titleStyle}
        className={`font-serif font-bold leading-tight ${defaultTitleColor} ${titleClassName}`}
      >
        {title}
      </HeadingTag>

      {subtitle && (
        <p
          style={subStyle}
          className={`text-xs sm:text-sm leading-relaxed ${defaultSubColor} ${isCenter ? 'mx-auto' : ''} ${subtitleClassName}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};
