import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Eye,
  CheckCircle2,
  AlertCircle,
  Award,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { schemesApi } from '@/services/api/schemes.api';
import { SchemePlan, SchemeLayoutConfig } from '@/types';
import { paiseToRupees, rupeesToPaise } from '@/utils/currency';
import { ImageDropzone } from '@/components/admin/ImageDropzone';
import { SchemeCard } from '@/components/customer/SchemeCard';
import { AdminModalPortal } from '@/components/admin/AdminModalPortal';
import { stripHtmlAndControlChars } from '@/utils/inputSanitize';

interface SimplifiedSchemeFormState {
  bannerImageUrl: string;
  bannerImagePublicId: string;
  name: string;
  description: string;
  buttonName: string;
  navigationDestination: string;
  tenureMonths: string;
  price: string;
  displayOrder: string;
  benefit1: string;
  benefit2: string;
  benefit3: string;
  isActive: boolean;
  layoutConfig?: SchemeLayoutConfig | null;
}

function createEmptySchemeForm(): SimplifiedSchemeFormState {
  return {
    bannerImageUrl: '',
    bannerImagePublicId: '',
    name: '',
    description: '',
    buttonName: 'Enquire Now',
    navigationDestination: '/contact',
    tenureMonths: '',
    price: '',
    displayOrder: '0',
    benefit1: '',
    benefit2: '',
    benefit3: '',
    isActive: true,
    layoutConfig: null,
  };
}

