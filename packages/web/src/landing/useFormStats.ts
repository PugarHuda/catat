import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { BUG_REPORT_FORM_ID } from '@/lib/contract';

interface FormFields {
  submission_blob_ids: string[];
  accept_submissions: boolean;
}

interface FormStats {
  count: number;
  acceptingSubmissions: boolean;
}

/**
 * Read public on-chain stats for a Form (no wallet required).
 * Used by the landing page to show a real verified-submission counter.
 */
export function useFormStats(formId: string = BUG_REPORT_FORM_ID) {
  const sui = useSuiClient();

  return useQuery<FormStats>({
    queryKey: ['form-stats', formId],
    queryFn: async () => {
      const form = await sui.getObject({
        id: formId,
        options: { showContent: true },
      });
      const content = form.data?.content;
      if (!content || content.dataType !== 'moveObject') {
        return { count: 0, acceptingSubmissions: false };
      }
      const fields = (content as unknown as { fields: FormFields }).fields;
      return {
        count: fields.submission_blob_ids?.length ?? 0,
        acceptingSubmissions: fields.accept_submissions ?? false,
      };
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
