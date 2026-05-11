import { useMemo } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { walrus } from '@mysten/walrus';
import walrusWasmUrl from '@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url';
import type { FormSchema } from '../builder/types';

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

  const walrusClient = useMemo(() => sui.$extend(walrus({
    wasmUrl: walrusWasmUrl,
    uploadRelay: {
      host: 'https://upload-relay.testnet.walrus.space',
      sendTip: { max: 1_000 },
    },
  })), [sui]);

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

      // Step 2: fetch schema blob (skip if placeholder)
      if (!fields.schema_blob_id || fields.schema_blob_id.startsWith('blob_pending') || fields.schema_blob_id === 'blob_pending_schema_upload') {
        return { meta, schema: null };
      }
      try {
        const bytes = await walrusClient.walrus.readBlob({ blobId: fields.schema_blob_id });
        const text = new TextDecoder().decode(bytes);
        const schema = JSON.parse(text) as FormSchema;
        // Defensive: ensure shape matches what Runner expects.
        if (!Array.isArray(schema.fields)) {
          throw new Error('Schema blob is not a valid FormSchema (missing fields array)');
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
