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

export function loadCustomTemplates(): CustomTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PersistedShape;
    if (parsed.version !== 1 || !Array.isArray(parsed.items)) return [];
    return parsed.items;
  } catch (err) {
    console.warn('[customTemplates] failed to load:', err);
    return [];
  }
}

function persist(items: CustomTemplate[]): void {
  if (typeof window === 'undefined') return;
  try {
    const shape: PersistedShape = { version: 1, items };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shape));
  } catch (err) {
    console.warn('[customTemplates] failed to persist:', err);
  }
}

export function saveCustomTemplate(input: {
  name: string;
  emoji: string;
  description: string;
  schema: FormSchema;
}): CustomTemplate {
  const items = loadCustomTemplates();
  const tpl: CustomTemplate = {
    id: `tpl_user_${Date.now()}`,
    name: input.name.trim() || 'Untitled template',
    emoji: input.emoji || '✨',
    description: input.description.trim() || `${input.schema.fields.length} fields, custom recipe`,
    // Deep-copy schema so subsequent Builder edits don't mutate the saved
    // template. The template should be a frozen snapshot.
    schema: JSON.parse(JSON.stringify(input.schema)) as FormSchema,
    createdAtMs: Date.now(),
  };
  persist([tpl, ...items]);
  return tpl;
}

export function deleteCustomTemplate(id: string): void {
  const items = loadCustomTemplates();
  persist(items.filter(t => t.id !== id));
}

/** Quick preset emoji choices for the Save modal — kept small + thematic
 *  so users pick fast and templates remain visually scannable. */
export const TEMPLATE_EMOJI_CHOICES = [
  '📝', '📋', '✨', '🎯', '📊', '🔧', '🎨', '💼', '🚀', '🌊', '⚡', '🔒',
];
