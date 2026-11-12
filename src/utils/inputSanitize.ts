/**
 * Client-side input sanitization & validation helpers matching backend Zod rules.
 */

export const SAFE_HUMAN_NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]{1,79}$/;
export const INDIAN_MOBILE_TEN_DIGIT_REGEX = /^[6-9]\d{9}$/;

/**
 * Strips HTML tags and ASCII control characters from single-line strings.
 */
export function stripHtmlAndControlChars(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, '');
}

/**
 * Sanitizes multi-line text while preserving intentional newlines.
 */
export function sanitizeMultilineText(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

/**
 * Live keystroke filter for alphabetic human names (prevents digits/symbols).
 */
export function filterAlphabeticNameInput(value: string): string {
  return stripHtmlAndControlChars(value)
    .replace(/[^A-Za-z\s.'-]/g, '')
    .slice(0, 80);
}

/**
 * Normalizes a 10-digit Indian mobile number on keystroke or paste.
 * Strips non-digits and removes a pasted 91 country prefix when >10 digits are entered.
 */
export function filterIndianMobileInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) {
    return digits.slice(2, 12);
  }
  return digits.slice(0, 10);
}

/**
 * Extracts a strict 10-digit Indian mobile number, or returns empty string if invalid.
 */
export function normalizeIndianMobile10(value: string): string {
  const digits = value.replace(/\D/g, '');
  const stripped =
    digits.length === 12 && digits.startsWith('91')
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith('0')
        ? digits.slice(1)
        : digits;
  return INDIAN_MOBILE_TEN_DIGIT_REGEX.test(stripped) ? stripped : '';
}
