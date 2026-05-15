import type { FormSchema } from './types';

/**
 * Browser-local custom templates. Persisted in localStorage so they
 * survive page refresh but stay scoped to one browser/profile — fine for
 * "starter recipes" use case. Cross-device sharing happens via Publish
 * (form on chain) + share URL.
 */
export interface CustomTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  schema: FormSchema;
  createdAtMs: number;
}

const STORAGE_KEY = 'catat:custom-templates:v1';

interface PersistedShape {
  version: 1;
  items: CustomTemplate[];
}

/**
 * Defensive validator for a single CustomTemplate from localStorage. Anything
 * tampered (manual devtools edit, browser extension, schema drift) is
 * dropped without crashing the gallery render.
 */
function isValidCustomTemplate(item: unknown): item is CustomTemplate {
  if (!item || typeof item !== 'object') return false;
  const t = item as Record<string, unknown>;
  if (typeof t.id !== 'string' || !t.id) return false;
  if (typeof t.name !== 'string') return false;
  if (typeof t.emoji !== 'string') return false;
  if (typeof t.description !== 'string') return false;
  if (typeof t.createdAtMs !== 'number') return false;
  const schema = t.schema as Record<string, unknown> | null | undefined;
  if (!schema || typeof schema !== 'object' || !Array.isArray(schema.fields)) return false;
  return true;
}

export function loadCustomTemplates(): CustomTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<PersistedShape>;
    if (parsed.version !== 1 || !Array.isArray(parsed.items)) return [];
    // Filter out malformed entries instead of trusting the array wholesale.
    return parsed.items.filter(isValidCustomTemplate);
  } catch (err) {
    console.warn('[customTemplates] failed to load:', err);
    return [];
  }
}

/**
 * Result of a localStorage persist attempt. Differentiates "saved" vs the
 * common failure modes (quota, private mode) so callers can show the user
 * a meaningful toast instead of swallowing the error.
 */
export type PersistResult =
  | { ok: true }
  | { ok: false; reason: 'quota' | 'private-mode' | 'unknown'; message: string };

function persist(items: CustomTemplate[]): PersistResult {
  if (typeof window === 'undefined') return { ok: true };
  try {
    const shape: PersistedShape = { version: 1, items };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shape));
    return { ok: true };
  } catch (err) {
    const message = (err as Error).message ?? 'unknown error';
    const lower = message.toLowerCase();
    let reason: 'quota' | 'private-mode' | 'unknown' = 'unknown';
    if (lower.includes('quota') || lower.includes('exceeded')) reason = 'quota';
    else if (lower.includes('security') || lower.includes('private')) reason = 'private-mode';
    console.warn('[customTemplates] persist failed:', err);
    return { ok: false, reason, message };
  }
}

export function saveCustomTemplate(input: {
  name: string;
  emoji: string;
  description: string;
  schema: FormSchema;
}): { template: CustomTemplate; persist: PersistResult } {
  const items = loadCustomTemplates();
  const tplId = `tpl_user_${Date.now()}`;
  // Deep-copy schema so subsequent Builder edits don't mutate the saved
  // template. The template should be a frozen snapshot. Override the
  // schema's own `id` to match the template id — without this override,
  // saving "Bug Report" as a custom template would leave both cards
  // (built-in + custom) marked active in the gallery, since the active
  // marker checks `schema.id === currentSchemaId`.
  const schemaCopy = JSON.parse(JSON.stringify(input.schema)) as FormSchema;
  schemaCopy.id = tplId;
  const tpl: CustomTemplate = {
    id: tplId,
    name: input.name.trim() || 'Untitled template',
    emoji: input.emoji || '✨',
    description: input.description.trim() || `${input.schema.fields.length} fields, custom recipe`,
    schema: schemaCopy,
    createdAtMs: Date.now(),
  };
  const result = persist([tpl, ...items]);
  return { template: tpl, persist: result };
}

export function deleteCustomTemplate(id: string): PersistResult {
  const items = loadCustomTemplates();
  return persist(items.filter(t => t.id !== id));
}

/** Quick preset emoji choices for the Save modal — kept small + thematic
 *  so users pick fast and templates remain visually scannable. */
export const TEMPLATE_EMOJI_CHOICES = [
  '📝', '📋', '✨', '🎯', '📊', '🔧', '🎨', '💼', '🚀', '🌊', '⚡', '🔒',
];
