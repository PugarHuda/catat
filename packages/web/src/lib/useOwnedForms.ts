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
      // Pull recent events (paginate if needed; 200 is plenty for v1).
      const result = await sui.queryEvents({
        query: { MoveEventType: eventType },
        limit: 200,
        order: 'descending',
      });
      const mine: OwnedForm[] = [];
      for (const e of result.data) {
        const parsed = e.parsedJson as FormCreatedEvent | undefined;
        if (!parsed || parsed.owner !== owner) continue;
        mine.push({
          formId: parsed.form_id,
          title: parsed.title || 'Untitled form',
          owner: parsed.owner,
          createdAtMs: Number(e.timestampMs ?? 0),
        });
      }
      return mine;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
