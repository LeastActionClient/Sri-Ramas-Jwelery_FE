import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Ensures every navigation (public routes, detail pages, legal pages, admin routes,
 * and browser history navigation) lands cleanly at the top of the page, while respecting
 * `#anchor` links and avoiding jarring jumps while typing search/filter inputs in place.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname, search, hash } = useLocation();
  const prevPathRef = useRef<string>(pathname);
  const prevSearchRef = useRef<string>(search);

  useEffect(() => {
    if (hash) {
      const targetId = hash.slice(1);
      const timer = window.setTimeout(() => {
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 60);
      prevPathRef.current = pathname;
      prevSearchRef.current = search;
      return () => window.clearTimeout(timer);
    }

    const pathChanged = prevPathRef.current !== pathname;
    const searchChanged = prevSearchRef.current !== search;
    prevPathRef.current = pathname;
    prevSearchRef.current = search;

    if (pathChanged) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return;
    }

    if (searchChanged && window.scrollY > 360) {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isEditingControl = activeTag === 'input' || activeTag === 'select' || activeTag === 'textarea';
      if (!isEditingControl) {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
    }
  }, [pathname, search, hash]);

  return null;
};
