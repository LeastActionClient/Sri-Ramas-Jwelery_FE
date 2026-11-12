import React from 'react';
import { usePrefersReducedMotion } from '@/utils/motion';

interface PageTransitionProps {
  routeKey: string;
  children: React.ReactNode;
}

/**
 * Lightweight GPU-only page settle wrapper for customer routes.
 * Renders content immediately without blocking clicks or showing blank screens.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ routeKey, children }) => {
  const reducedMotion = usePrefersReducedMotion();

  if (reducedMotion) {
    return <>{children}</>;
  }

  return (
    <div key={routeKey} className="animate-page-enter">
      {children}
    </div>
  );
};
