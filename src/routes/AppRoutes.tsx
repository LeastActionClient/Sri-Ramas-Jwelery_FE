import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Layouts
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { AdminLayout } from '@/components/admin/AdminLayout';

// Customer Pages
import { HomePage } from '@/pages/customer/HomePage';
import { ProductCatalogPage } from '@/pages/customer/ProductCatalogPage';
import { ProductDetailPage } from '@/pages/customer/ProductDetailPage';
import { SchemesPage } from '@/pages/customer/SchemesPage';
import { DigiGoldPage } from '@/pages/customer/DigiGoldPage';
import { DigiSilverPage } from '@/pages/customer/DigiSilverPage';
import { AboutPage } from '@/pages/customer/AboutPage';
import { ContactPage } from '@/pages/customer/ContactPage';
import { PrivacyPolicyPage, TermsPage } from '@/pages/customer/LegalPages';

// Admin Pages
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { DashboardOverviewPage } from '@/pages/admin/DashboardOverviewPage';
import { ProductManagementPage } from '@/pages/admin/ProductManagementPage';
import { CategoryManagementPage } from '@/pages/admin/CategoryManagementPage';
import { RateManagementPage } from '@/pages/admin/RateManagementPage';
import { EnquiryCrmPage } from '@/pages/admin/EnquiryCrmPage';
import { SchemesManagementPage } from '@/pages/admin/SchemesManagementPage';
import { HomepageCmsPage } from '@/pages/admin/HomepageCmsPage';
import { SeoManagementPage } from '@/pages/admin/SeoManagementPage';

// Helper component to preserve URL search query parameters on redirects (e.g., /collections?category=bangles -> /products?category=bangles)
const RedirectWithSearch: React.FC<{ to: string }> = ({ to }) => {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}`} replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Customer-Facing Showcase Website Routes */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/categories" element={<RedirectWithSearch to="/products" />} />
        <Route path="/products" element={<ProductCatalogPage />} />
        <Route path="/collections" element={<RedirectWithSearch to="/products" />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/rates" element={<Navigate to="/" replace />} />
        <Route path="/schemes" element={<SchemesPage />} />
        <Route path="/schemes/:slug" element={<Navigate to="/schemes" replace />} />
        <Route path="/digigold" element={<DigiGoldPage />} />
        <Route path="/digisilver" element={<DigiSilverPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/stores" element={<Navigate to="/" replace />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
      </Route>

      {/* Admin Login */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Protected Administrative Dashboard Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardOverviewPage />} />
        <Route path="products" element={<ProductManagementPage />} />
        <Route path="categories" element={<CategoryManagementPage />} />
        <Route path="rates" element={<RateManagementPage />} />
        <Route path="enquiries" element={<EnquiryCrmPage />} />
        <Route path="schemes" element={<SchemesManagementPage />} />
        <Route path="banners" element={<HomepageCmsPage key="admin-banners" defaultTab="BANNERS" />} />
        <Route path="seo" element={<SeoManagementPage />} />
        <Route path="digi-cms" element={<Navigate to="/admin/banners" replace />} />
        <Route path="cms" element={<Navigate to="/admin/banners" replace />} />
        <Route path="audit-logs" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
