import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  schema?: Record<string, any> | Array<Record<string, any>>;
  googleSiteVerification?: string;
}

const DEFAULT_TITLE = 'Sri Ramas Jewellery | Traditional Gold & Silver Jewellery';
const DEFAULT_DESCRIPTION =
  'Discover elegant gold and silver jewellery at Sri Ramas Jewellery. Explore traditional designs, bridal collections and timeless jewellery craftsmanship.';
const DEFAULT_IMAGE =
  'https://res.cloudinary.com/m7bmcsh3/image/upload/v1795010070/sri-ramas-jewellery/categories/vr78lceiy1fsfyqdnycx.png';
const BASE_DOMAIN = 'https://sriramasjewellery.com';

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  image,
  type = 'website',
  noindex = false,
  breadcrumbs,
  schema,
  googleSiteVerification
}) => {
  const location = useLocation();

  const activeTitle = (title ? `${title.replace(/\s*\|\s*Sri Ramas Jewellery$/i, '')} | Sri Ramas Jewellery` : DEFAULT_TITLE).trim();
  const activeDesc = (description || DEFAULT_DESCRIPTION).trim();
  const activeImage = image || DEFAULT_IMAGE;
  const activeCanonical = canonical || `${BASE_DOMAIN}${location.pathname}${location.search}`;

  useEffect(() => {
    // 1. Update Title
    document.title = activeTitle;

    // Helper to set/update a meta tag
    const setMetaTag = (attribute: string, key: string, content: string) => {
      let element = document.querySelector(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Standard Meta Tags
    setMetaTag('name', 'description', activeDesc);
    setMetaTag('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');

    if (googleSiteVerification) {
      setMetaTag('name', 'google-site-verification', googleSiteVerification);
    }

    // 3. Open Graph Tags
    setMetaTag('property', 'og:title', activeTitle);
    setMetaTag('property', 'og:description', activeDesc);
    setMetaTag('property', 'og:image', activeImage);
    setMetaTag('property', 'og:url', activeCanonical);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:site_name', 'Sri Ramas Jewellery');
    setMetaTag('property', 'og:locale', 'en_IN');

    // 4. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', activeTitle);
    setMetaTag('name', 'twitter:description', activeDesc);
    setMetaTag('name', 'twitter:image', activeImage);

    // 5. Canonical Link Tag
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', activeCanonical);

    // 6. JSON-LD Structured Data
    const jsonLdElements: HTMLScriptElement[] = [];

    // Optional BreadcrumbList Schema
    if (breadcrumbs && breadcrumbs.length > 0) {
      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: b.name,
          item: b.path.startsWith('http') ? b.path : `${BASE_DOMAIN}${b.path}`
        }))
      };

      const bScript = document.createElement('script');
      bScript.type = 'application/ld+json';
      bScript.id = 'seo-breadcrumbs-jsonld';
      bScript.text = JSON.stringify(breadcrumbSchema);
      document.head.appendChild(bScript);
      jsonLdElements.push(bScript);
    }

    // Custom Page or Product Schema
    if (schema) {
      const schemas = Array.isArray(schema) ? schema : [schema];
      schemas.forEach((s, idx) => {
        const pScript = document.createElement('script');
        pScript.type = 'application/ld+json';
        pScript.id = `seo-page-jsonld-${idx}`;
        pScript.text = JSON.stringify(s);
        document.head.appendChild(pScript);
        jsonLdElements.push(pScript);
      });
    }

    // Cleanup on unmount or page change
    return () => {
      jsonLdElements.forEach((el) => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    };
  }, [activeTitle, activeDesc, activeImage, activeCanonical, type, noindex, breadcrumbs, schema, googleSiteVerification]);

  // Render React 19 native tags as well for SSR / Prerender crawlers
  return (
    <>
      <title>{activeTitle}</title>
      <meta name="description" content={activeDesc} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'} />
      <link rel="canonical" href={activeCanonical} />
      <meta property="og:title" content={activeTitle} />
      <meta property="og:description" content={activeDesc} />
      <meta property="og:image" content={activeImage} />
      <meta property="og:url" content={activeCanonical} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Sri Ramas Jewellery" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={activeTitle} />
      <meta name="twitter:description" content={activeDesc} />
      <meta name="twitter:image" content={activeImage} />
    </>
  );
};
