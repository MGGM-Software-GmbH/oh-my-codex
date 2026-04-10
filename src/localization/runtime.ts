import { EN_LOCALIZATION } from './locales/en.js';
import { DE_LOCALIZATION } from './locales/de.js';
import { KO_LOCALIZATION } from './locales/ko.js';
import type { LocalizationCatalog } from './types.js';
import { dedupeStrings } from './matcher.js';

const LOCALIZATION_CATALOGS: Record<string, LocalizationCatalog> = {
  en: EN_LOCALIZATION,
  de: DE_LOCALIZATION,
  ko: KO_LOCALIZATION,
};

function normalizeLocaleToken(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  const normalized = raw.replace(/\.UTF-?8$/i, '').replace(/_/g, '-').toLowerCase();
  if (!normalized) return null;
  const base = normalized.split(/[-:;]/)[0]?.trim();
  return base && LOCALIZATION_CATALOGS[base] ? base : null;
}

export function detectPreferredLocale(env: NodeJS.ProcessEnv = process.env): string {
  const override = normalizeLocaleToken(env.OMX_LOCALE);
  if (override) return override;

  const candidates = [env.LC_ALL, env.LC_MESSAGES, env.LANG, env.LANGUAGE];
  for (const candidate of candidates) {
    const detected = normalizeLocaleToken(candidate);
    if (detected) return detected;
  }

  const intlDetected = normalizeLocaleToken(Intl.DateTimeFormat().resolvedOptions().locale);
  return intlDetected ?? 'en';
}

export function getActiveLocalizationCatalogs(env: NodeJS.ProcessEnv = process.env): LocalizationCatalog[] {
  const preferred = detectPreferredLocale(env);
  return preferred === 'en'
    ? [LOCALIZATION_CATALOGS.en]
    : [LOCALIZATION_CATALOGS.en, LOCALIZATION_CATALOGS[preferred]].filter(Boolean);
}

export function getLocalizationCatalog(locale: string): LocalizationCatalog {
  return LOCALIZATION_CATALOGS[locale] ?? LOCALIZATION_CATALOGS.en;
}

export function getLocalizedKeywordTriggers(env: NodeJS.ProcessEnv = process.env) {
  const merged = new Map<string, { keyword: string; skill: string; priority: number; guidance: string }>();
  for (const catalog of getActiveLocalizationCatalogs(env)) {
    for (const entry of catalog.keywords) {
      const key = `${entry.skill}::${entry.keyword.toLowerCase()}`;
      if (!merged.has(key)) merged.set(key, { ...entry });
    }
  }
  return [...merged.values()];
}

export function getLocalizedTeamIntentCatalog(env: NodeJS.ProcessEnv = process.env) {
  const actionVerbs: string[] = [];
  const modeTerms: string[] = [];
  const workflowTerms: string[] = [];
  for (const catalog of getActiveLocalizationCatalogs(env)) {
    actionVerbs.push(...catalog.teamIntent.actionVerbs);
    modeTerms.push(...catalog.teamIntent.modeTerms);
    workflowTerms.push(...catalog.teamIntent.workflowTerms);
  }
  return {
    actionVerbs: dedupeStrings(actionVerbs),
    modeTerms: dedupeStrings(modeTerms),
    workflowTerms: dedupeStrings(workflowTerms),
  };
}

