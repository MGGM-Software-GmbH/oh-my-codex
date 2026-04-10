/**
 * Role Router for team orchestration.
 *
 * Layer 1: Prompt loading utilities (loadRolePrompt, isKnownRole, listAvailableRoles)
 * Layer 2: Heuristic role routing (routeTaskToRole, computeWorkerRoleAssignments)
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type { TeamPhase } from './orchestrator.js';
import { hasAnyLocalizedKeyword, startsWithAnyLocalizedKeyword } from '../localization/matcher.js';
import { getLocalizedRoleRouterCatalog } from '../localization/runtime.js';

// ─── Layer 1: Prompt Loading ────────────────────────────────────────────────

/** Role names must be lowercase alphanumeric with hyphens (e.g., 'test-engineer'). */
const SAFE_ROLE_PATTERN = /^[a-z][a-z0-9-]*$/;

/**
 * Load behavioral prompt content for a given agent role.
 * Returns null if the prompt file does not exist or the role name is invalid.
 */
export async function loadRolePrompt(
  role: string,
  promptsDir: string,
): Promise<string | null> {
  if (!SAFE_ROLE_PATTERN.test(role)) return null;
  const filePath = join(promptsDir, `${role}.md`);
  try {
    const content = await readFile(filePath, 'utf-8');
    return content.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Check whether a role has a corresponding prompt file.
 */
export function isKnownRole(role: string, promptsDir: string): boolean {
  if (!SAFE_ROLE_PATTERN.test(role)) return false;
  return existsSync(join(promptsDir, `${role}.md`));
}

/**
 * List all available roles by scanning the prompts directory.
 * Returns role names (filename without .md extension).
 */
export async function listAvailableRoles(promptsDir: string): Promise<string[]> {
  try {
    const files = await readdir(promptsDir);
    return files
      .filter(f => f.endsWith('.md'))
      .map(f => f.slice(0, -3))
      .sort();
  } catch {
    return [];
  }
}

// ─── Layer 2: Heuristic Role Routing ────────────────────────────────────────

export interface RoleRouterResult {
  role: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

type LaneIntent =
  | 'implementation'
  | 'verification'
  | 'review'
  | 'debug'
  | 'design'
  | 'docs'
  | 'build-fix'
  | 'cleanup'
  | 'unknown';

/**
 * Keyword-to-role mapping categories.
 * Order matters: first match wins within a category, but higher keyword count wins across categories.
 */
function inferLaneIntent(text: string): LaneIntent {
  const localized = getLocalizedRoleRouterCatalog();
  if (
    hasAnyLocalizedKeyword(text, localized.buildFixIntent)
    && hasAnyLocalizedKeyword(text, localized.buildFixRepairIntent)
  ) return 'build-fix';
  if (hasAnyLocalizedKeyword(text, localized.debugIntent)) return 'debug';
  if (hasAnyLocalizedKeyword(text, localized.reviewIntent)) return 'review';
  if (
    startsWithAnyLocalizedKeyword(text, localized.primaryTestIntentPrefixes)
    && hasAnyLocalizedKeyword(text, localized.testIntentTargets)
  ) return 'verification';
  if (
    (startsWithAnyLocalizedKeyword(text, localized.primaryDocsIntentPrefixes) && hasAnyLocalizedKeyword(text, localized.docsIntentTargets))
    || hasAnyLocalizedKeyword(text, localized.docsIntentTargets)
  ) return 'docs';
  if (
    hasAnyLocalizedKeyword(text, localized.designIntent)
    || (
      hasAnyLocalizedKeyword(text, ['build', 'create', 'baue', 'erstelle', '빌드'])
      && hasAnyLocalizedKeyword(text, ['ui', 'component', 'frontend', 'komponente', '컴포넌트'])
    )
  ) return 'design';
  if (hasAnyLocalizedKeyword(text, localized.cleanupIntent)) return 'cleanup';
  if (hasAnyLocalizedKeyword(text, localized.implementationIntent)) return 'implementation';
  return 'unknown';
}

/**
 * Phase-context labels used in routing reason strings.
 * These are NOT applied as role assignments — they only appear in diagnostic output
 * to indicate what a phase-aware router might suggest.
 */
const PHASE_CONTEXT_LABELS: Partial<Record<TeamPhase, string>> = {
  'team-verify': 'verifier',
  'team-fix': 'build-fixer',
  'team-plan': 'planner',
  'team-prd': 'analyst',
};

/**
 * Map a task description to the best agent role using keyword heuristics.
 * Falls back to fallbackRole when confidence is low.
 */
export function routeTaskToRole(
  taskSubject: string,
  taskDescription: string,
  phase: TeamPhase | null,
  fallbackRole: string,
): RoleRouterResult {
  const text = `${taskSubject} ${taskDescription}`.toLowerCase();
  const localized = getLocalizedRoleRouterCatalog();
  const intent = inferLaneIntent(text);

  if (intent === 'build-fix') {
    return {
      role: 'build-fixer',
      confidence: 'high',
      reason: 'primary intent is build/compile repair',
    };
  }

  if (intent === 'debug') {
    return {
      role: 'debugger',
      confidence: 'high',
      reason: 'primary intent is investigation/debugging',
    };
  }

  if (intent === 'docs') {
    return {
      role: 'writer',
      confidence: 'high',
      reason: 'primary intent is documentation deliverable',
    };
  }

  if (intent === 'design') {
    return {
      role: 'designer',
      confidence: 'high',
      reason: 'primary intent is UI/design implementation',
    };
  }

  if (intent === 'cleanup') {
    return {
      role: 'code-simplifier',
      confidence: 'high',
      reason: 'primary intent is simplification/refactor work',
    };
  }

  if (intent === 'review') {
    return {
      role: hasAnyLocalizedKeyword(text, localized.securityDomain) ? 'security-reviewer' : 'quality-reviewer',
      confidence: 'high',
      reason: hasAnyLocalizedKeyword(text, localized.securityDomain)
        ? 'primary intent is security-focused review'
        : 'primary intent is review/verification',
    };
  }

  if (intent === 'verification') {
    return {
      role: 'test-engineer',
      confidence: 'high',
      reason: 'primary intent is test/verification output',
    };
  }

  if (intent === 'implementation' && hasAnyLocalizedKeyword(text, localized.securityDomain)) {
    return {
      role: fallbackRole,
      confidence: 'medium',
      reason: 'security/auth domain detected but task intent is implementation, so using fallback implementation lane',
    };
  }

  // Score each role category by keyword match count
  let bestRole = '';
  let bestCount = 0;
  let bestKeyword = '';

  for (const [role, keywords] of Object.entries(localized.roleKeywords)) {
    let count = 0;
    let matchedKeyword = '';
    for (const kw of keywords) {
      if (hasAnyLocalizedKeyword(text, [kw])) {
        count++;
        if (!matchedKeyword) matchedKeyword = kw;
      }
    }
    if (count > bestCount) {
      bestCount = count;
      bestRole = role;
      bestKeyword = matchedKeyword;
    }
  }

  // High confidence: 2+ keyword matches from the same category
  if (bestCount >= 2) {
    return {
      role: bestRole,
      confidence: 'high',
      reason: `matched ${bestCount} keywords in ${bestRole} category (e.g., "${bestKeyword}")`,
    };
  }

  // Medium confidence: exactly 1 keyword match
  if (bestCount === 1) {
    return {
      role: bestRole,
      confidence: 'medium',
      reason: `matched keyword "${bestKeyword}" for ${bestRole}`,
    };
  }

  // Low confidence: phase-context inference only
  if (phase) {
    const phaseDefault = PHASE_CONTEXT_LABELS[phase];
    if (phaseDefault) {
      return {
        role: fallbackRole, // use fallbackRole for low confidence per plan
        confidence: 'low',
        reason: `no keyword match; phase ${phase} suggests ${phaseDefault} but using fallback`,
      };
    }
  }

  return {
    role: fallbackRole,
    confidence: 'low',
    reason: 'no keyword match; using fallback role',
  };
}
