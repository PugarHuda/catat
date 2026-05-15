import { useMemo } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { CATAT_PACKAGE_ID } from './contract';

export interface OwnedForm {
  formId: string;
  title: string;
  owner: string;
  createdAtMs: number;
}

interface FormCreatedEvent {
  form_id: string;
  owner: string;
  title: string;
}

/**
 * Discover Form objects owned by the current wallet by querying the Sui
 * `FormCreated` event log. Returns most-recent-first so the picker
 * surfaces the freshly-published form at the top.
 *
 * Why events, not getOwnedObjects: Form objects are SHARED (anyone can
 * submit) — they're not held in the owner's account. The "ownership"
 * relationship lives in the Form.owner field, populated at create_form
 * time. The cleanest cross-device "what have I published" question is
 * answered by replaying FormCreated events filtered by owner.
 *
 * Disabled when no wallet is connected — falls back to seed-only view.
 */
export function useOwnedForms() {
  const sui = useSuiClient();
  const account = useCurrentAccount();
  const owner = account?.address;

  return useQuery<OwnedForm[]>({
    queryKey: ['owned-forms', owner],
    enabled: !!owner,
    queryFn: async () => {
      if (!owner) return [];
      const eventType = `${CATAT_PACKAGE_ID}::form::FormCreated`;
      // Cursor-paginated event scan. Without pagination, an owner whose
      // forms fall outside the latest 200 globally-published events sees
      // an empty MyFormsPicker — looks like the chain "lost" their data.
      // We cap at MAX_PAGES so a particularly active package doesn't
      // eat tens of seconds on cold start.
      const MAX_PAGES = 5; // 5 × 200 = 1000 events scanned worst case
      const PAGE_SIZE = 200;
      const candidates: OwnedForm[] = [];
      let cursor: Parameters<typeof sui.queryEvents>[0]['cursor'] = null;
      for (let page = 0; page < MAX_PAGES; page++) {
        const result = await sui.queryEvents({
          query: { MoveEventType: eventType },
          limit: PAGE_SIZE,
          order: 'descending',
          cursor,
        });
        for (const e of result.data) {
          const parsed = e.parsedJson as FormCreatedEvent | undefined;
          if (!parsed || parsed.owner !== owner) continue;
          candidates.push({
            formId: parsed.form_id,
            title: parsed.title || 'Untitled form',
            owner: parsed.owner,
            createdAtMs: Number(e.timestampMs ?? 0),
          });
        }
        if (!result.hasNextPage || !result.nextCursor) break;
        cursor = result.nextCursor;
      }

      // Cross-check: re-read each Form's CURRENT owner field via the chain.
      // The event was emitted at create-time and never updates (Form.owner
      // is mutable in principle if a future version adds transferOwnership);
      // showing a form in MyForms based purely on the historical event
      // would mislead the user into thinking they still own it. Batched
      // multiGetObjects keeps this cheap (one RPC, max 50 IDs per batch).
      if (candidates.length === 0) return [];
      const verified: OwnedForm[] = [];
      const BATCH = 50;
      for (let i = 0; i < candidates.length; i += BATCH) {
        const batch = candidates.slice(i, i + BATCH);
        const objects = await sui.multiGetObjects({
          ids: batch.map(c => c.formId),
          options: { showContent: true },
        });
        objects.forEach((obj, idx) => {
          const candidate = batch[idx];
          if (!candidate) return;
          const content = obj.data?.content;
          if (!content || content.dataType !== 'moveObject') return;
          const fields = (content as unknown as { fields?: { owner?: string } }).fields;
          if (fields?.owner === owner) verified.push(candidate);
        });
      }
      return verified;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
