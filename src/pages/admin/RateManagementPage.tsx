import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp,
  ShieldAlert,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ratesApi } from '@/services/api/rates.api';
import { formatPaiseToInr, rupeesToPaise, paiseToRupees } from '@/utils/currency';
import { formatDateTime } from '@/utils/date';
import { stripHtmlAndControlChars } from '@/utils/inputSanitize';

export const RateManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [overrideMetal, setOverrideMetal] = useState<'GOLD' | 'SILVER'>('GOLD');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [goldDraft, setGoldDraft] = useState<{
    r24?: string;
    r22?: string;
    r18?: string;
  }>({});
  const [silverDraft, setSilverDraft] = useState<{
    r999?: string;
    r925?: string;
  }>({});
  const [reason, setReason] = useState('Morning showroom opening rate lock');
  const [sourceLabel, setSourceLabel] = useState('');

  const { data: liveRates } = useQuery({
    queryKey: ['rates', 'live'],
    queryFn: ratesApi.getLiveRates,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['rates', 'history', 30],
    queryFn: () => ratesApi.getRateHistory(30),
  });

  const effectiveGold = useMemo(
    () => ({
      r24: goldDraft.r24 ?? String(liveRates ? paiseToRupees(liveRates.gold['24K']) : 8100),
      r22: goldDraft.r22 ?? String(liveRates ? paiseToRupees(liveRates.gold['22K']) : 7450),
      r18: goldDraft.r18 ?? String(liveRates ? paiseToRupees(liveRates.gold['18K']) : 6100),
    }),
    [goldDraft, liveRates]
  );

  const effectiveSilver = useMemo(
    () => ({
      r999: silverDraft.r999 ?? String(liveRates ? paiseToRupees(liveRates.silver['999']) : 100),
      r925: silverDraft.r925 ?? String(liveRates ? paiseToRupees(liveRates.silver['925']) : 93),
    }),
    [silverDraft, liveRates]
  );

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanReason = stripHtmlAndControlChars(reason).trim();
    if (cleanReason.length < 3) {
      setErrorMsg('Please provide an audit reason of at least 3 characters.');
      return;
    }

    let ratesPayload: Array<{ purity: string; ratePerGramPaise: number }> = [];
    if (overrideMetal === 'GOLD') {
      const r24 = Number(effectiveGold.r24);
      const r22 = Number(effectiveGold.r22);
      const r18 = Number(effectiveGold.r18);
      if (
        !Number.isFinite(r24) ||
        r24 <= 0 ||
        !Number.isFinite(r22) ||
        r22 <= 0 ||
        !Number.isFinite(r18) ||
        r18 <= 0
      ) {
        setErrorMsg('All Gold purity rates (24K, 22K, 18K) must be positive amounts.');
        return;
      }
      ratesPayload = [
        { purity: '24K', ratePerGramPaise: rupeesToPaise(r24) },
        { purity: '22K', ratePerGramPaise: rupeesToPaise(r22) },
        { purity: '18K', ratePerGramPaise: rupeesToPaise(r18) },
      ];
    } else {
      const r999 = Number(effectiveSilver.r999);
      const r925 = Number(effectiveSilver.r925);
      if (!Number.isFinite(r999) || r999 <= 0 || !Number.isFinite(r925) || r925 <= 0) {
        setErrorMsg('Both Silver purity rates (999 and 925) must be positive amounts.');
        return;
      }
      ratesPayload = [
        { purity: '999', ratePerGramPaise: rupeesToPaise(r999) },
        { purity: '925', ratePerGramPaise: rupeesToPaise(r925) },
      ];
    }

    setSaving(true);
    try {
      await ratesApi.overrideRates({
        metal: overrideMetal,
        rates: ratesPayload,
        reason: cleanReason,
        sourceLabel: stripHtmlAndControlChars(sourceLabel).trim() || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['rates'] });
      setSuccessMsg(
        `Manual ${overrideMetal === 'GOLD' ? 'Gold' : 'Silver'} rates locked and synced to public website.`
      );
      window.setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.error?.message || 'Failed to override bullion rates.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreAuto = async (metal: 'GOLD' | 'SILVER') => {
    if (!window.confirm(`Restore automated market feed synchronization for ${metal}?`)) {
      return;
    }
    setErrorMsg(null);
    try {
      await ratesApi.restoreAutoSync(metal);
      if (metal === 'GOLD') setGoldDraft({});
      else setSilverDraft({});
      queryClient.invalidateQueries({ queryKey: ['rates'] });
      setSuccessMsg(`Automated feed sync restored for ${metal}.`);
      window.setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error?.message || 'Failed to restore auto sync.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
            Bullion Market Rate Administration
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage daily Gold &amp; Silver counter benchmarks, DigiGold/DigiSilver rates, manual overrides, and audit trails.
          </p>
        </div>

        {liveRates?.isOverride && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 px-3.5 py-1.5 rounded-xl text-amber-800 text-xs font-semibold">
            <Lock className="w-4 h-4 text-amber-700" />
            <span>Manual Rate Override Active</span>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Current Rates Overview */}
      <div className="bg-white rounded-2xl border border-gold-400/50 p-6 shadow-sm space-y-4">
        <h2 className="font-serif font-bold text-base text-burgundy-950 border-b border-stone-200 pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gold-600" />
            <span>Live Published Benchmarks</span>
          </span>
          <span className="text-xs text-stone-500 font-sans font-normal">
            Effective: {liveRates?.effectiveDate ? formatDateTime(liveRates.effectiveDate) : 'Today'}
          </span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div className="bg-ivory-50 p-3.5 rounded-xl border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase block">24K Gold</span>
            <span className="font-serif font-bold text-xl text-burgundy-950 block mt-1">
              {liveRates ? formatPaiseToInr(liveRates.gold['24K']) : '—'}
            </span>
            <span className="text-[10px] text-stone-400">per gram</span>
          </div>

          <div className="bg-gold-50 p-3.5 rounded-xl border-2 border-gold-500">
            <span className="text-[11px] font-bold text-burgundy-900 uppercase block">22K 916 Gold</span>
            <span className="font-serif font-bold text-xl text-burgundy-900 block mt-1">
              {liveRates ? formatPaiseToInr(liveRates.gold['22K']) : '—'}
            </span>
            <span className="text-[10px] text-burgundy-700 font-semibold">Standard Jewellery</span>
          </div>

          <div className="bg-ivory-50 p-3.5 rounded-xl border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase block">18K Gold</span>
            <span className="font-serif font-bold text-xl text-burgundy-950 block mt-1">
              {liveRates ? formatPaiseToInr(liveRates.gold['18K']) : '—'}
            </span>
            <span className="text-[10px] text-stone-400">per gram</span>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-300">
            <span className="text-[11px] font-bold text-stone-700 uppercase block">999 Silver</span>
            <span className="font-serif font-bold text-xl text-burgundy-950 block mt-1">
              {liveRates ? formatPaiseToInr(liveRates.silver['999']) : '—'}
            </span>
            <span className="text-[10px] text-stone-500">per gram</span>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-300">
            <span className="text-[11px] font-bold text-stone-700 uppercase block">925 Silver</span>
            <span className="font-serif font-bold text-xl text-burgundy-950 block mt-1">
              {liveRates ? formatPaiseToInr(liveRates.silver['925']) : '—'}
            </span>
            <span className="text-[10px] text-stone-500">per gram</span>
          </div>
        </div>

        {liveRates?.isOverride && (
          <div className="pt-3 border-t border-stone-100 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => handleRestoreAuto('GOLD')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold"
            >
              <Unlock className="w-3.5 h-3.5 text-stone-600" />
              <span>Restore Automated Gold Feed</span>
            </button>
            <button
              type="button"
              onClick={() => handleRestoreAuto('SILVER')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold"
            >
              <Unlock className="w-3.5 h-3.5 text-stone-600" />
              <span>Restore Automated Silver Feed</span>
            </button>
          </div>
        )}
      </div>

      {/* Manual Rate Override Form (Gold & Silver) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif font-bold text-lg text-burgundy-950 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-gold-600" />
              <span>Manual Bullion Rate Override</span>
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Lock authoritative showroom rates synced directly to Live Rates, DigiGold &amp; DigiSilver pages.
            </p>
          </div>

          <div className="flex gap-2">
            {(['GOLD', 'SILVER'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setOverrideMetal(m)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  overrideMetal === m
                    ? 'bg-burgundy-900 text-gold-200 shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {m === 'GOLD' ? 'Gold (24K / 22K / 18K)' : 'Silver (999 / 925)'}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleOverrideSubmit} className="space-y-4 text-xs">
          {overrideMetal === 'GOLD' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold uppercase text-stone-700 mb-1">
                  Gold 24K Rate (₹ / Gram) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={effectiveGold.r24}
                  onChange={(e) => setGoldDraft((d) => ({ ...d, r24: e.target.value }))}
                  className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-stone-700 mb-1">
                  Gold 22K (916) Rate (₹ / Gram) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={effectiveGold.r22}
                  onChange={(e) => setGoldDraft((d) => ({ ...d, r22: e.target.value }))}
                  className="w-full p-2.5 border-2 border-gold-400 rounded-lg outline-none focus:border-gold-500 font-mono font-bold text-sm bg-gold-50/50"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-stone-700 mb-1">
                  Gold 18K Rate (₹ / Gram) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={effectiveGold.r18}
                  onChange={(e) => setGoldDraft((d) => ({ ...d, r18: e.target.value }))}
                  className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500 font-mono font-bold text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold uppercase text-stone-700 mb-1">
                  999 Fine Silver Rate (₹ / Gram) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={effectiveSilver.r999}
                  onChange={(e) => setSilverDraft((d) => ({ ...d, r999: e.target.value }))}
                  className="w-full p-2.5 border-2 border-gold-400 rounded-lg outline-none focus:border-gold-500 font-mono font-bold text-sm bg-gold-50/40"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-stone-700 mb-1">
                  925 Sterling Silver Rate (₹ / Gram) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={effectiveSilver.r925}
                  onChange={(e) => setSilverDraft((d) => ({ ...d, r925: e.target.value }))}
                  className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500 font-mono font-bold text-sm"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase text-stone-700 mb-1">
                Audit Reason for Override *
              </label>
              <input
                type="text"
                required
                minLength={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Morning counter rate lock"
                className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-stone-700 mb-1">
                Source Label (Optional)
              </label>
              <input
                type="text"
                value={sourceLabel}
                onChange={(e) => setSourceLabel(e.target.value)}
                placeholder="e.g. Madurai Main Counter Rate"
                className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:border-gold-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-burgundy-900 text-gold-200 rounded-lg font-bold uppercase tracking-wider text-xs shadow-md hover:bg-burgundy-800 disabled:opacity-50"
            >
              {saving
                ? 'Locking Rates...'
                : `Lock & Publish ${overrideMetal === 'GOLD' ? 'Gold' : 'Silver'} Rates`}
            </button>
          </div>
        </form>
      </div>

      {/* Rate History Audit Trail */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-200">
          <h2 className="font-serif font-bold text-base text-burgundy-950">
            30-Day Rate History &amp; Provider Audit Trail
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold">
              <tr>
                <th className="p-4">Metal</th>
                <th className="p-4">Effective From</th>
                <th className="p-4">Recorded Rates</th>
                <th className="p-4">Source / Type</th>
                <th className="p-4">Override Audit Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {history.length > 0 ? (
                history.map((item) => (
                  <tr key={item._id} className="hover:bg-stone-50">
                    <td className="p-4 font-bold text-burgundy-900">{item.metal}</td>
                    <td className="p-4 text-stone-600">{formatDateTime(item.effectiveFrom)}</td>
                    <td className="p-4 font-mono">
                      {Array.isArray(item.rates) ? (
                        item.rates.map((r) => (
                          <span key={r.purity} className="mr-3">
                            {r.purity}: {formatPaiseToInr(r.ratePerGramPaise)}
                          </span>
                        ))
                      ) : (
                        <span>
                          {item.purity ? `${item.purity}: ` : ''}
                          {formatPaiseToInr(item.ratePerGramPaise || 0)}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {item.isManualOverride || item.source === 'MANUAL' ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                          MANUAL OVERRIDE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 text-[10px]">
                          {item.source || item.sourceProvider || 'AUTO_FEED'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-stone-500 italic">
                      {item.reason || item.overrideReason || 'Standard scheduled sync'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-stone-400">
                    No rate history entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
