export interface KeywordTriggerDefinition {
  keyword: string;
  skill: string;
  priority: number;
  guidance: string;
}

import { EN_LOCALIZATION } from '../localization/locales/en.js';
import { getLocalizedKeywordTriggers } from '../localization/runtime.js';

export const KEYWORD_TRIGGER_DEFINITIONS: readonly KeywordTriggerDefinition[] = EN_LOCALIZATION.keywords;

export function getRuntimeKeywordTriggerDefinitions(
  env: NodeJS.ProcessEnv = process.env,
): readonly KeywordTriggerDefinition[] {
  return getLocalizedKeywordTriggers(env);
}

export function compareKeywordMatches(a: { priority: number; keyword: string }, b: { priority: number; keyword: string }): number {
  if (b.priority !== a.priority) return b.priority - a.priority;
  if (b.keyword.length !== a.keyword.length) return b.keyword.length - a.keyword.length;
  return a.keyword.localeCompare(b.keyword);
}
