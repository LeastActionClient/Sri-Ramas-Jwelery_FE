import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { CustomerLayout } from '@/components/customer/CustomerLayout';
import { AdminLayout } from '@/components/admin/AdminLayout';

// Customer Pages
import { HomePage } from '@/pages/customer/HomePage';
import { CategoriesPage } from '@/pages/customer/CategoriesPage';
import { ProductCatalogPage } from '@/pages/customer/ProductCatalogPage';
import { ProductDetailPage } from '@/pages/customer/ProductDetailPage';
import { RatesPage } from '@/pages/customer/RatesPage';
import { SchemesPage } from '@/pages/customer/SchemesPage';
import { SchemeDetailPage } from '@/pages/customer/SchemeDetailPage';
import { DigiGoldPage } from '@/pages/customer/DigiGoldPage';
import { DigiSilverPage } from '@/pages/customer/DigiSilverPage';
import { AboutPage } from '@/pages/customer/AboutPage';
import { StoresPage } from '@/pages/customer/StoresPage';
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
import { AuditLogsPage } from '@/pages/admin/AuditLogsPage';
import { HomepageCmsPage } from '@/pages/admin/HomepageCmsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Customer-Facing Showcase Website Routes */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/products" element={<ProductCatalogPage />} />
        <Route path="/collections" element={<Navigate to="/products" replace />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/rates" element={<RatesPage />} />
        <Route path="/schemes" element={<SchemesPage />} />
        <Route path="/schemes/:slug" element={<SchemeDetailPage />} />
        <Route path="/digigold" element={<DigiGoldPage />} />
        <Route path="/digisilver" element={<DigiSilverPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/stores" element={<StoresPage />} />
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
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="banners" element={<HomepageCmsPage key="admin-banners" defaultTab="BANNERS" />} />
        <Route path="cms" element={<HomepageCmsPage key="admin-cms" defaultTab="STORES" />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
