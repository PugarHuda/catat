import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { BUG_REPORT_FORM_ID, CATAT_PACKAGE_ID } from './contract';
import { useOwnedForms, type OwnedForm } from './useOwnedForms';

export interface InboxFeedEntry {
  formId: string;
  formTitle: string;
  submissionCount: number;
  latestSubmittedAtMs: number;
  latestSubmitter: string | null;
  latestBlobId: string;
}

interface SubmissionAddedEvent {
  form_id: string;
  submitter: string;
  blob_id: string;
  timestamp_ms: string; // u64 stringified
}

/**
 * Aggregated cross-form activity feed for the Inbox surface.
 *
 * Strategy: ONE Sui RPC call for the global `SubmissionAdded` event
 * stream (descending by recency, capped at 200), then group by form_id
 * client-side. Returns one entry per OWNED form with count + latest
 * activity timestamp. Cheap (single RPC) and informative enough for
 * a notification view; per-submission detail is lazy-loaded when the
 * user clicks into the Admin surface.
 *
 * Disabled until wallet is connected (no owner = no "your forms").
 */
export function useInboxFeed() {
  const sui = useSuiClient();
  const account = useCurrentAccount();
  const ownedQuery = useOwnedForms();
  const owned = ownedQuery.data;

  return useQuery<InboxFeedEntry[]>({
    // Include the wallet address in the cache key — without it, switching
    // wallets (or going from disconnected → connected) silently reuses the
    // previous wallet's empty/partial result. ownedFormCount alone isn't
    // enough because two different wallets can both have 0 forms.
    queryKey: ['inbox-feed', account?.address ?? 'no-wallet', owned?.length ?? 0, owned?.map(f => f.formId).join(',') ?? ''],
    enabled: !!account && !!owned && !ownedQuery.isLoading,
    queryFn: async () => {
      if (!owned) return [];
      const eventType = `${CATAT_PACKAGE_ID}::form::SubmissionAdded`;
      const result = await sui.queryEvents({
        query: { MoveEventType: eventType },
        limit: 200,
        order: 'descending',
      });

      // Build a quick formId → title map from owned forms.
      // POLICY: the public seed "Walrus Bug Report" is intentionally
      // excluded from the Inbox feed — it's a demo form everyone can see
      // via MyFormsPicker but it shouldn't pollute "what's new in MY
      // forms" with submissions from random demo testers. (This guard
      // also ensures consistent behavior even if the connected wallet
      // happens to be the deploy wallet that owns the seed form.)
      const titleByFormId = new Map<string, string>();
      for (const f of owned as OwnedForm[]) {
        if (f.formId === BUG_REPORT_FORM_ID) continue;
        titleByFormId.set(f.formId, f.title);
      }

      // Aggregate events per form_id.
      const aggregates = new Map<string, {
        count: number;
        latestTs: number;
        latestSubmitter: string;
        latestBlobId: string;
      }>();
      for (const e of result.data) {
        const parsed = e.parsedJson as SubmissionAddedEvent | undefined;
        if (!parsed) continue;
        if (!titleByFormId.has(parsed.form_id)) continue; // skip forms not owned
        const ts = Number(parsed.timestamp_ms ?? e.timestampMs ?? 0);
        const existing = aggregates.get(parsed.form_id);
        if (!existing) {
          aggregates.set(parsed.form_id, {
            count: 1,
            latestTs: ts,
            latestSubmitter: parsed.submitter,
            latestBlobId: parsed.blob_id,
          });
        } else {
          existing.count += 1;
          if (ts > existing.latestTs) {
            existing.latestTs = ts;
            existing.latestSubmitter = parsed.submitter;
            existing.latestBlobId = parsed.blob_id;
          }
        }
      }

      const entries: InboxFeedEntry[] = [];
      for (const [formId, agg] of aggregates) {
        entries.push({
          formId,
          formTitle: titleByFormId.get(formId) ?? 'Untitled form',
          submissionCount: agg.count,
          latestSubmittedAtMs: agg.latestTs,
          latestSubmitter: agg.latestSubmitter,
          latestBlobId: agg.latestBlobId,
        });
      }

      // Also include owned forms that have ZERO events — show as "no
      // activity yet" so the user sees the full picture. Same seed-form
      // exclusion as above keeps these two paths consistent.
      for (const form of owned as OwnedForm[]) {
        if (form.formId === BUG_REPORT_FORM_ID) continue;
        if (!aggregates.has(form.formId)) {
          entries.push({
            formId: form.formId,
            formTitle: form.title,
            submissionCount: 0,
            latestSubmittedAtMs: form.createdAtMs,
            latestSubmitter: null,
            latestBlobId: '',
          });
        }
      }

      // Sort: forms with submissions first (by recency), then empty
      // forms (by creation time).
      entries.sort((a, b) => {
        if ((a.submissionCount > 0) !== (b.submissionCount > 0)) {
          return a.submissionCount > 0 ? -1 : 1;
        }
        return b.latestSubmittedAtMs - a.latestSubmittedAtMs;
      });

      return entries;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
