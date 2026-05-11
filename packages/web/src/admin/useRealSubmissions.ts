import { useMemo } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { walrus } from '@mysten/walrus';
import walrusWasmUrl from '@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url';
import { BUG_REPORT_FORM_ID } from '@/lib/contract';
import type { Submission } from './types';

interface FormFields {
  owner: string;
  title: string;
  schema_blob_id: string;
  submission_blob_ids: string[];
  accept_submissions: boolean;
}

interface OnChainSubmission {
  version: string;
  form_id: string;
  submitted_at_ms: number;
  submitter: string;
  values: Record<string, unknown>;
}

/**
 * Read all submissions for a form from the on-chain registry + Walrus.
 *
 * Flow:
 *   1. Read Form shared object → get submission_blob_ids vector
 *   2. For each blob_id, fetch the blob bytes from Walrus
 *   3. Parse JSON → return as Submission[] tagged source: 'walrus'
 */
export function useRealSubmissions(formId: string = BUG_REPORT_FORM_ID) {
  const sui = useSuiClient();

  const walrusClient = useMemo(() => {
    return sui.$extend(
      walrus({
        wasmUrl: walrusWasmUrl,
        uploadRelay: {
          host: 'https://upload-relay.testnet.walrus.space',
          sendTip: { max: 1_000 },
        },
      }),
    );
  }, [sui]);

  return useQuery<Submission[]>({
    queryKey: ['form-real-submissions', formId],
    queryFn: async () => {
      const form = await sui.getObject({
        id: formId,
        options: { showContent: true },
      });

      const content = form.data?.content;
      if (!content || content.dataType !== 'moveObject') {
        return [];
      }
      const fields = (content as unknown as { fields: FormFields }).fields;
      const blobIds = fields.submission_blob_ids ?? [];

      if (blobIds.length === 0) return [];

      const submissions = await Promise.allSettled(
        blobIds.map(async (blobId): Promise<Submission> => {
          const bytes = await walrusClient.walrus.readBlob({ blobId });
          const text = new TextDecoder().decode(bytes);
          const parsed = JSON.parse(text) as OnChainSubmission;
          return {
            id: `walrus_${blobId}`,
            blob_id: blobId,
            tx_hash: '',
            form_id: parsed.form_id,
            submitted_at_ms: parsed.submitted_at_ms,
            submitter: parsed.submitter,
            values: parsed.values,
            status: 'new',
            priority: 'medium',
            tags: [],
            source: 'walrus',
          };
        }),
      );

      // Replace silent rejection-drop with explicit placeholder rows. AdminSurface
      // shows a "N of M failed to load" banner; the row itself renders with a
      // "blob unreachable" body so the submitter knows their entry exists on
      // chain but the body is currently un-fetchable.
      return submissions.map((r, i): Submission => {
        if (r.status === 'fulfilled') return r.value;
        const blobId = blobIds[i] ?? 'unknown';
        const reason = r.reason instanceof Error ? r.reason.message : String(r.reason);
        console.warn(`[useRealSubmissions] blob ${blobId} failed:`, reason);
        return {
          id: `walrus_${blobId}_err`,
          blob_id: blobId,
          tx_hash: '',
          form_id: formId,
          submitted_at_ms: Date.now(),
          submitter: '',
          values: { _loadError: reason },
          status: 'new',
          priority: 'low',
          tags: [],
          source: 'walrus',
        };
      });
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
