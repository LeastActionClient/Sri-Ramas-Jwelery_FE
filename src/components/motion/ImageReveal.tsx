import React, { useState } from 'react';
import { MOTION_EASE_CSS, usePrefersReducedMotion } from '@/utils/motion';

interface ImageRevealProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onLoad'> {
  wrapperClassName?: string;
  onImageError?: () => void;
  subtleZoom?: boolean;
}

/**
 * Progressive luxury image reveal: maintains aspect container stability with soft opacity & gentle scale settle.
 */
export const ImageReveal: React.FC<ImageRevealProps> = ({
  wrapperClassName = '',
  className = '',
  subtleZoom = true,
  onImageError,
  alt,
  src,
  ...imgProps
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const isLoaded = reducedMotion || loadedSrc === src;

  const revealStyle: React.CSSProperties = reducedMotion
    ? {}
    : {
        opacity: isLoaded ? 1 : 0.72,
        transform: isLoaded
          ? 'scale(1)'
          : subtleZoom
          ? 'scale(1.035)'
          : 'scale(1)',
        transition: `opacity 480ms ${MOTION_EASE_CSS}, transform 620ms ${MOTION_EASE_CSS}`,
      };

  return (
    <div className={`w-full h-full overflow-hidden ${wrapperClassName}`} style={revealStyle}>
      <img
        src={src}
        alt={alt}
        className={className}
        onLoad={() => {
          if (src) setLoadedSrc(src);
        }}
        onError={() => {
          onImageError?.();
        }}
        {...imgProps}
      />
    </div>
  );
};
