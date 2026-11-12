/**
 * Weight formatting utility for Jewellery (Grams & Milligrams)
 */

export function formatWeight(grams: number | undefined | null): string {
  if (grams === undefined || grams === null || isNaN(grams)) return '0.000 g';
  return `${Number(grams).toFixed(3)} g`;
}

export function formatCarat(carats: number | undefined | null): string {
  if (carats === undefined || carats === null || isNaN(carats)) return '0.00 ct';
  return `${Number(carats).toFixed(2)} ct`;
}
