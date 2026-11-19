import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cmsApi } from '@/services/api/cms.api';
import { StoreLocation } from '@/types';
import {
  DEFAULT_WHATSAPP_NUMBER,
  getWhatsAppEnquiryUrl,
  normalizeWhatsAppNumber,
  WhatsAppEnquiryParams,
} from '@/utils/whatsapp';

/**
 * Shared React Query selector providing Admin-configured showroom contact details
 * and dynamic WhatsApp enquiry URL builders without duplicating `/public/stores` requests.
 */
export function useStoreWhatsApp() {
  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: cmsApi.getStores,
    staleTime: 5 * 60 * 1000,
  });

  const activeStores = useMemo(
    () =>
      stores
        .filter((s) => s.isActive !== false)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    [stores]
  );

  const primaryStore: StoreLocation | undefined = useMemo(
    () => activeStores.find((s) => s.isFlagship) || activeStores[0] || stores[0],
    [activeStores, stores]
  );

  const whatsappNumber = useMemo(() => {
    const raw =
      primaryStore?.whatsappNumber ||
      primaryStore?.phoneNumbers?.[0] ||
      primaryStore?.phone ||
      DEFAULT_WHATSAPP_NUMBER;
    return normalizeWhatsAppNumber(raw);
  }, [primaryStore]);

  const displayPhone = useMemo(() => {
    return (
      primaryStore?.phoneNumbers?.[0] ||
      primaryStore?.phone ||
      '7871166317'
    );
  }, [primaryStore]);

  const telHref = useMemo(() => {
    const digits = displayPhone.replace(/[^\d+]/g, '');
    return `tel:${digits || '7871166317'}`;
  }, [displayPhone]);

  const buildWhatsAppUrl = useCallback(
    (params: Omit<WhatsAppEnquiryParams, 'phoneNumber'> & { phoneNumber?: string | null } = {}) =>
      getWhatsAppEnquiryUrl({
        ...params,
        phoneNumber: params.phoneNumber ?? whatsappNumber,
      }),
    [whatsappNumber]
  );

  return {
    stores,
    activeStores,
    primaryStore,
    whatsappNumber,
    displayPhone,
    telHref,
    isLoading,
    buildWhatsAppUrl,
  };
}
