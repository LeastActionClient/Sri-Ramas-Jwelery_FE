import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface AdminModalPortalProps {
  children: React.ReactNode;
}

export const AdminModalPortal: React.FC<AdminModalPortalProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
};
