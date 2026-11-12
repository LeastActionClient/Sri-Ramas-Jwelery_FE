import { apiClient } from './client';
import { ApiResponse, LiveRatesResponse, MetalRate } from '@/types';

export const ratesApi = {
  getLiveRates: async (): Promise<LiveRatesResponse> => {
    const res = await apiClient.get<ApiResponse<any>>('/public/rates/today');
    const data = res.data.data;

    const goldMap: Record<string, number> = {};
    if (data.goldMap) {
      Object.assign(goldMap, data.goldMap);
    } else if (Array.isArray(data.gold)) {
      data.gold.forEach((item: any) => {
        goldMap[item.purity] = item.ratePerGramPaise;
        if (item.purity === '24K_FINE') goldMap['24K'] = item.ratePerGramPaise;
        if (item.purity === '22K_916') goldMap['22K'] = item.ratePerGramPaise;
      });
    }

    const silverMap: Record<string, number> = {};
    if (data.silverMap) {
      Object.assign(silverMap, data.silverMap);
    } else if (Array.isArray(data.silver)) {
      data.silver.forEach((item: any) => {
        silverMap[item.purity] = item.ratePerGramPaise;
        if (item.purity === '999_FINE') silverMap['999'] = item.ratePerGramPaise;
        if (item.purity === '925_STERLING') silverMap['925'] = item.ratePerGramPaise;
      });
    }

    return {
      gold: {
        '24K': goldMap['24K'] || goldMap['24K_FINE'] || 0,
        '22K': goldMap['22K'] || goldMap['22K_916'] || 0,
        '18K': goldMap['18K'] || 0,
        lastUpdated: data.timestamp || new Date().toISOString(),
      },
      silver: {
        '999': silverMap['999'] || silverMap['999_FINE'] || 0,
        '925': silverMap['925'] || silverMap['925_STERLING'] || 0,
        lastUpdated: data.timestamp || new Date().toISOString(),
      },
      effectiveDate: data.effectiveDate || data.timestamp || new Date().toISOString(),
      isOverride: Boolean(data.isManualOverride || data.isOverride),
      isStale: Boolean(data.isStale),
      source: data.source || 'MOCK',
      providerName: data.providerName || 'MockBullionProvider',
      isMockProvider:
        typeof data.isMockProvider === 'boolean'
          ? data.isMockProvider
          : String(data.providerName || data.source || '').toLowerCase().includes('mock'),
      isLiveVerified: Boolean(data.isLiveVerified),
      allManualOverride: Boolean(data.allManualOverride),
      rawGold: Array.isArray(data.gold) ? data.gold : [],
      rawSilver: Array.isArray(data.silver) ? data.silver : [],
    };
  },

  getRateHistory: async (days: number = 30): Promise<MetalRate[]> => {
    const res = await apiClient.get<ApiResponse<MetalRate[]>>(`/public/rates/history?days=${days}`);
    return res.data.data;
  },

  overrideRates: async (payload: {
    metal: 'GOLD' | 'SILVER';
    rates?: Array<{ purity: string; ratePerGramPaise: number }>;
    purity?: string;
    ratePerGramPaise?: number;
    reason?: string;
    sourceLabel?: string;
  }): Promise<MetalRate> => {
    const res = await apiClient.post<ApiResponse<MetalRate>>('/admin/rates/override', payload);
    return res.data.data;
  },

  restoreAutoSync: async (metal: 'GOLD' | 'SILVER', purity?: string): Promise<MetalRate> => {
    const res = await apiClient.post<ApiResponse<MetalRate>>('/admin/rates/restore-auto', {
      metal,
      ...(purity ? { purity } : {}),
    });
    return res.data.data;
  },
};
