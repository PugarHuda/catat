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
  /** 'walrus' = read from on-chain registry; 'mock' = bundled demo data */
  source?: 'mock' | 'walrus';
  /**
   * True when this row was synthesized for a Walrus blob that failed to
   * fetch (transient relay outage, expired epoch, etc.). The chain still
   * has the blob_id but we couldn't read the body. Excluded from counters,
   * sort buckets, and severity charts to avoid inflating numbers; still
   * rendered as a row with a "blob unreachable" body so the user can see
   * the on-chain entry exists.
   */
  _isPlaceholder?: boolean;
}

export interface AdminFilters {
  status: Set<Status>;
  severity: Set<string>;
  encryptedOnly: boolean;
}

export type SortKey = 'latest' | 'oldest' | 'severity' | 'priority';
