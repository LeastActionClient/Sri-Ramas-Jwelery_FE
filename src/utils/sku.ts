const STOP_WORDS = new Set([
  'AND',
  'THE',
  'FOR',
  'WITH',
  'OF',
  'IN',
  'BY',
  'COLLECTION',
  'COLLECTIONS',
  'JEWELLERY',
  'JEWELRY',
]);
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

function tokenizeCategoryName(rawName: string): string[] {
  const cleaned = String(rawName || '')
    .toUpperCase()
    .replace(/&/g, ' ')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();

  if (!cleaned) return [];
  const allTokens = cleaned.split(/\s+/).filter(Boolean);
  const meaningful = allTokens.filter((token) => !STOP_WORDS.has(token));
  return meaningful.length > 0 ? meaningful : allTokens;
}

function deriveWordStem(word: string): string {
  const lettersOnly = word.replace(/[^A-Z]/g, '');
  if (!lettersOnly) {
    return word.replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'GEN';
  }
  if (lettersOnly.length <= 3) {
    return lettersOnly;
  }
  if (VOWELS.has(lettersOnly[0])) {
    return lettersOnly.slice(0, 3);
  }

  const consonants = [lettersOnly[0]];
  for (let i = 1; i < lettersOnly.length && consonants.length < 3; i += 1) {
    const ch = lettersOnly[i];
    if (!VOWELS.has(ch)) {
      consonants.push(ch);
    }
  }

  return consonants.length === 3 ? consonants.join('') : lettersOnly.slice(0, 3);
}

export function deriveCategorySkuStem(name: string): string {
  const tokens = tokenizeCategoryName(name);
  if (tokens.length === 0) return 'GEN';

  const primaryWord = tokens.find((t) => /[A-Z]{2,}/.test(t)) || tokens[0];
  let stem = deriveWordStem(primaryWord);

  if (stem.length < 3) {
    const combined = tokens.join('').replace(/[^A-Z0-9]/g, '');
    stem = (stem + combined).slice(0, 3);
  }

  return stem.padEnd(3, 'X').slice(0, 4);
}

export function generateLocalCategorySkuPreview(
  name: string,
  existingSkus: Array<string | undefined | null> = []
): string {
  const taken = new Set(existingSkus.map((s) => (s || '').trim().toUpperCase()).filter(Boolean));
  const tokens = tokenizeCategoryName(name);
  const primaryStem = deriveCategorySkuStem(name);
  const candidates: string[] = [`SRJ-CAT-${primaryStem}`];

  if (tokens.length >= 2) {
    const first = tokens[0].replace(/[^A-Z0-9]/g, '');
    const second = tokens[1].replace(/[^A-Z0-9]/g, '');
    const secondStem = deriveWordStem(second);
    [
      `${first.slice(0, 2)}${second.slice(0, 1)}`,
      `${first.slice(0, 1)}${second.slice(0, 2)}`,
      `${first.slice(0, 1)}${secondStem.slice(0, 2)}`,
      secondStem,
    ].forEach((code) => {
      if (code.length >= 2) {
        const candidate = `SRJ-CAT-${code}`;
        if (!candidates.includes(candidate)) candidates.push(candidate);
      }
    });
  }

  for (const candidate of candidates) {
    if (!taken.has(candidate)) return candidate;
  }

  const base = candidates[0] || 'SRJ-CAT-GEN';
  let suffix = 2;
  while (suffix < 1000) {
    const candidate = `${base}-${suffix}`;
    if (!taken.has(candidate)) return candidate;
    suffix += 1;
  }

  return base;
}

export function extractCategoryCodeForProductSku(
  category?: { sku?: string | null; name?: string | null; slug?: string | null } | null
): string {
  if (category?.sku) {
    const stripped = category.sku
      .trim()
      .toUpperCase()
      .replace(/^SRJ-/, '')
      .replace(/^CAT-/, '')
      .replace(/[^A-Z0-9]+/g, '')
      .slice(0, 8);
    if (stripped.length >= 2) return stripped;
  }

  if (category?.name) return deriveCategorySkuStem(category.name);
  if (category?.slug) return deriveCategorySkuStem(category.slug);
  return 'GEN';
}

export function generateLocalProductSkuPreview(
  category?: { sku?: string | null; name?: string | null; slug?: string | null } | null,
  existingSkus: Array<string | undefined | null> = []
): string {
  const code = extractCategoryCodeForProductSku(category);
  const prefix = `SRJ-${code}`;
  const seqRegex = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`, 'i');

  let maxSeq = 0;
  for (const rawSku of existingSkus) {
    const match = seqRegex.exec(String(rawSku || '').trim());
    if (match) {
      const n = Number.parseInt(match[1], 10);
      if (Number.isFinite(n) && n > maxSeq) maxSeq = n;
    }
  }

  return `${prefix}-${String(maxSeq + 1).padStart(3, '0')}`;
}
