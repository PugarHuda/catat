import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { BUG_REPORT_FORM_ID } from '@/lib/contract';
import { useWalrusClient } from '@/lib/useWalrusClient';
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
  const walrusClient = useWalrusClient();

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
          // Submissions are Quilt blobs: submission.json + (optional) media files.
          // Quilt-aware read by identifier; fall back to whole-blob-as-file if
          // the Quilt happened to be created with no identifier metadata.
          const blob = await walrusClient.walrus.getBlob({ blobId });
          const files = await blob.files({ identifiers: ['submission.json'] });
          const submissionFile = files[0];
          const parsed = (submissionFile
            ? await submissionFile.json()
            : await blob.asFile().json()) as OnChainSubmission;
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
          // Use 0 as the timestamp so any date-based sort treats placeholder
          // rows as the oldest — they don't crowd to the top of "latest"
          // simply because we just created the row. The 'archived' status +
          // _isPlaceholder flag exclude them from default counters too.
          submitted_at_ms: 0,
          submitter: '',
          values: { _loadError: reason },
          status: 'archived',
          priority: 'low',
          tags: [],
          source: 'walrus',
          _isPlaceholder: true,
        };
      });
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
