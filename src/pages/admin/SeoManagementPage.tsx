import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Globe,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  RefreshCw,
  FolderTree,
  Gem,
  Smartphone,
  Monitor,
  Eye,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import { seoApi, ISeoSettings, IPageSeo } from '@/services/api/seo.api';
import { categoriesApi } from '@/services/api/categories.api';
import { productsApi } from '@/services/api/products.api';

export const SeoManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'DEFAULTS' | 'PAGES' | 'PREVIEWS' | 'TOOLS'>('DEFAULTS');
  const [selectedPreviewPage, setSelectedPreviewPage] = useState<string>('HOME');
  const [previewDevice, setPreviewDevice] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ISeoSettings>>({
    siteDefaultTitle: '',
    siteDefaultDescription: '',
    siteDefaultOgImage: '',
    googleSearchConsoleVerification: '',
    pages: []
  });

  // Fetch SEO Settings from backend
  const { data: seoSettings, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-seo-settings'],
    queryFn: seoApi.getAdminSettings
  });

  // Fetch categories & products for SEO audit tab
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories
  });

  const { data: productsData } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => productsApi.adminGetProducts({ limit: 100 })
  });
  const products = productsData?.products || [];

  useEffect(() => {
    if (seoSettings) {
      setFormData({
        siteDefaultTitle: seoSettings.siteDefaultTitle || '',
        siteDefaultDescription: seoSettings.siteDefaultDescription || '',
        siteDefaultOgImage: seoSettings.siteDefaultOgImage || '',
        googleSearchConsoleVerification: seoSettings.googleSearchConsoleVerification || '',
        pages: seoSettings.pages || []
      });
    }
  }, [seoSettings]);

  const saveMutation = useMutation({
    mutationFn: (payload: Partial<ISeoSettings>) => seoApi.updateAdminSettings(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['admin-seo-settings'], updated);
      queryClient.invalidateQueries({ queryKey: ['admin-seo-settings'] });
      setFeedback({ type: 'success', message: 'SEO configuration saved successfully.' });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.error?.message || 'Failed to save SEO settings.'
      });
    }
  });

  const handlePageFieldChange = (index: number, field: keyof IPageSeo, value: any) => {
    setFormData((prev) => {
      const nextPages = [...(prev.pages || [])];
      nextPages[index] = {
        ...nextPages[index],
        [field]: value
      };
      return { ...prev, pages: nextPages };
    });
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  // Preview computation
  const activePreviewData = () => {
    const page = formData.pages?.find((p) => p.pageKey === selectedPreviewPage);
    const title = page?.title || formData.siteDefaultTitle || 'Sri Ramas Jewellery';
    const description =
      page?.description ||
      formData.siteDefaultDescription ||
      'Discover traditional South Indian gold and silver jewellery at Sri Ramas Jewellery.';
    const path = page?.path || '/';
    return { title, description, path };
  };

  const preview = activePreviewData();

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="font-serif text-2xl font-bold text-burgundy-950 flex items-center gap-2">
            <Search className="w-6 h-6 text-gold-600" />
            <span>SEO &amp; Search Engine Management</span>
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Configure dynamic page titles, meta descriptions, Google Search Console, Open Graph cards, XML sitemaps, and robots.txt.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-700 hover:text-burgundy-900 text-xs font-semibold shadow-xs transition-colors"
          >
            <span>XML Sitemap</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="/robots.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-700 hover:text-burgundy-900 text-xs font-semibold shadow-xs transition-colors"
          >
            <span>robots.txt</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs sm:text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('DEFAULTS')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'DEFAULTS'
              ? 'bg-burgundy-900 text-gold-200 shadow-sm'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          1. Global Site Defaults
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('PAGES')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'PAGES'
              ? 'bg-burgundy-900 text-gold-200 shadow-sm'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          2. Page-Wise Metadata
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('PREVIEWS')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'PREVIEWS'
              ? 'bg-burgundy-900 text-gold-200 shadow-sm'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          3. Google SERP Simulator
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('TOOLS')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'TOOLS'
              ? 'bg-burgundy-900 text-gold-200 shadow-sm'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          4. Sitemap &amp; Audit
        </button>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* TAB 1: Global Site Defaults */}
        {activeTab === 'DEFAULTS' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5 shadow-xs">
            <div>
              <h2 className="font-serif font-bold text-base text-burgundy-950 flex items-center gap-2">
                <Globe className="w-4 h-4 text-gold-600" />
                <span>Global Fallback Metadata</span>
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                These defaults are used whenever a specific jewellery piece or landing page does not specify custom metadata.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase text-stone-700">
                    Default Website Title *
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      (formData.siteDefaultTitle?.length || 0) > 60
                        ? 'text-amber-600 font-bold'
                        : 'text-stone-400'
                    }`}
                  >
                    {formData.siteDefaultTitle?.length || 0} / 60 recommended
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={formData.siteDefaultTitle}
                  onChange={(e) => setFormData({ ...formData, siteDefaultTitle: e.target.value })}
                  placeholder="e.g. Sri Ramas Jewellery | Traditional Gold & Silver Jewellery"
                  className="w-full p-2.5 border border-stone-300 rounded-lg text-sm outline-none focus:border-gold-500 bg-white"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase text-stone-700">
                    Default Meta Description *
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      (formData.siteDefaultDescription?.length || 0) > 160
                        ? 'text-amber-600 font-bold'
                        : 'text-stone-400'
                    }`}
                  >
                    {formData.siteDefaultDescription?.length || 0} / 160 recommended
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={formData.siteDefaultDescription}
                  onChange={(e) => setFormData({ ...formData, siteDefaultDescription: e.target.value })}
                  placeholder="e.g. Discover elegant gold and silver jewellery at Sri Ramas Jewellery..."
                  className="w-full p-2.5 border border-stone-300 rounded-lg text-sm outline-none focus:border-gold-500 bg-white leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                  Default Open Graph / Social Share Image URL
                </label>
                <input
                  type="url"
                  value={formData.siteDefaultOgImage}
                  onChange={(e) => setFormData({ ...formData, siteDefaultOgImage: e.target.value })}
                  placeholder="https://res.cloudinary.com/..."
                  className="w-full p-2.5 border border-stone-300 rounded-lg text-sm outline-none focus:border-gold-500 bg-white font-mono text-xs"
                />
              </div>

              <div className="pt-2 border-t border-stone-100">
                <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                  Google Search Console Verification Meta Tag Content
                </label>
                <p className="text-[11px] text-stone-500 mb-1.5">
                  Paste the verification code from your Google Search Console HTML tag (the value inside <code className="bg-stone-100 px-1 py-0.5 rounded">content="..."</code>).
                </p>
                <input
                  type="text"
                  value={formData.googleSearchConsoleVerification}
                  onChange={(e) => setFormData({ ...formData, googleSearchConsoleVerification: e.target.value })}
                  placeholder="e.g. 4X98b_example_google_site_verification_code_here"
                  className="w-full p-2.5 border border-stone-300 rounded-lg text-sm outline-none focus:border-gold-500 bg-white font-mono text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Page-Wise Metadata */}
        {activeTab === 'PAGES' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
              <h2 className="font-serif font-bold text-base text-burgundy-950 flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-gold-600" />
                <span>Primary Public Landing Pages</span>
              </h2>
              <p className="text-xs text-stone-500">
                Tailor unique titles and descriptions for each key section of Sri Ramas Jewellery to maximize search visibility.
              </p>
            </div>

            <div className="space-y-4">
              {formData.pages?.map((page, idx) => (
                <div
                  key={page.pageKey || idx}
                  className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3.5 shadow-xs hover:border-gold-300 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gold-500" />
                      <span className="font-bold text-burgundy-950 text-sm">{page.pageName}</span>
                      <code className="text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-mono">
                        {page.path}
                      </code>
                    </div>

                    <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={page.noIndex || false}
                        onChange={(e) => handlePageFieldChange(idx, 'noIndex', e.target.checked)}
                        className="rounded text-burgundy-900 focus:ring-gold-500"
                      />
                      <span>Prevent Indexing (noindex)</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-stone-700">SEO Title</label>
                        <span
                          className={`text-[10px] font-mono ${
                            (page.title?.length || 0) > 60 ? 'text-amber-600 font-bold' : 'text-stone-400'
                          }`}
                        >
                          {page.title?.length || 0} / 60
                        </span>
                      </div>
                      <input
                        type="text"
                        value={page.title}
                        onChange={(e) => handlePageFieldChange(idx, 'title', e.target.value)}
                        className="w-full p-2 border border-stone-300 rounded-lg text-xs sm:text-sm outline-none focus:border-gold-500 bg-white"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-stone-700">Meta Description</label>
                        <span
                          className={`text-[10px] font-mono ${
                            (page.description?.length || 0) > 160 ? 'text-amber-600 font-bold' : 'text-stone-400'
                          }`}
                        >
                          {page.description?.length || 0} / 160
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={page.description}
                        onChange={(e) => handlePageFieldChange(idx, 'description', e.target.value)}
                        className="w-full p-2 border border-stone-300 rounded-lg text-xs sm:text-sm outline-none focus:border-gold-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Google SERP Simulator */}
        {activeTab === 'PREVIEWS' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <h2 className="font-serif font-bold text-base text-burgundy-950 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gold-600" />
                  <span>Google Search Result Snippet Simulation</span>
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Preview how customers will see Sri Ramas Jewellery in Google search engine rankings.
                </p>
              </div>

              {/* Page Selector & Device Toggle */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedPreviewPage}
                  onChange={(e) => setSelectedPreviewPage(e.target.value)}
                  className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-semibold bg-white outline-none focus:border-gold-500"
                >
                  {formData.pages?.map((p) => (
                    <option key={p.pageKey} value={p.pageKey}>
                      {p.pageName}
                    </option>
                  ))}
                </select>

                <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('DESKTOP')}
                    className={`p-1.5 transition-colors ${
                      previewDevice === 'DESKTOP' ? 'bg-burgundy-900 text-gold-200' : 'bg-white text-stone-600'
                    }`}
                    title="Desktop snippet"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('MOBILE')}
                    className={`p-1.5 transition-colors ${
                      previewDevice === 'MOBILE' ? 'bg-burgundy-900 text-gold-200' : 'bg-white text-stone-600'
                    }`}
                    title="Mobile snippet"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Google Search Result Card (Authentic Google SERP Design) */}
            <div className="p-6 bg-stone-50 rounded-xl border border-stone-200/80 flex justify-center">
              <div
                className={`bg-white p-4 sm:p-5 rounded-lg border border-stone-200 shadow-xs transition-all ${
                  previewDevice === 'MOBILE' ? 'max-w-sm w-full' : 'max-w-2xl w-full'
                }`}
              >
                {/* Header: Favicon + Domain URL */}
                <div className="flex items-center gap-2 mb-1.5">
                  <img src="/logo.jpg" alt="Logo" className="w-4 h-4 rounded-full object-cover shrink-0" />
                  <div className="leading-tight">
                    <div className="text-[12px] text-[#202124] font-medium">Sri Ramas Jewellery</div>
                    <div className="text-[11px] text-[#4d5156] truncate">
                      https://sriramasjewellery.com{preview.path}
                    </div>
                  </div>
                </div>

                {/* Google Blue Link Title */}
                <h3 className="text-base sm:text-lg text-[#1a0dab] hover:underline font-normal leading-snug cursor-pointer line-clamp-2">
                  {preview.title}
                </h3>

                {/* Google Snippet Description */}
                <p className="text-xs sm:text-[13px] text-[#4d5156] leading-relaxed mt-1 line-clamp-3">
                  {preview.description}
                </p>

                {/* Sitelinks simulation */}
                <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap gap-2 text-[11px] text-[#1a0dab]">
                  <span className="hover:underline cursor-pointer">Gold Collections</span>
                  <span>•</span>
                  <span className="hover:underline cursor-pointer">Silver Articles</span>
                  <span>•</span>
                  <span className="hover:underline cursor-pointer">Savings Schemes</span>
                  <span>•</span>
                  <span className="hover:underline cursor-pointer">Showroom Contact</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-bold">Google Rich Results &amp; Schema Guarantee:</div>
              <p>
                Each jewellery product automatically renders <strong>Schema.org / Product</strong> and <strong>BreadcrumbList</strong> JSON-LD, declaring brand, hallmarked metal purity, image gallery, and enquiry contacts without misleading price formulas or false reviews.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: Sitemap & Audit Tools */}
        {activeTab === 'TOOLS' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-6 shadow-xs">
            <div>
              <h2 className="font-serif font-bold text-base text-burgundy-950 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-gold-600" />
                <span>SEO Structure &amp; Dynamic URL Index</span>
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Real-time review of canonical URLs automatically generated for approved categories and published jewellery pieces.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Approved Categories & Slugs */}
              <div className="border border-stone-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-xs uppercase tracking-wider text-burgundy-950 flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-gold-600" />
                    <span>Approved Categories ({categories.length})</span>
                  </span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                    Indexed in Sitemap
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1.5 divide-y divide-stone-100 text-xs">
                  {categories.map((c) => (
                    <div key={c._id} className="pt-1.5 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-stone-800">
                          {c.parentCategory ? `↳ ${c.name}` : c.name}
                        </span>
                        <span className="text-[10px] text-stone-400 ml-1">({c.metalType})</span>
                      </div>
                      <code className="text-[10px] text-gold-700 font-mono bg-stone-50 px-1.5 py-0.5 rounded">
                        /{c.slug}
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Published Products */}
              <div className="border border-stone-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-xs uppercase tracking-wider text-burgundy-950 flex items-center gap-1.5">
                    <Gem className="w-3.5 h-3.5 text-gold-600" />
                    <span>Published Products ({products.length})</span>
                  </span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                    Indexed in Sitemap
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1.5 divide-y divide-stone-100 text-xs">
                  {products.map((p) => (
                    <div key={p._id} className="pt-1.5 flex items-center justify-between">
                      <span className="font-semibold text-stone-800 truncate max-w-[200px]" title={p.title}>
                        {p.title}
                      </span>
                      <code className="text-[10px] text-gold-700 font-mono bg-stone-50 px-1.5 py-0.5 rounded truncate max-w-[150px]">
                        /products/{p.slug}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-stone-600">
                <span>Showroom Location Data: </span>
                <strong className="text-stone-900">
                  18/995, South East Rampart, Thanjavur, Tamil Nadu 613001
                </strong>
                <span className="block text-[11px] text-stone-500 mt-0.5">
                  Schema verified • LocalBusiness Geo: 10.787° N, 79.1378° E • Open 9:00 AM – 9:30 PM (All 7 Days)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-700 hover:text-burgundy-900 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Index</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-burgundy-900 hover:bg-burgundy-800 text-gold-200 font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saveMutation.isPending ? 'Saving...' : 'Save SEO Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