export const SchemesManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<SchemePlan | null>(null);
  const [form, setForm] = useState<SimplifiedSchemeFormState>(createEmptySchemeForm);
  const [saving, setSaving] = useState(false);
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
    setForm(createEmptySchemeForm());
    setIsModalOpen(true);
  };

  const openEditModal = (scheme: SchemePlan) => {
    setEditingScheme(scheme);
    setErrorMsg(null);
    const minPaise = scheme.minMonthlyAmountPaise ?? scheme.minimumMonthlyAmountPaise;
    const b = Array.isArray(scheme.benefits) ? scheme.benefits : [];
    setForm({
      bannerImageUrl: scheme.bannerImageUrl || '',
      bannerImagePublicId: scheme.bannerImagePublicId || '',
      name: scheme.name || '',
      description: scheme.description || scheme.fullDescription || scheme.shortDescription || '',
      buttonName: scheme.buttonName || scheme.ctaText || 'Enquire Now',
      navigationDestination: scheme.navigationDestination || '/contact',
      tenureMonths:
        typeof scheme.tenureMonths === 'number' && scheme.tenureMonths > 0
          ? String(scheme.tenureMonths)
          : '',
      price:
        typeof minPaise === 'number' && minPaise > 0
          ? String(paiseToRupees(minPaise))
          : '',
      displayOrder: String(scheme.displayOrder ?? 0),
      benefit1: b[0] || '',
      benefit2: b[1] || '',
      benefit3: b[2] || '',
      isActive: scheme.isActive ?? true,
      layoutConfig: scheme.layoutConfig || null,
    });
    setIsModalOpen(true);
  };

  const previewScheme: SchemePlan = useMemo(() => {
    const priceNum = Number(form.price);
    const tenureNum = Number(form.tenureMonths);
    const benefits = [form.benefit1.trim(), form.benefit2.trim(), form.benefit3.trim()].filter(Boolean);
    return {
      _id: editingScheme?._id || 'preview',
      name: form.name.trim() || 'Savings Scheme Preview',
      slug: editingScheme?.slug || 'savings-scheme',
      description: form.description.trim(),
      shortDescription: form.description.trim(),
      fullDescription: form.description.trim(),
      buttonName: form.buttonName.trim(),
      ctaText: form.buttonName.trim() || 'Enquire Now',
      navigationDestination: form.navigationDestination.trim() || '/contact',
      tenureMonths: Number.isFinite(tenureNum) && tenureNum > 0 ? tenureNum : undefined,
      minMonthlyAmountPaise:
        Number.isFinite(priceNum) && priceNum > 0 ? rupeesToPaise(priceNum) : undefined,
      bannerImageUrl: form.bannerImageUrl,
      bannerImagePublicId: form.bannerImagePublicId,
      layoutConfig: form.layoutConfig || undefined,
      terms: [],
      benefits,
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

    const parsedPrice = form.price.trim() ? Number(form.price) : undefined;
    if (parsedPrice !== undefined && (!Number.isFinite(parsedPrice) || parsedPrice <= 0)) {
      setErrorMsg('Price / Monthly installment amount must be a positive number.');
      return;
    }

    const parsedTenure = form.tenureMonths.trim() ? Number(form.tenureMonths) : undefined;
    if (
      parsedTenure !== undefined &&
      (!Number.isInteger(parsedTenure) || parsedTenure < 1 || parsedTenure > 120)
    ) {
      setErrorMsg('Duration months must be between 1 and 120 (or leave blank).');
      return;
    }

    const benefits = [form.benefit1.trim(), form.benefit2.trim(), form.benefit3.trim()].filter(Boolean);

    setSaving(true);
    try {
      const payload: Partial<SchemePlan> = {
        name: cleanName,
        description: form.description.trim(),
        shortDescription: form.description.trim(),
        fullDescription: form.description.trim(),
        buttonName: form.buttonName.trim(),
        ctaText: form.buttonName.trim() || 'Enquire Now',
        navigationDestination: form.navigationDestination.trim() || '/contact',
        tenureMonths: parsedTenure,
        minMonthlyAmountPaise: parsedPrice ? rupeesToPaise(parsedPrice) : undefined,
        bannerImageUrl: form.bannerImageUrl.trim() || undefined,
        bannerImagePublicId: form.bannerImagePublicId.trim() || undefined,
        benefits,
        benefitDescription: benefits.join(' • '),
        displayOrder: Number(form.displayOrder) || 0,
        layoutConfig: form.layoutConfig || undefined,
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

  const handleMoveOrder = async (scheme: SchemePlan, direction: 'up' | 'down') => {
    const currentIdx = sortedSchemes.findIndex((s) => s._id === scheme._id);
    if (currentIdx === -1) return;
    const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= sortedSchemes.length) return;

    const targetScheme = sortedSchemes[targetIdx];
    const currentOrder = scheme.displayOrder ?? currentIdx;
    const targetOrder = targetScheme.displayOrder ?? targetIdx;

    try {
      const newCurrentOrder = targetOrder;
      const newTargetOrder = currentOrder === targetOrder
        ? (direction === 'up' ? targetOrder + 1 : targetOrder - 1)
        : currentOrder;

      await schemesApi.adminUpdateScheme(scheme._id, { displayOrder: newCurrentOrder });
      await schemesApi.adminUpdateScheme(targetScheme._id, { displayOrder: newTargetOrder });
      setToastMsg(`Updated order for "${scheme.name}".`);
      invalidateAll();
    } catch (err: any) {
      setErrorMsg('Failed to reorder scheme.');
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
    if (!window.confirm(`Delete scheme "${scheme.name}"?`)) {
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
            Savings Schemes
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage your showroom savings schemes, promotional banner images, and customer enquiry buttons.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-maroon-gradient text-gold-200 text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-95"
        >
          <Plus className="w-4 h-4 text-gold-400" />
          <span>Add New Scheme</span>
        </button>
      </div>

      {toastMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMsg}</span>
          </div>
          <button type="button" onClick={() => setToastMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-300 text-xs text-red-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Schemes Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold">
              <tr>
                <th className="p-4 w-20">Order</th>
                <th className="p-4">Banner &amp; Scheme</th>
                <th className="p-4">Benefits</th>
                <th className="p-4">Duration &amp; Installment</th>
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
                sortedSchemes.map((scheme, index) => {
                  const minPaise = scheme.minMonthlyAmountPaise ?? scheme.minimumMonthlyAmountPaise;
                  const schemeBenefits = Array.isArray(scheme.benefits) ? scheme.benefits.filter(Boolean) : [];
                  return (
                    <tr key={scheme._id} className="hover:bg-stone-50/70 transition-colors">
                      {/* Order Controls */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs bg-stone-100 px-2 py-0.5 rounded text-burgundy-950">
                            #{scheme.displayOrder ?? index + 1}
                          </span>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveOrder(scheme, 'up')}
                              className="p-0.5 text-stone-400 hover:text-stone-700 disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={index === sortedSchemes.length - 1}
                              onClick={() => handleMoveOrder(scheme, 'down')}
                              className="p-0.5 text-stone-400 hover:text-stone-700 disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 flex items-center gap-3">
                        <div className="w-14 h-9 rounded-lg bg-[#3A060E] overflow-hidden shrink-0 border border-gold-400/50">
                          {scheme.bannerImageUrl ? (
                            <img
                              src={scheme.bannerImageUrl}
                              alt={scheme.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gold-400">
                              <Award className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-serif font-bold text-sm text-burgundy-950">
                            {scheme.name}
                          </div>
                          {scheme.description && (
                            <div className="text-[11px] text-stone-500 line-clamp-1 max-w-sm">
                              {scheme.description}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-stone-700 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {schemeBenefits.length > 0 ? (
                            schemeBenefits.slice(0, 3).map((b, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-gold-50 border border-gold-200 text-[10px] text-stone-700 whitespace-nowrap"
                              >
                                {b}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-stone-400 italic">No benefits set</span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-stone-700">
                        <div>
                          {scheme.tenureMonths ? `${scheme.tenureMonths} Months` : 'Flexible duration'}
                        </div>
                        <div className="font-mono text-[11px] text-stone-500">
                          {minPaise && minPaise > 0
                            ? `₹${paiseToRupees(minPaise).toLocaleString('en-IN')}/mo`
                            : 'Showroom confirmed'}
                        </div>
                      </td>

                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(scheme)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                            scheme.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          <span>{scheme.isActive ? 'Active' : 'Hidden'}</span>
                        </button>
                      </td>

                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditModal(scheme)}
                          className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700"
                          title="Edit Scheme"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(scheme)}
                          className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
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
                    No savings schemes configured yet. Click "Add New Scheme" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile App-Style Schemes Cards */}
        <div className="block md:hidden p-3.5 space-y-3">
          {isLoading ? (
            <div className="p-8 text-center text-stone-400 text-xs">
              Loading savings schemes...
            </div>
          ) : sortedSchemes.length > 0 ? (
            sortedSchemes.map((scheme, index) => {
              const minPaise = scheme.minMonthlyAmountPaise ?? scheme.minimumMonthlyAmountPaise;
              const schemeBenefits = Array.isArray(scheme.benefits) ? scheme.benefits.filter(Boolean) : [];

              return (
                <div
                  key={scheme._id}
                  className="bg-[#FCFAF6] border border-stone-200/90 rounded-xl p-3.5 space-y-3 shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-10 rounded-lg bg-[#3A060E] overflow-hidden shrink-0 border border-gold-400/50">
                      {scheme.bannerImageUrl ? (
                        <img
                          src={scheme.bannerImageUrl}
                          alt={scheme.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gold-400">
                          <Award className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="font-serif font-bold text-sm text-burgundy-950 truncate">
                          {scheme.name}
                        </h4>
                        <div className="flex items-center gap-1 shrink-0 bg-stone-100 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-stone-700">
                          <span>#{scheme.displayOrder ?? index + 1}</span>
                          <div className="flex flex-col -my-0.5">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveOrder(scheme, 'up')}
                              className="text-stone-400 hover:text-burgundy-900 disabled:opacity-20"
                              title="Move Up"
                            >
                              <ArrowUp className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === sortedSchemes.length - 1}
                              onClick={() => handleMoveOrder(scheme, 'down')}
                              className="text-stone-400 hover:text-burgundy-900 disabled:opacity-20"
                              title="Move Down"
                            >
                              <ArrowDown className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {scheme.description && (
                        <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                          {scheme.description}
                        </p>
                      )}

                      <div className="text-[11px] font-semibold text-gold-800 mt-1">
                        {scheme.tenureMonths ? `${scheme.tenureMonths} Months` : 'Flexible duration'}
                        {minPaise && minPaise > 0 ? ` • ₹${paiseToRupees(minPaise).toLocaleString('en-IN')}/mo` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Benefits */}
                  {schemeBenefits.length > 0 && (
                    <div className="pt-2 border-t border-stone-200/60 flex flex-wrap gap-1">
                      {schemeBenefits.slice(0, 3).map((b, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded bg-gold-50 border border-gold-200 text-[10px] text-stone-700 whitespace-nowrap"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Status & Actions Footer */}
                  <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(scheme)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                        scheme.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      <span>{scheme.isActive ? 'Active' : 'Hidden'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(scheme)}
                        className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700"
                        title="Edit Scheme"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(scheme)}
                        className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                        title="Delete Scheme"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-stone-400 text-xs">
              No savings schemes configured yet.
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal with Compact Layout and Live Preview */}
      {isModalOpen && (
        <AdminModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-start justify-center p-3 sm:p-6 overflow-y-auto bg-charcoal-950/70 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gold-500/40 overflow-hidden my-auto max-h-[94vh] flex flex-col animate-modal-enter">
            <div className="bg-burgundy-900 text-gold-100 p-4 sm:p-5 border-b border-gold-600/40 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-serif font-bold text-lg text-gold-100">
                  {editingScheme ? `Edit Scheme: ${editingScheme.name}` : 'Create New Savings Scheme'}
                </h2>
                <p className="text-[11px] text-gold-300/80">
                  Complete all 7 scheme fields below. Saved changes update MongoDB and sync with the public storefront.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gold-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* 1. Image Upload */}
                <ImageDropzone
                  label="1. Scheme Promotional Banner Image *"
                  uploadFolder="schemes"
                  value={form.bannerImageUrl}
                  publicId={form.bannerImagePublicId}
                  onChange={(url) => setForm((prev) => ({ ...prev, bannerImageUrl: url }))}
                  onPublicIdChange={(pid) => setForm((prev) => ({ ...prev, bannerImagePublicId: pid }))}
                  helperText="Upload landscape banner artwork (PNG/JPG/WEBP up to 10MB)"
                />

                {/* 2. Scheme Name */}
                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    2. Scheme Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Swarna Varshini Gold Scheme"
                    className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500"
                  />
                </div>

                {/* 3. Scheme Description */}
                <div>
                  <label className="block font-semibold uppercase text-stone-700 mb-1">
                    3. Scheme Description <span className="text-stone-400 font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the scheme terms, monthly contributions, and maturity benefits (optional)..."
                    className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500"
                  />
                </div>

                {/* 4. Button Name & 5. Navigation Destination */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold uppercase text-stone-700">
                        4. Button Name <span className="text-stone-400 font-normal lowercase">(optional)</span>
                      </label>
                      {form.buttonName && (
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, buttonName: '', navigationDestination: '' }))}
                          className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                          title="Remove button from scheme card"
                        >
                          <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Remove Button</span>
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={form.buttonName}
                        onChange={(e) => setForm((prev) => ({ ...prev, buttonName: e.target.value }))}
                        placeholder="e.g. Enquire Now (leave blank to remove button)"
                        className="w-full p-2.5 pr-8 border border-stone-300 rounded-lg outline-none focus:border-gold-500"
                      />
                      {form.buttonName && (
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, buttonName: '', navigationDestination: '' }))}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-600 p-0.5 rounded-full hover:bg-stone-100"
                          title="Clear button name"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      5. Navigation Page / Destination <span className="text-stone-400 font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.navigationDestination}
                      onChange={(e) => setForm((prev) => ({ ...prev, navigationDestination: e.target.value }))}
                      placeholder="e.g. /schemes or /contact (optional)"
                      className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                {/* 6. Duration (Months), Price & Display Order */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      6. Duration (Months)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={form.tenureMonths}
                      onChange={(e) => setForm((prev) => ({ ...prev, tenureMonths: e.target.value }))}
                      placeholder="e.g. 11"
                      className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      7. Price / Monthly Amount (₹)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.price}
                      onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                      placeholder="e.g. 2500"
                      className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-stone-700 mb-1">
                      8. Display Order (Rank)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.displayOrder}
                      onChange={(e) => setForm((prev) => ({ ...prev, displayOrder: e.target.value }))}
                      placeholder="e.g. 1, 2, 3..."
                      className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {/* 9. Scheme Key Benefits (Shown in Card Benefits Row) */}
                <div className="p-3.5 rounded-xl bg-gold-50/50 border border-gold-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold uppercase text-burgundy-950 text-[11px]">
                      9. Scheme Key Benefits (Card 3-Column Strip)
                    </label>
                    <span className="text-[10px] text-stone-500">
                      Icons automatically map to terms like "Tenure", "Secure", "Bonus", "Wedding"
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-stone-600 mb-1">Benefit 1</label>
                      <input
                        type="text"
                        value={form.benefit1}
                        onChange={(e) => setForm((prev) => ({ ...prev, benefit1: e.target.value }))}
                        placeholder="e.g. Flexible Tenure"
                        className="w-full p-2 border border-stone-300 rounded-lg outline-none focus:border-gold-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-600 mb-1">Benefit 2</label>
                      <input
                        type="text"
                        value={form.benefit2}
                        onChange={(e) => setForm((prev) => ({ ...prev, benefit2: e.target.value }))}
                        placeholder="e.g. Attractive Benefits"
                        className="w-full p-2 border border-stone-300 rounded-lg outline-none focus:border-gold-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-600 mb-1">Benefit 3</label>
                      <input
                        type="text"
                        value={form.benefit3}
                        onChange={(e) => setForm((prev) => ({ ...prev, benefit3: e.target.value }))}
                        placeholder="e.g. Bonus on Maturity"
                        className="w-full p-2 border border-stone-300 rounded-lg outline-none focus:border-gold-500 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Published / Active Toggle */}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded text-burgundy-900"
                  />
                  <span className="font-semibold text-stone-700">
                    Published on Public Schemes Showcase (Live Website)
                  </span>
                </label>

                {/* Live Scheme Card Preview matching exact public UI */}
                <div className="space-y-2 pt-3 border-t border-stone-200">
                  <span className="block font-bold uppercase tracking-wider text-burgundy-950 text-[11px]">
                    Live Public Scheme Card Preview
                  </span>
                  <div className="max-w-md mx-auto">
                    <SchemeCard
                      scheme={previewScheme}
                      isFirst={form.displayOrder === '1'}
                      previewMode={true}
                      onRemoveButton={
                        form.buttonName?.trim()
                          ? () => setForm((prev) => ({ ...prev, buttonName: '', navigationDestination: '' }))
                          : undefined
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 flex justify-end gap-3 shrink-0">
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
      </AdminModalPortal>
      )}
    </div>
  );
};