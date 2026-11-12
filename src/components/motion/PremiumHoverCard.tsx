import React from 'react';

interface PremiumHoverCardProps {
  children: React.ReactNode;
  className?: string;
  lift?: 'subtle' | 'medium';
}

/**
 * Standardized luxury card surface providing subtle upward elevation and antique-gold border emphasis on hover.
 */
export const PremiumHoverCard: React.FC<PremiumHoverCardProps> = ({
  children,
  className = '',
  lift = 'medium',
}) => {
  const liftClass =
    lift === 'subtle' ? 'hover:-translate-y-1' : 'hover:-translate-y-1.5';

  return (
    <div
      className={`gold-rim-glow ${liftClass} focus-within:ring-2 focus-within:ring-gold-400/50 ${className}`}
    >
      {children}
    </div>
  );
};
