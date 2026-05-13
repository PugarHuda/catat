import { BUG_REPORT_FORM_ID } from '@/lib/contract';
import { useOwnedForms } from '@/lib/useOwnedForms';

interface Props {
  /** Currently focused form_id; matches one pill which is rendered "on". */
  activeFormId: string;
  /** Callback when user clicks a pill to switch focused form. */
  onPick: (formId: string) => void;
  /** Optional: how many wallet-connected pills before we collapse with
   *  "+N more" (TODO future). Currently always show all. */
  maxVisible?: number;
}

/**
 * Horizontal pill row showing forms owned by the connected wallet plus
 * a fixed "Walrus Bug Report" seed-form pill (always available, useful
 * to demo even when wallet has no forms yet). Click a pill to switch
 * the active form across Builder + Admin.
 *
 *   [📚 Walrus Bug Report] [📝 NPS Survey · 3] [✉️ Contact · 0] [+ build]
 */
export default function MyFormsPicker({ activeFormId, onPick }: Props) {
  const ownedQuery = useOwnedForms();
  const owned = ownedQuery.data ?? [];

  const isLoading = ownedQuery.isLoading;
  const hasError = ownedQuery.isError;

  return (
    <div className="my-forms-picker">
      <span className="mfp-label">your forms</span>

      {/* Always-available seed form pill — handy for demos / sealed
          decryption denial story. Not "yours" but always pickable. */}
      <button
        type="button"
        className={`mfp-pill seed${activeFormId === BUG_REPORT_FORM_ID ? ' on' : ''}`}
        onClick={() => onPick(BUG_REPORT_FORM_ID)}
        title="Public Walrus Bug Report seed form (owned by deploy wallet — sealed fields won't decrypt for you)"
      >
        <span className="mfp-emoji">🐞</span>
        Walrus Bug Report
        <small>seed</small>
      </button>

      {isLoading && <span className="mfp-status">⟳ loading from chain…</span>}
      {hasError && <span className="mfp-status err">chain query failed — refresh</span>}

      {owned.map(f => (
        <button
          key={f.formId}
          type="button"
          className={`mfp-pill${activeFormId === f.formId ? ' on' : ''}`}
          onClick={() => onPick(f.formId)}
          title={`${f.title} — ${f.formId.slice(0, 10)}…${f.formId.slice(-6)}`}
        >
          <span className="mfp-emoji">📝</span>
          {f.title}
        </button>
      ))}

      {!isLoading && owned.length === 0 && (
        <span className="mfp-hint">connect wallet + Publish a form to see it here</span>
      )}

      <button
        type="button"
        className="mfp-refresh"
        onClick={() => ownedQuery.refetch()}
        disabled={isLoading}
        title="Refetch your forms from chain"
      >
        ⟳
      </button>
    </div>
  );
}
