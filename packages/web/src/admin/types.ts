export type Status = 'new' | 'triaging' | 'in_progress' | 'resolved' | 'archived';

export type Priority = 'low' | 'medium' | 'high';

export interface Submission {
  id: string;
  blob_id: string;
  tx_hash: string;
  form_id: string;
  submitted_at_ms: number;
  submitter: string | null;
  values: Record<string, unknown>;
  status: Status;
  priority: Priority;
  tags: string[];
  notes?: string;
}

export interface AdminFilters {
  status: Set<Status>;
  severity: Set<string>;
  encryptedOnly: boolean;
}

export type SortKey = 'latest' | 'oldest' | 'severity' | 'priority';
