import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { BUG_REPORT_FORM_ID, CATAT_PACKAGE_ID } from './contract';
import { useOwnedForms, type OwnedForm } from './useOwnedForms';
import { useWalrusClient } from './useWalrusClient';

export interface RecentSubmission {
  formId: string;
  formTitle: string;
  blobId: string;
  submittedAtMs: number;
  submitter: string;
  /** A short headline pulled from the submission's values (first matching
   *  field across template shapes). Empty string if blob couldn't be read. */
  headline: string;
  /** True if blob fetch / parse failed — UI shows a placeholder. */
  loadError: boolean;
}

interface SubmissionAddedEvent {
  form_id: string;
  submitter: string;
  blob_id: string;
  timestamp_ms: string;
}

const RECENT_LIMIT = 12;

/**
 * Fetches the N most recent submissions across ALL owned forms, with
 * Walrus blob content read so we can show a headline per row. Use case:
 * Inbox surface "Activity" feed — per-submission detail, not per-form
 * aggregate (that's useInboxFeed).
 *
 * Cost: 1 Sui RPC for events + N Walrus reads in parallel. Slower than
 * useInboxFeed but bounded (top 12 max) so latency stays under ~5s on
 * a warm relay.
 */
export function useRecentSubmissions() {
  const sui = useSuiClient();
  const account = useCurrentAccount();
  const ownedQuery = useOwnedForms();
  const owned = ownedQuery.data;

  const walrusClient = useWalrusClient();

  return useQuery<RecentSubmission[]>({
    // See useInboxFeed for the wallet-address-in-key rationale — same bug
    // class otherwise.
    queryKey: ['recent-submissions', account?.address ?? 'no-wallet', owned?.length ?? 0, owned?.map(f => f.formId).join(',') ?? ''],
    enabled: !!account && !!owned && !ownedQuery.isLoading,
    queryFn: async () => {
      if (!owned || owned.length === 0) return [];
      // Same seed-form exclusion policy as useInboxFeed — the public demo
      // form's submissions don't appear in the personal Inbox feed even if
      // the connected wallet happens to own it.
      const titleByFormId = new Map<string, string>();
      for (const f of owned as OwnedForm[]) {
        if (f.formId === BUG_REPORT_FORM_ID) continue;
        titleByFormId.set(f.formId, f.title);
      }

      const eventType = `${CATAT_PACKAGE_ID}::form::SubmissionAdded`;
      const result = await sui.queryEvents({
        query: { MoveEventType: eventType },
        limit: 100,
        order: 'descending',
      });

      // Filter to events for owned forms, take top RECENT_LIMIT.
      const relevant = result.data
        .map(e => ({ event: e, parsed: e.parsedJson as SubmissionAddedEvent | undefined }))
        .filter(({ parsed }) => parsed && titleByFormId.has(parsed.form_id))
        .slice(0, RECENT_LIMIT);

      // Parallel blob fetch for headline. Each failure becomes a
      // loadError row so the feed stays informative even if some
      // blobs are unreachable.
      const submissions = await Promise.all(
        relevant.map(async ({ event, parsed }): Promise<RecentSubmission> => {
          const formId = parsed!.form_id;
          const blobId = parsed!.blob_id;
          const submitter = parsed!.submitter;
          const submittedAtMs = Number(parsed!.timestamp_ms ?? event.timestampMs ?? 0);
          const formTitle = titleByFormId.get(formId) ?? 'Untitled form';
          try {
            const blob = await walrusClient.walrus.getBlob({ blobId });
            const files = await blob.files({ identifiers: ['submission.json'] });
            const file = files[0] ?? blob.asFile();
            const parsedJson = await file.json() as { values?: Record<string, unknown> };
            const values = parsedJson.values ?? {};
            const headline = extractHeadline(values);
            return { formId, formTitle, blobId, submittedAtMs, submitter, headline, loadError: false };
          } catch (err) {
            console.warn(`[recent-submissions] blob ${blobId} failed:`, err);
            return { formId, formTitle, blobId, submittedAtMs, submitter, headline: '', loadError: true };
          }
        }),
      );

      return submissions.sort((a, b) => b.submittedAtMs - a.submittedAtMs);
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

/** Pick the most descriptive value from a submission, falling back across
 *  template shapes (bug_report → f_title, hackathon → f_project_name, etc.) */
function extractHeadline(values: Record<string, unknown>): string {
  const candidates = [
    values.f_title,
    values.f_project_name,
    values.f_full_name,
    values.f_name,
    values.f_one_liner,
    values.f_proposal,
    values.f_company,
    values.f_message,
    values.f_use_case,
    values.f_explanation,
    values.f_pain,
    values.f_reason,
    typeof values.f_score === 'number' ? `NPS score: ${values.f_score}/10` : null,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) {
      return c.length > 90 ? `${c.slice(0, 88)}…` : c;
    }
    if (typeof c === 'string' || typeof c === 'number') {
      return String(c);
    }
  }
  return '(no headline)';
}
