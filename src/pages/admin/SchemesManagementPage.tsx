import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Eye,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Power,
  Award,
} from 'lucide-react';
import { schemesApi } from '@/services/api/schemes.api';
import { SchemePlan } from '@/types';
import { formatPaiseToInr, paiseToRupees, rupeesToPaise } from '@/utils/currency';
import { ImageDropzone } from '@/components/admin/ImageDropzone';
import { SchemeBannerCard } from '@/components/customer/SchemeBannerCard';
import { sanitizeMultilineText, stripHtmlAndControlChars } from '@/utils/inputSanitize';

interface SchemeEditorState {
  name: string;
  slug: string;
  tagline: string;
  shortDescription: string;
  fullDescription: string;
  durationLabel: string;
  tenureMonths: string;
  minMonthlyRupees: string;
  benefitsText: string;
  termsText: string;
  bannerImageUrl: string;
  bannerImagePublicId: string;
  mobileBannerImageUrl: string;
  mobileBannerImagePublicId: string;
  logoImageUrl: string;
  textAlignment: 'left' | 'right';
  ctaText: string;
  whatsappMessage: string;
  displayOrder: number;
  isActive: boolean;
}

function createEmptyEditorState(nextOrder: number): SchemeEditorState {
  return {
    name: '',
    slug: '',
    tagline: '',
    shortDescription: '',
    fullDescription: '',
    durationLabel: '',
    tenureMonths: '',
    minMonthlyRupees: '',
    benefitsText: '',
    termsText: '',
    bannerImageUrl: '',
    bannerImagePublicId: '',
    mobileBannerImageUrl: '',
    mobileBannerImagePublicId: '',
    logoImageUrl: '',
    textAlignment: 'right',
    ctaText: 'JOIN NOW',
    whatsappMessage: '',
    displayOrder: nextOrder,
    isActive: true,
  };
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s.-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const SchemesManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<SchemePlan | null>(null);
  const [form, setForm] = useState<SchemeEditorState>(() => createEmptyEditorState(1));
  const [saving, setSaving] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: schemes = [], isLoading } = useQuery({
    queryKey: ['admin', 'schemes'],
    queryFn: schemesApi.adminGetSchemes,
  });

  const sortedSchemes = useMemo(
    () => [...schemes].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    [schemes]
  );

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'schemes'] });
    queryClient.invalidateQueries({ queryKey: ['schemes'] });
  };

  const openCreateModal = () => {
    setEditingScheme(null);
    setErrorMsg(null);
    setForm(createEmptyEditorState(sortedSchemes.length + 1));
    setIsModalOpen(true);
  };

  const openEditModal = (scheme: SchemePlan) => {
    setEditingScheme(scheme);
    setErrorMsg(null);
    const minPaise = scheme.minMonthlyAmountPaise ?? scheme.minimumMonthlyAmountPaise;
    setForm({
      name: scheme.name || '',
      slug: scheme.slug || '',
      tagline: scheme.tagline || '',
      shortDescription: scheme.shortDescription || scheme.description || '',
      fullDescription: scheme.fullDescription || '',
      durationLabel: scheme.durationLabel || '',
      tenureMonths:
        typeof scheme.tenureMonths === 'number' && scheme.tenureMonths > 0
          ? String(scheme.tenureMonths)
          : '',
      minMonthlyRupees:
        typeof minPaise === 'number' && minPaise > 0
          ? String(paiseToRupees(minPaise))
          : '',
      benefitsText: (scheme.benefits || []).join('\n'),
      termsText: (scheme.terms || []).join('\n'),
      bannerImageUrl: scheme.bannerImageUrl || '',
      bannerImagePublicId: scheme.bannerImagePublicId || '',
      mobileBannerImageUrl: scheme.mobileBannerImageUrl || '',
      mobileBannerImagePublicId: scheme.mobileBannerImagePublicId || '',
      logoImageUrl: scheme.logoImageUrl || '',
      textAlignment: scheme.textAlignment === 'left' ? 'left' : 'right',
      ctaText: scheme.ctaText || 'JOIN NOW',
      whatsappMessage: scheme.whatsappMessage || '',
      displayOrder: scheme.displayOrder ?? 0,
      isActive: scheme.isActive ?? true,
    });
    setIsModalOpen(true);
  };

  const previewScheme: SchemePlan = useMemo(() => {
    const minRupeesNum = Number(form.minMonthlyRupees);
    const tenureNum = Number(form.tenureMonths);
    return {
      _id: editingScheme?._id || 'preview',
      name: form.name.trim() || 'Scheme Title Preview',
      slug: form.slug.trim() || 'preview',
      tagline: form.tagline.trim(),
      shortDescription: form.shortDescription.trim(),
      fullDescription: form.fullDescription.trim(),
      description: form.shortDescription.trim() || form.tagline.trim(),
      benefits: form.benefitsText.split('\n').map((s) => s.trim()).filter(Boolean),
      terms: form.termsText.split('\n').map((s) => s.trim()).filter(Boolean),
      durationLabel: form.durationLabel.trim(),
      tenureMonths: Number.isFinite(tenureNum) && tenureNum > 0 ? tenureNum : undefined,
      minMonthlyAmountPaise:
        Number.isFinite(minRupeesNum) && minRupeesNum > 0
          ? rupeesToPaise(minRupeesNum)
          : undefined,
      bannerImageUrl: form.bannerImageUrl,
      mobileBannerImageUrl: form.mobileBannerImageUrl,
      logoImageUrl: form.logoImageUrl,
      textAlignment: form.textAlignment,
      ctaText: form.ctaText || 'JOIN NOW',
      whatsappMessage: form.whatsappMessage,
      displayOrder: Number(form.displayOrder) || 0,
      isActive: form.isActive,
      createdAt: '',
      updatedAt: '',
    };
  }, [form, editingScheme]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = stripHtmlAndControlChars(form.name).trim();
    if (cleanName.length < 2) {
      setErrorMsg('Scheme name must be at least 2 characters.');
      return;
    }

    const cleanSlug = (form.slug.trim() || toSlug(cleanName)).toLowerCase();
    if (!/^[a-z0-9.-]+$/.test(cleanSlug)) {
      setErrorMsg('Slug may contain only lowercase letters, numbers, dots, and hyphens.');
      return;
    }

    const parsedMinRupees = form.minMonthlyRupees.trim()
      ? Number(form.minMonthlyRupees)
      : undefined;
    if (
      parsedMinRupees !== undefined &&
      (!Number.isFinite(parsedMinRupees) || parsedMinRupees <= 0)
    ) {
      setErrorMsg('Minimum monthly amount must be a positive rupee number (or leave blank).');
      return;
    }

    const parsedTenure = form.tenureMonths.trim() ? Number(form.tenureMonths) : undefined;
    if (
      parsedTenure !== undefined &&
      (!Number.isInteger(parsedTenure) || parsedTenure < 1 || parsedTenure > 120)
    ) {
      setErrorMsg('Tenure months must be between 1 and 120 (or leave blank).');
      return;
    }

    setSaving(true);
    try {
      const benefits = sanitizeMultilineText(form.benefitsText)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const terms = sanitizeMultilineText(form.termsText)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const payload: Partial<SchemePlan> = {
        name: cleanName,
        slug: cleanSlug,
        tagline: stripHtmlAndControlChars(form.tagline).trim() || undefined,
        shortDescription: sanitizeMultilineText(form.shortDescription).trim() || undefined,
        fullDescription: sanitizeMultilineText(form.fullDescription).trim() || undefined,
        durationLabel: stripHtmlAndControlChars(form.durationLabel).trim() || undefined,
        tenureMonths: parsedTenure,
        minMonthlyAmountPaise: parsedMinRupees ? rupeesToPaise(parsedMinRupees) : undefined,
        benefits,
        terms,
        benefitDescription: benefits.join('\n') || undefined,
        termsAndConditions: terms.join('\n') || undefined,
        bannerImageUrl: form.bannerImageUrl.trim() || undefined,
        bannerImagePublicId: form.bannerImagePublicId.trim() || undefined,
        mobileBannerImageUrl: form.mobileBannerImageUrl.trim() || undefined,
        mobileBannerImagePublicId: form.mobileBannerImagePublicId.trim() || undefined,
        logoImageUrl: form.logoImageUrl.trim() || undefined,
        textAlignment: form.textAlignment,
        ctaText: stripHtmlAndControlChars(form.ctaText).trim() || 'JOIN NOW',
        whatsappMessage: sanitizeMultilineText(form.whatsappMessage).trim() || undefined,
        displayOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive,
      };

      if (editingScheme) {
        await schemesApi.adminUpdateScheme(editingScheme._id, payload);
        setToastMsg(`Updated savings scheme "${cleanName}".`);
      } else {
        await schemesApi.adminCreateScheme(payload);
        setToastMsg(`Created savings scheme "${cleanName}".`);
      }

      invalidateAll();
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to save savings scheme.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (scheme: SchemePlan) => {
    try {
      await schemesApi.adminUpdateScheme(scheme._id, {
        isActive: !scheme.isActive,
      });
      setToastMsg(
        `Scheme "${scheme.name}" ${scheme.isActive ? 'hidden from public site' : 'published to public site'}.`
      );
      invalidateAll();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error?.message || 'Failed to update scheme status.');
    }
  };

  const handleDelete = async (scheme: SchemePlan) => {
    if (
      !window.confirm(
        `Delete scheme "${scheme.name}" permanently? You can deactivate it instead if you wish to keep it archived.`
      )
    ) {
      return;
    }
    try {
      await schemesApi.adminDeleteScheme(scheme._id);
      setToastMsg(`Deleted savings scheme "${scheme.name}".`);
      invalidateAll();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error?.message || 'Failed to delete savings scheme.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
            Jewellery Savings Schemes CMS
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage luxury banner images, display order, scheme descriptions, highlights, terms, and WhatsApp enquiry prompts.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-maroon-gradient text-gold-200 text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-95"
        >
          <Plus className="w-4 h-4 text-gold-400" />
          <span>New Savings Scheme</span>
        </button>
      </div>

      {toastMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button type="button" onClick={() => setToastMsg(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && !isModalOpen && (
        <div className="p-3 bg-red-50 border border-red-300 text-xs text-red-800 rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-red-700 hover:text-red-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Schemes Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold">
              <tr>
                <th className="p-4 w-14">Order</th>
                <th className="p-4">Banner</th>
                <th className="p-4">Scheme Name</th>
                <th className="p-4">Optional Terms Info</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400">
                    Loading savings schemes...
                  </td>
                </tr>
              ) : sortedSchemes.length > 0 ? (
                sortedSchemes.map((scheme) => {
                  const minPaise = scheme.minMonthlyAmountPaise ?? scheme.minimumMonthlyAmountPaise;
                  return (
                    <tr key={scheme._id} className="hover:bg-stone-50">
                      <td className="p-4 font-mono text-stone-500">#{scheme.displayOrder ?? 0}</td>
                      <td className="p-4">
                        {scheme.bannerImageUrl ? (
                          <img
                            src={scheme.bannerImageUrl}
                            alt={scheme.name}
                            className="w-24 h-12 rounded-lg object-cover border border-gold-300/60"
                          />
                        ) : (
                          <div className="w-24 h-12 rounded-lg bg-burgundy-950 flex items-center justify-center text-gold-400">
                            <Award className="w-5 h-5" />
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-serif font-bold text-sm text-burgundy-950 block">
                          {scheme.name}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          /schemes/{scheme.slug} • Align: {scheme.textAlignment || 'right'}
                        </span>
                      </td>
                      <td className="p-4 text-stone-600">
                        <div className="space-y-0.5">
                          {(scheme.durationLabel || scheme.tenureMonths) && (
                            <span className="inline-block px-2 py-0.5 rounded bg-gold-100 text-burgundy-900 font-semibold mr-1.5">
                              {scheme.durationLabel || `${scheme.tenureMonths} Months`}
                            </span>
                          )}
                          {typeof minPaise === 'number' && minPaise > 0 && (
                            <span className="inline-block font-semibold text-stone-800">
                              From {formatPaiseToInr(minPaise)}/mo
                            </span>
                          )}
                          {!scheme.durationLabel && !scheme.tenureMonths && !minPaise && (
                            <span className="text-stone-400 italic">Confirmed in showroom</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(scheme)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            scheme.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{scheme.isActive ? 'Published' : 'Hidden'}</span>
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        <a
                          href={`/schemes/${scheme.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600"
                          title="Open Public Scheme Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => openEditModal(scheme)}
                          className="inline-flex p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700"
                          title="Edit Scheme"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(scheme)}
                          className="inline-flex p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                          title="Delete Scheme"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400">
                    No savings schemes configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Scrollable Modal with Live Preview */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-gold-500/40 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-burgundy-900 text-gold-100 p-5 border-b border-gold-600/40 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-serif font-bold text-lg text-gold-100">
                  {editingScheme ? `Edit Scheme: ${editingScheme.name}` : 'Create New Savings Scheme'}
                </h2>
                <p className="text-[11px] text-gold-300/80">
                  Leave optional duration or installment amounts empty unless officially finalised.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowLivePreview((p) => !p)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-burgundy-800 text-gold-200 text-[11px] font-semibold border border-gold-500/30"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showLivePreview ? 'Hide Preview' : 'Preview Card'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-gold-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-5 text-xs">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {showLivePreview && (
                  <div className="space-y-2">
                    <span className="block font-bold uppercase tracking-wider text-stone-500 text-[10px]">
                      Live Banner Card Preview
                    </span>
                    <SchemeBannerCard scheme={previewScheme} previewOnly compact />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Scheme Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => {
                        const val = stripHtmlAndControlChars(e.target.value);
                        setForm((prev) => ({
                          ...prev,
                          name: val,
                          slug: !editingScheme && !prev.slug ? toSlug(val) : prev.slug,
                        }));
                      }}
                      placeholder="e.g. Sri Ramas Sirapu Thittam"
                      className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.slug}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, '-') }))
                      }
                      placeholder="sirapu-thittam"
                      className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Tagline (Optional)
                    </label>
                    <input
                      type="text"
                      value={form.tagline}
                      onChange={(e) => setForm((prev) => ({ ...prev, tagline: e.target.value }))}
                      placeholder="Concise subtitle for scheme detail header"
                      className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Short Card Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={form.shortDescription}
                      onChange={(e) => setForm((prev) => ({ ...prev, shortDescription: e.target.value }))}
                      placeholder="One-line overview shown on listing card"
                      className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageDropzone
                    label="Desktop Banner Image"
                    uploadFolder="schemes"
                    value={form.bannerImageUrl}
                    publicId={form.bannerImagePublicId}
                    onChange={(url) => setForm((prev) => ({ ...prev, bannerImageUrl: url }))}
                    onPublicIdChange={(pid) => setForm((prev) => ({ ...prev, bannerImagePublicId: pid }))}
                    helperText="Wide landscape artwork (recommended ~16:7 or 21:9)"
                  />

                  <ImageDropzone
                    label="Mobile Banner Image (Optional)"
                    uploadFolder="schemes"
                    value={form.mobileBannerImageUrl}
                    publicId={form.mobileBannerImagePublicId}
                    onChange={(url) => setForm((prev) => ({ ...prev, mobileBannerImageUrl: url }))}
                    onPublicIdChange={(pid) =>
                      setForm((prev) => ({ ...prev, mobileBannerImagePublicId: pid }))
                    }
                    helperText="Optional crop override for mobile screens"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Text Side Alignment
                    </label>
                    <select
                      value={form.textAlignment}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          textAlignment: e.target.value === 'left' ? 'left' : 'right',
                        }))
                      }
                      className="w-full p-2.5 border border-stone-300 rounded-lg bg-white"
                    >
                      <option value="right">Right (Jewellery on Left)</option>
                      <option value="left">Left (Jewellery on Right)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Button CTA Label
                    </label>
                    <input
                      type="text"
                      value={form.ctaText}
                      onChange={(e) => setForm((prev) => ({ ...prev, ctaText: e.target.value }))}
                      placeholder="JOIN NOW"
                      className="w-full p-2.5 border border-stone-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.displayOrder}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, displayOrder: Number(e.target.value) || 0 }))
                      }
                      className="w-full p-2.5 border border-stone-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Duration Label (Optional)
                    </label>
                    <input
                      type="text"
                      value={form.durationLabel}
                      onChange={(e) => setForm((prev) => ({ ...prev, durationLabel: e.target.value }))}
                      placeholder="Leave blank if Showroom confirms"
                      className="w-full p-2.5 border border-stone-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Numeric Tenure Months (Optional)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={form.tenureMonths}
                      onChange={(e) => setForm((prev) => ({ ...prev, tenureMonths: e.target.value }))}
                      placeholder="Leave blank unless fixed"
                      className="w-full p-2.5 border border-stone-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Min Monthly Installment ₹ (Optional)
                    </label>
                    <input
                      type="number"
                      min={100}
                      value={form.minMonthlyRupees}
                      onChange={(e) => setForm((prev) => ({ ...prev, minMonthlyRupees: e.target.value }))}
                      placeholder="Leave blank unless fixed"
                      className="w-full p-2.5 border border-stone-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Full Scheme Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={form.fullDescription}
                    onChange={(e) => setForm((prev) => ({ ...prev, fullDescription: e.target.value }))}
                    placeholder="Detailed narrative shown on /schemes/:slug"
                    className="w-full p-2.5 border border-stone-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Key Highlights (One per line)
                    </label>
                    <textarea
                      rows={4}
                      value={form.benefitsText}
                      onChange={(e) => setForm((prev) => ({ ...prev, benefitsText: e.target.value }))}
                      placeholder="One verified highlight per line..."
                      className="w-full p-2.5 border border-stone-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      Terms &amp; Guidance (One per line)
                    </label>
                    <textarea
                      rows={4}
                      value={form.termsText}
                      onChange={(e) => setForm((prev) => ({ ...prev, termsText: e.target.value }))}
                      placeholder="One term or guidance point per line..."
                      className="w-full p-2.5 border border-stone-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    Custom WhatsApp Pre-filled Message (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={form.whatsappMessage}
                    onChange={(e) => setForm((prev) => ({ ...prev, whatsappMessage: e.target.value }))}
                    placeholder="Optional custom WhatsApp enquiry text for this scheme..."
                    className="w-full p-2.5 border border-stone-300 rounded-lg"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded text-burgundy-900"
                  />
                  <span className="font-semibold text-stone-700">
                    Published on Public Schemes Showcase
                  </span>
                </label>
              </div>

              <div className="p-5 border-t border-stone-200 bg-stone-50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-burgundy-900 text-gold-200 rounded-lg text-xs font-bold shadow-md hover:bg-burgundy-800 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingScheme ? 'Save Changes' : 'Create Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
