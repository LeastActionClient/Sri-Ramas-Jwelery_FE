import { useQuery } from '@tanstack/react-query';
import { ratesApi } from '@/services/api/rates.api';

export function useRates() {
  return useQuery({
    queryKey: ['rates', 'live'],
    queryFn: ratesApi.getLiveRates,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // 2 minutes auto-poll
    retry: 2,
  });
}

export function useRateHistory(days: number = 30) {
  return useQuery({
    queryKey: ['rates', 'history', days],
    queryFn: () => ratesApi.getRateHistory(days),
    staleTime: 5 * 60 * 1000,
  });
}
