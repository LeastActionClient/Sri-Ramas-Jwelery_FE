/**
 * WhatsApp Enquiry Generator
 * Generates direct pre-filled WhatsApp links for customer enquiries using
 * Admin-configured showroom WhatsApp numbers when available.
 */

export const DEFAULT_WHATSAPP_NUMBER = '919876543210';

export function normalizeWhatsAppNumber(rawPhone?: string | null): string {
  if (!rawPhone) return DEFAULT_WHATSAPP_NUMBER;
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `91${digits}`;
  }
  if (digits.length >= 11 && digits.length <= 15) {
    return digits;
  }
  return DEFAULT_WHATSAPP_NUMBER;
}

export interface WhatsAppEnquiryParams {
  type?:
    | 'GENERAL'
    | 'PRODUCT'
    | 'SCHEME'
    | 'DIGIGOLD'
    | 'DIGISILVER'
    | 'RATES'
    | 'SHOWROOM'
    | string;
  referenceId?: string;
  productTitle?: string;
  productSku?: string;
  categoryName?: string;
  schemeName?: string;
  storeName?: string;
  customerName?: string;
  customMessage?: string;
  phoneNumber?: string | null;
}

export function getWhatsAppEnquiryUrl(params: WhatsAppEnquiryParams = {}): string {
  const targetNumber = normalizeWhatsAppNumber(params.phoneNumber);

  let message = '';
  if (params.customMessage && params.customMessage.trim()) {
    message = params.customMessage.trim();
  } else {
    message = `Namaste Sri Ramas Jewellery,\n\n`;

    if (params.type === 'PRODUCT' && params.productTitle) {
      message += `I am interested in your jewellery piece: *${params.productTitle}*`;
      if (params.productSku) message += ` (SKU: ${params.productSku})`;
      if (params.categoryName) message += ` under *${params.categoryName}*`;
      message += `.\nCould you please share availability, customisation options, and showroom viewing details?`;
    } else if (params.type === 'SCHEME' && params.schemeName) {
      message += `I would like to enquire about the *${params.schemeName}* Jewellery Savings Scheme. Please share enrollment details and showroom guidance.`;
    } else if (params.type === 'SCHEME') {
      message += `I would like to enquire about Sri Ramas Jewellery Savings Schemes and enrollment options.`;
    } else if (params.type === 'DIGIGOLD') {
      message += `I am interested in learning about *DigiGold* guidance, live 24K rates, and physical gold jewellery redemption at Sri Ramas Jewellery.`;
    } else if (params.type === 'DIGISILVER') {
      message += `I am interested in learning about *DigiSilver* guidance, live 999 silver rates, and silver article/jewellery redemption at Sri Ramas Jewellery.`;
    } else if (params.type === 'RATES') {
      message += `I would like to confirm today's showroom bullion rates and book a showroom consultation.`;
    } else if (params.type === 'SHOWROOM') {
      message += params.storeName
        ? `I would like to visit *${params.storeName}*. Please share showroom directions and appointment availability.`
        : `I would like to visit a Sri Ramas Jewellery showroom. Please assist with timings and appointment availability.`;
    } else if (params.referenceId) {
      message += `I have submitted an enquiry online with Reference ID: *${params.referenceId}*. Following up regarding the same.`;
    } else {
      message += `I would like to connect with a Sri Ramas Jewellery advisor regarding your curated collections and showroom visit.`;
    }

    if (params.customerName) {
      message += `\n\nFrom: ${params.customerName}`;
    }
  }

  return `https://wa.me/${targetNumber}?text=${encodeURIComponent(message)}`;
}
