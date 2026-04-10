export interface LocalizedKeywordTriggerDefinition {
  keyword: string;
  skill: string;
  priority: number;
  guidance: string;
}

export interface LocalizedTeamIntentCatalog {
  actionVerbs: readonly string[];
  modeTerms: readonly string[];
  workflowTerms: readonly string[];
}

export interface LocalizedAutoNudgeCatalog {
  blockedApprovals: readonly string[];
  blockedPrefixes: readonly string[];
  inputLockMessage: string;
  errorPatterns: readonly string[];
  abortPatterns: readonly string[];
  abortInputs: readonly string[];
  stallPatterns: readonly string[];
  semanticStallPrompts: readonly string[];
  handoffPatterns: readonly string[];
  retryPatterns: readonly string[];
  languageReminderText: string;
}

export interface LocalizedRoleRouterCatalog {
  roleKeywords: Readonly<Record<string, readonly string[]>>;
  implementationIntent: readonly string[];
  reviewIntent: readonly string[];
  primaryTestIntentPrefixes: readonly string[];
  testIntentTargets: readonly string[];
  docsIntentTargets: readonly string[];
  primaryDocsIntentPrefixes: readonly string[];
  debugIntent: readonly string[];
  designIntent: readonly string[];
  buildFixIntent: readonly string[];
  buildFixRepairIntent: readonly string[];
  cleanupIntent: readonly string[];
  securityDomain: readonly string[];
}

export interface LocalizationCatalog {
  locale: string;
  keywords: readonly LocalizedKeywordTriggerDefinition[];
  teamIntent: LocalizedTeamIntentCatalog;
  autoNudge: LocalizedAutoNudgeCatalog;
  roleRouter: LocalizedRoleRouterCatalog;
}
