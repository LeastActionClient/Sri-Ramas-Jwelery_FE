import React from 'react';
import { DigiMetalShowcase } from '@/components/customer/DigiMetalShowcase';
import { SEO } from '@/components/common/SEO';

export const DigiGoldPage: React.FC = () => {
  return (
    <>
      <SEO
        title="DigiGold — Save in 24K Pure Gold | Sri Ramas Jewellery"
        description="Begin your pure 24K 999 gold savings journey with flexible amounts and showroom physical conversion at Sri Ramas Jewellery."
        canonical="https://sriramasjewellery.com/digigold"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'DigiGold', path: '/digigold' }
        ]}
      />
      <DigiMetalShowcase metal="GOLD" />
    </>
  );
};
