function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isWordChar(char: string | undefined): boolean {
  return typeof char === 'string' && /[\p{L}\p{N}_]/u.test(char);
}

function isAsciiWordChar(char: string | undefined): boolean {
  return typeof char === 'string' && /[A-Za-z0-9_]/.test(char);
}

function wordBoundaryClassFor(char: string | undefined): string {
  return isAsciiWordChar(char) ? 'A-Za-z0-9_' : '\\p{L}\\p{N}_';
}

export function buildLocalizedKeywordPatternSource(keyword: string, { anchored = false }: { anchored?: boolean } = {}): string {
  const normalized = keyword.trim();
  const escaped = escapeRegex(normalized);
  const startsWithWord = isWordChar(normalized[0]);
  const endsWithWord = isWordChar(normalized.at(-1));
  const prefix = anchored ? '^' : startsWithWord ? `(?<![${wordBoundaryClassFor(normalized[0])}])` : '';
  const suffix = endsWithWord ? `(?![${wordBoundaryClassFor(normalized.at(-1))}])` : '';
  return `${prefix}${escaped}${suffix}`;
}

export function buildLocalizedKeywordPattern(keyword: string, options: { anchored?: boolean } = {}): RegExp {
  return new RegExp(buildLocalizedKeywordPatternSource(keyword, options), 'iu');
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