export function getLocalizedAutoNudgeCatalog(env: NodeJS.ProcessEnv = process.env) {
  const blockedApprovals: string[] = [];
  const blockedPrefixes: string[] = [];
  const errorPatterns: string[] = [];
  const abortPatterns: string[] = [];
  const abortInputs: string[] = [];
  const stallPatterns: string[] = [];
  const semanticStallPrompts: string[] = [];
  const permissionSeekingStallPatterns: string[] = [];
  const handoffPatterns: string[] = [];
  const retryPatterns: string[] = [];
  let inputLockMessage = EN_LOCALIZATION.autoNudge.inputLockMessage;
  let languageReminderText = EN_LOCALIZATION.autoNudge.languageReminderText;

  for (const catalog of getActiveLocalizationCatalogs(env)) {
    blockedApprovals.push(...catalog.autoNudge.blockedApprovals);
    blockedPrefixes.push(...catalog.autoNudge.blockedPrefixes);
    errorPatterns.push(...catalog.autoNudge.errorPatterns);
    abortPatterns.push(...catalog.autoNudge.abortPatterns);
    abortInputs.push(...catalog.autoNudge.abortInputs);
    stallPatterns.push(...catalog.autoNudge.stallPatterns);
    semanticStallPrompts.push(...catalog.autoNudge.semanticStallPrompts);
    permissionSeekingStallPatterns.push(...catalog.autoNudge.permissionSeekingStallPatterns);
    handoffPatterns.push(...catalog.autoNudge.handoffPatterns);
    retryPatterns.push(...catalog.autoNudge.retryPatterns);
    inputLockMessage = catalog.autoNudge.inputLockMessage || inputLockMessage;
    languageReminderText = catalog.autoNudge.languageReminderText || languageReminderText;
  }

  return {
    blockedApprovals: dedupeStrings(blockedApprovals),
    blockedPrefixes: dedupeStrings(blockedPrefixes),
    inputLockMessage,
    errorPatterns: dedupeStrings(errorPatterns),
    abortPatterns: dedupeStrings(abortPatterns),
    abortInputs: dedupeStrings(abortInputs),
    stallPatterns: dedupeStrings(stallPatterns),
    semanticStallPrompts: dedupeStrings(semanticStallPrompts),
    permissionSeekingStallPatterns: dedupeStrings(permissionSeekingStallPatterns),
    handoffPatterns: dedupeStrings(handoffPatterns),
    retryPatterns: dedupeStrings(retryPatterns),
    languageReminderText,
  };
}

export function getLocalizedRoleRouterCatalog(env: NodeJS.ProcessEnv = process.env) {
  const roleKeywords = new Map<string, string[]>();
  const implementationIntent: string[] = [];
  const reviewIntent: string[] = [];
  const primaryTestIntentPrefixes: string[] = [];
  const testIntentTargets: string[] = [];
  const docsIntentTargets: string[] = [];
  const primaryDocsIntentPrefixes: string[] = [];
  const debugIntent: string[] = [];
  const designIntent: string[] = [];
  const buildFixIntent: string[] = [];
  const buildFixRepairIntent: string[] = [];
  const cleanupIntent: string[] = [];
  const securityDomain: string[] = [];

  for (const catalog of getActiveLocalizationCatalogs(env)) {
    for (const [role, keywords] of Object.entries(catalog.roleRouter.roleKeywords)) {
      roleKeywords.set(role, [...(roleKeywords.get(role) ?? []), ...keywords]);
    }
    implementationIntent.push(...catalog.roleRouter.implementationIntent);
    reviewIntent.push(...catalog.roleRouter.reviewIntent);
    primaryTestIntentPrefixes.push(...catalog.roleRouter.primaryTestIntentPrefixes);
    testIntentTargets.push(...catalog.roleRouter.testIntentTargets);
    docsIntentTargets.push(...catalog.roleRouter.docsIntentTargets);
    primaryDocsIntentPrefixes.push(...catalog.roleRouter.primaryDocsIntentPrefixes);
    debugIntent.push(...catalog.roleRouter.debugIntent);
    designIntent.push(...catalog.roleRouter.designIntent);
    buildFixIntent.push(...catalog.roleRouter.buildFixIntent);
    buildFixRepairIntent.push(...catalog.roleRouter.buildFixRepairIntent);
    cleanupIntent.push(...catalog.roleRouter.cleanupIntent);
    securityDomain.push(...catalog.roleRouter.securityDomain);
  }

  return {
    roleKeywords: Object.fromEntries([...roleKeywords.entries()].map(([role, keywords]) => [role, dedupeStrings(keywords)])),
    implementationIntent: dedupeStrings(implementationIntent),
    reviewIntent: dedupeStrings(reviewIntent),
    primaryTestIntentPrefixes: dedupeStrings(primaryTestIntentPrefixes),
    testIntentTargets: dedupeStrings(testIntentTargets),
    docsIntentTargets: dedupeStrings(docsIntentTargets),
    primaryDocsIntentPrefixes: dedupeStrings(primaryDocsIntentPrefixes),
    debugIntent: dedupeStrings(debugIntent),
    designIntent: dedupeStrings(designIntent),
    buildFixIntent: dedupeStrings(buildFixIntent),
    buildFixRepairIntent: dedupeStrings(buildFixRepairIntent),
    cleanupIntent: dedupeStrings(cleanupIntent),
    securityDomain: dedupeStrings(securityDomain),
  };
}
