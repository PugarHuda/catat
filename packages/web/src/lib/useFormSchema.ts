import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import type { FormSchema, Field, FieldType } from '../builder/types';
import { useWalrusClient } from './useWalrusClient';

// Defensive limits applied to schemas we read from chain. The schema blob
// is content-addressed but anyone can publish a Form pointing to a hostile
// blob; without these caps a malicious schema with 50,000 fields would
// freeze the Builder/Runner.
const MAX_FIELDS = 200;
const MAX_STRING = 2_000;
const MAX_OPTIONS = 100;
const MAX_OPTION_STRING = 200;

const ALLOWED_FIELD_TYPES: ReadonlySet<FieldType> = new Set([
  'short_text', 'rich_text', 'dropdown', 'checkboxes', 'star_rating',
  'image_upload', 'video_upload', 'url', 'email', 'wallet_address',
  'number', 'date',
]);

function clampString(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.length > max ? v.slice(0, max) : v;
}

/**
 * Validate + normalize a schema parsed from a Walrus blob. Anything that
 * doesn't conform to the FormSchema shape gets repaired or dropped — never
 * allowed to crash the UI or balloon memory. Returns null if the blob is
 * structurally invalid.
 */
function hardenSchema(raw: unknown): FormSchema | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const fieldsRaw = r.fields;
  if (!Array.isArray(fieldsRaw)) return null;
  if (fieldsRaw.length > MAX_FIELDS) {
    console.warn(`[hardenSchema] field count ${fieldsRaw.length} > ${MAX_FIELDS}, truncating`);
  }
  const fields: Field[] = [];
  const seenIds = new Set<string>();
  for (const fieldRaw of fieldsRaw.slice(0, MAX_FIELDS)) {
    if (!fieldRaw || typeof fieldRaw !== 'object') continue;
    const f = fieldRaw as Record<string, unknown>;
    const id = clampString(f.id, 80);
    const type = f.type as FieldType;
    if (!id || !ALLOWED_FIELD_TYPES.has(type)) continue;
    if (seenIds.has(id)) continue; // dedupe
    seenIds.add(id);
    const field: Field = {
      id,
      type,
      label: clampString(f.label, MAX_STRING) || '(untitled)',
      required: !!f.required,
      encrypted: !!f.encrypted,
      help: clampString(f.help, MAX_STRING),
      placeholder: clampString(f.placeholder, MAX_STRING),
    };
    if (Array.isArray(f.options)) {
      field.options = f.options
        .slice(0, MAX_OPTIONS)
        .filter((o: unknown): o is string => typeof o === 'string')
        .map((o: string) => clampString(o, MAX_OPTION_STRING));
    }
    if (typeof f.scale === 'number' && Number.isFinite(f.scale) && f.scale > 0 && f.scale <= 20) {
      field.scale = f.scale;
    }
    fields.push(field);
  }
  if (fields.length === 0) return null;
  return {
    id: clampString(r.id, 80) || `remote_${Date.now()}`,
    title: clampString(r.title, MAX_STRING) || 'Untitled form',
    description: clampString(r.description, MAX_STRING),
    fields,
  };
}

interface FormFields {
  owner: string;
  title: string;
  schema_blob_id: string;
  submission_blob_ids: string[];
  accept_submissions: boolean;
}

interface OnChainFormMeta {
  formId: string;
  owner: string;
  title: string;
  schemaBlobId: string;
  acceptSubmissions: boolean;
  submissionCount: number;
}

/**
 * Read a Form's schema from chain:
 *   1. Sui RPC → Form shared object → schema_blob_id (+ title, owner)
 *   2. Walrus readBlob(schema_blob_id) → JSON.parse → FormSchema
 *
 * Used when the user opens a share URL like /?f=<formId>&go=submit — we
 * need to materialize the *publisher's* form, not the local builder draft.
 *
 * Falls back gracefully: if the schema blob is a placeholder (forms
 * created before schema upload was wired), we return null schema with the
 * on-chain meta so the caller can show a helpful "schema not uploaded
 * yet" state.
 */
export function useFormSchema(formId: string | null) {
  const sui = useSuiClient();
  const walrusClient = useWalrusClient();

  return useQuery<{ meta: OnChainFormMeta; schema: FormSchema | null }>({
    queryKey: ['form-schema', formId],
    enabled: !!formId,
    queryFn: async () => {
      if (!formId) throw new Error('No formId');

      // Step 1: read Form object from Sui
      const form = await sui.getObject({ id: formId, options: { showContent: true } });
      const content = form.data?.content;
      if (!content || content.dataType !== 'moveObject') {
        throw new Error(`Form ${formId.slice(0, 10)}… not found or wrong type on chain.`);
      }
      const fields = (content as unknown as { fields: FormFields }).fields;

      const meta: OnChainFormMeta = {
        formId,
        owner: fields.owner,
        title: fields.title,
        schemaBlobId: fields.schema_blob_id,
        acceptSubmissions: fields.accept_submissions,
        submissionCount: (fields.submission_blob_ids ?? []).length,
      };

      // Step 2: fetch schema blob (skip if placeholder).
      // Builder publish writes the schema as a Quilt file named "schema.json",
      // so we must use the Quilt-aware reader path — `readBlob` would hand
      // back the raw Quilt encoding bytes (not parseable JSON).
      if (!fields.schema_blob_id || fields.schema_blob_id.startsWith('blob_pending') || fields.schema_blob_id === 'blob_pending_schema_upload') {
        return { meta, schema: null };
      }
      try {
        const blob = await walrusClient.walrus.getBlob({ blobId: fields.schema_blob_id });
        const files = await blob.files({ identifiers: ['schema.json'] });
        const schemaFile = files[0];
        let raw: unknown;
        if (schemaFile) {
          raw = await schemaFile.json();
        } else {
          // Backward compat: older single-blob publishes (or test data) might
          // store the schema as the whole blob without a Quilt identifier.
          // Fall back to treating the entire blob as raw JSON.
          const fallbackFile = blob.asFile();
          raw = await fallbackFile.json();
        }
        const schema = hardenSchema(raw);
        if (!schema) {
          throw new Error('Schema blob is malformed (missing fields, wrong types, or empty after sanitization)');
        }
        return { meta, schema };
      } catch (err) {
        console.warn(`[useFormSchema] failed to fetch schema blob ${fields.schema_blob_id}:`, err);
        return { meta, schema: null };
      }
    },
    staleTime: 60_000,
    retry: 1,
  });
}
