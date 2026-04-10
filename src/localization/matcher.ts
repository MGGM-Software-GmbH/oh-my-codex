function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isWordChar(char: string | undefined): boolean {
  return typeof char === 'string' && /[\p{L}\p{N}_]/u.test(char);
}

export function buildLocalizedKeywordPattern(keyword: string, { anchored = false }: { anchored?: boolean } = {}): RegExp {
  const escaped = escapeRegex(keyword.trim());
  const startsWithWord = isWordChar(keyword.trim()[0]);
  const endsWithWord = isWordChar(keyword.trim().at(-1));
  const prefix = anchored ? '^' : startsWithWord ? '(?<![\\p{L}\\p{N}_])' : '';
  const suffix = endsWithWord ? '(?![\\p{L}\\p{N}_])' : '';
  return new RegExp(`${prefix}${escaped}${suffix}`, 'iu');
}

export function matchesLocalizedKeyword(text: string, keyword: string): boolean {
  if (!text || !keyword.trim()) return false;
  return buildLocalizedKeywordPattern(keyword).test(text);
}

export function startsWithLocalizedKeyword(text: string, keyword: string): boolean {
  const normalized = text.trimStart();
  if (!normalized || !keyword.trim()) return false;
  return buildLocalizedKeywordPattern(keyword, { anchored: true }).test(normalized);
}

export function hasAnyLocalizedKeyword(text: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => matchesLocalizedKeyword(text, keyword));
}

export function startsWithAnyLocalizedKeyword(text: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => startsWithLocalizedKeyword(text, keyword));
}

export function dedupeStrings(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
