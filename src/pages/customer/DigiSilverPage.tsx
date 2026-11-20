import React from 'react';
import { DigiMetalShowcase } from '@/components/customer/DigiMetalShowcase';
import { SEO } from '@/components/common/SEO';

export const DigiSilverPage: React.FC = () => {
  return (
    <>
      <SEO
        title="DigiSilver — Save in 999 Pure Fine Silver | Sri Ramas Jewellery"
        description="Build your precious silver reserves with 999 fine silver digital savings and showroom purity guarantee at Sri Ramas Jewellery."
        canonical="https://sriramasjewellery.com/digisilver"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'DigiSilver', path: '/digisilver' }
        ]}
      />
      <DigiMetalShowcase metal="SILVER" />
    </>
  );
};
