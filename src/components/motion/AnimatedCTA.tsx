import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

type CTAVariant = 'gold' | 'burgundy' | 'outline' | 'whatsapp';

interface BaseCTAProps {
  variant?: CTAVariant;
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  loading?: boolean;
}

const VARIANT_CLASSES: Record<CTAVariant, string> = {
  gold:
    'bg-brand-gold-gradient text-burgundy-950 font-bold shadow-md hover:shadow-luxury-gold hover:brightness-[1.04] active:scale-[0.98]',
  burgundy:
    'bg-burgundy-900 text-gold-200 font-semibold shadow-sm hover:bg-burgundy-800 hover:text-gold-100 hover:shadow-luxury active:scale-[0.98]',
  outline:
    'border border-[#C69B3D] text-[#450A13] font-semibold bg-transparent hover:bg-[#FAF0D6] hover:border-[#9E751E] active:scale-[0.98]',
  whatsapp:
    'bg-[#25D366] text-white font-bold shadow-md hover:bg-[#20BD5A] hover:shadow-lg active:scale-[0.98] focus-visible:ring-[#25D366]',
};

const BASE_CTA_CLASSES =
  'group inline-flex items-center justify-center gap-2 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-burgundy-950 disabled:opacity-60 disabled:cursor-not-allowed';

type ButtonCTAProps = BaseCTAProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & {
    to?: undefined;
    href?: undefined;
  };

type RouterLinkCTAProps = BaseCTAProps &
  Omit<LinkProps, 'children' | 'className'> & {
    href?: undefined;
  };

type AnchorCTAProps = BaseCTAProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className'> & {
    to?: undefined;
    href: string;
  };

export type AnimatedCTAProps = ButtonCTAProps | RouterLinkCTAProps | AnchorCTAProps;

/**
 * Consistent interactive button/link primitive with focus-visible rings, icon nudge, loading state, and tactile feedback.
 */
export const AnimatedCTA: React.FC<AnimatedCTAProps> = (props) => {
  const { variant = 'gold', className = '', children, icon, loading = false, ...rest } = props;
  const classes = `${BASE_CTA_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`;
  const content = (
    <>
      {children}
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : (
        icon && <span className="inline-flex shrink-0 transition-transform duration-300 group-hover:translate-x-0.5">{icon}</span>
      )}
    </>
  );

  if ('to' in props && props.to !== undefined) {
    const linkRest = rest as Omit<LinkProps, 'children' | 'className' | 'to'>;
    return (
      <Link to={props.to} className={classes} {...linkRest}>
        {content}
      </Link>
    );
  }

  if ('href' in props && props.href !== undefined) {
    const anchorRest = rest as Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className' | 'href'>;
    return (
      <a href={props.href} className={classes} {...anchorRest}>
        {content}
      </a>
    );
  }

  const buttonRest = rest as Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'>;
  return (
    <button
      type={buttonRest.type || 'button'}
      disabled={buttonRest.disabled || loading}
      className={classes}
      {...buttonRest}
    >
      {content}
    </button>
  );
};
