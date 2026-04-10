import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectPreferredLocale,
  getLocalizedAutoNudgeCatalog,
  getLocalizedKeywordTriggers,
  getLocalizedRoleRouterCatalog,
} from '../runtime.js';

describe('localization runtime', () => {
  it('prefers OMX_LOCALE over system locale', () => {
    assert.equal(detectPreferredLocale({ OMX_LOCALE: 'de', LANG: 'en_US.UTF-8' } as NodeJS.ProcessEnv), 'de');
  });

  it('falls back to LANG when override is absent', () => {
    assert.equal(detectPreferredLocale({ LANG: 'de_DE.UTF-8' } as NodeJS.ProcessEnv), 'de');
    assert.equal(detectPreferredLocale({ LANG: 'C.UTF-8' } as NodeJS.ProcessEnv), 'en');
  });

  it('merges English with the selected locale catalog', () => {
    const keywords = getLocalizedKeywordTriggers({ OMX_LOCALE: 'de' } as NodeJS.ProcessEnv);
    assert.ok(keywords.some((entry) => entry.keyword === 'plan this'));
    assert.ok(keywords.some((entry) => entry.keyword === 'lass uns planen'));

    const autoNudge = getLocalizedAutoNudgeCatalog({ OMX_LOCALE: 'de' } as NodeJS.ProcessEnv);
    assert.ok(autoNudge.stallPatterns.includes('would you like'));
    assert.ok(autoNudge.stallPatterns.includes('möchtest du'));
    assert.ok(autoNudge.stallPatterns.includes('wenn du willst'));
    assert.ok(autoNudge.semanticStallPrompts.includes('wenn du willst'));

    const roleRouter = getLocalizedRoleRouterCatalog({ OMX_LOCALE: 'de' } as NodeJS.ProcessEnv);
    assert.ok(roleRouter.docsIntentTargets.includes('documentation'));
    assert.ok(roleRouter.docsIntentTargets.includes('dokumentation'));
  });
});
