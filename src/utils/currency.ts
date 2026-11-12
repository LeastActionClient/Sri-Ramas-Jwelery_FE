/**
 * Currency Utility for Sri Ramas Jewellery
 * All backend monetary values are stored in Integer Paise (1 INR = 100 Paise)
 */

export function paiseToRupees(paise: number | undefined | null): number {
  if (paise === undefined || paise === null || isNaN(paise)) return 0;
  return paise / 100;
}

export function rupeesToPaise(rupees: number | undefined | null): number {
  if (rupees === undefined || rupees === null || isNaN(rupees)) return 0;
  return Math.round(rupees * 100);
}

/**
 * Format paise to Indian Rupee currency string
 * e.g. 745000 -> "₹7,450.00" or with optional decimals
 */
export function formatPaiseToInr(paise: number | undefined | null, showDecimals: boolean = true): string {
  if (paise === undefined || paise === null || isNaN(paise)) return '₹0.00';
  const rupees = paiseToRupees(paise);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(rupees);
}

/**
 * Format rupee value with INR symbol
 */
export function formatRupeesToInr(rupees: number | undefined | null, showDecimals: boolean = true): string {
  if (rupees === undefined || rupees === null || isNaN(rupees)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(rupees);
}
