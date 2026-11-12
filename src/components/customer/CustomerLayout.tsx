import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { WhatsAppFloat } from './WhatsAppFloat';
import { PageTransition } from '../motion/PageTransition';

export const CustomerLayout: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-ivory-50 text-stone-900 selection:bg-gold-200 selection:text-burgundy-950 overflow-x-clip w-full max-w-full">
      <Navbar />
      <main className="flex-1">
        <PageTransition routeKey={pathname}>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
};
