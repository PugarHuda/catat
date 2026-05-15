import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';
import { WalrusFile } from '@mysten/walrus';
import { useWalrusClient } from '@/lib/useWalrusClient';
import type { Field, FieldType, FormSchema } from './types';
import { fieldMeta, groupOrder, groupLabels } from './fieldMeta';
import FieldRow from './FieldRow';
import TemplatesGallery from './TemplatesGallery';
import SaveTemplateModal from './SaveTemplateModal';
import { saveCustomTemplate } from './customTemplates';
import SurfaceTabs from '@/components/SurfaceTabs';
import WalletButton from '@/components/WalletButton';
import BrandGlyph from '@/components/BrandGlyph';
import type { Surface } from '@/lib/surfaces';
import {
  BUG_REPORT_FORM_ID,
  CATAT_PACKAGE_ID,
  suiscanObject,
  suiscanTx,
  walruscanBlob,
} from '@/lib/contract';

interface Props {
  schema: FormSchema;
  onSchemaChange: Dispatch<SetStateAction<FormSchema>>;
  activeFormId: string;
  /** Called after Builder successfully creates a new Form object on-chain.
   *  App lifts this id into state so Runner + Admin start operating on it. */
  onFormPublished: (formId: string) => void;
  surface: Surface;
  onSurfaceChange: (s: Surface) => void;
  onHome?: () => void;
}

type PublishState =
  | { kind: 'idle' }
  | { kind: 'publishing'; step: string; subStep?: string }
  /**
   * `indexerConfirmed`: true if `effects.status === 'success'` came back
   *   within the wait window — we know for certain the tx landed.
   * `indexerConfirmed`: false if `waitForTransaction` timed out — the tx
   *   was *submitted* but we never saw confirmation. The Modal renders a
   *   different copy in that case ("Submitted — verify on Suiscan").
   */
  | { kind: 'success'; blobId: string; txHash: string; formId: string; mode: 'create' | 'update'; indexerConfirmed: boolean }
  | { kind: 'error'; message: string };

let nextId = 1000;
const newId = () => `f${nextId++}`;

/**
 * Default field shape for a newly-added field of `type`. The TS exhaustive
 * check on FieldType means TS will flag a missing case at compile-time, but
 * we add a runtime throw too — saved templates from a future schema version
 * would otherwise silently inject undefined defaults.
 */
function defaultsForType(type: FieldType): Partial<Field> {
  switch (type) {
    case 'dropdown':       return { label: 'Dropdown', options: ['Option A', 'Option B', 'Option C'] };
    case 'checkboxes':     return { label: 'Checkboxes', options: ['Choice 1', 'Choice 2'] };
    case 'star_rating':    return { label: 'How would you rate this?', scale: 5 };
    case 'email':          return { label: 'Email' };
    case 'url':            return { label: 'Link' };
    case 'wallet_address': return { label: 'Wallet address' };
    case 'image_upload':   return { label: 'Screenshots' };
    case 'video_upload':   return { label: 'Video upload' };
    case 'rich_text':      return { label: 'Description' };
    case 'short_text':     return { label: 'Question' };
    case 'number':         return { label: 'Number' };
    case 'date':           return { label: 'Date' };
    default: {
      // Unreachable for valid FieldType values; throws if a tampered or
      // future-version template injects an unknown type so the bug
      // surfaces immediately rather than silently writing blank fields.
      const exhaustive: never = type;
      throw new Error(`unknown field type: ${String(exhaustive)}`);
    }
  }
}

/**
 * Map raw wallet/RPC error strings to user-actionable messages. Best-effort
 * pattern-matching on substrings — the underlying SDKs don't expose stable
 * error codes for most of these, so we go by what the strings look like in
 * practice. Order matters: more-specific matches first.
 */
function friendlyError(msg: string): string {
  const lower = msg.toLowerCase();

  // User rejected at the wallet — most common, check first.
  if (lower.includes('user reject') || lower.includes('rejected') || lower.includes('user denied')) {
    return 'You rejected a wallet signature. Try Publish again.';
  }

  // Wrong network — wallet on Mainnet while app on Testnet (or vice versa).
  if (lower.includes('wrongnetwork') || lower.includes('wrong network') || lower.includes('chain mismatch')) {
    return 'Wallet is on the wrong network. Switch to Sui Testnet in your wallet, then retry.';
  }

  // Move abort codes from catat::form (see packages/contracts/sources/form.move:19-21):
  //   ENotAcceptingSubmissions = 1
  //   ENotOwner                = 2
  //   ENoAccess                = 3
  // If we ever bump the package, mirror the new constants here.
  if (lower.includes('movabort') || lower.includes('moveabort') || lower.includes('abort_code')) {
    if (lower.includes('::form::1') || lower.includes(', 1)')) return 'Form is paused — owner has disabled new submissions.';
    if (lower.includes('::form::2') || lower.includes(', 2)')) return 'Only the form owner can perform this action.';
    if (lower.includes('::form::3') || lower.includes(', 3)')) return 'Seal access denied — your wallet is not authorized to decrypt this form.';
    return 'On-chain Move call aborted. The Form object may have been transferred or the package upgraded.';
  }

  // WAL balance — needed to pay Walrus storage tip.
  if (lower.includes('wal') && (lower.includes('insufficient') || lower.includes('balance'))) {
    return 'No spendable WAL token. Click your wallet (top-right) → "Get WAL (swap 0.5 SUI)". Stakely-faucet WAL is the wrong package and won\'t work.';
  }

  // SUI gas — needed to pay tx gas.
  if (lower.includes('sui') && (lower.includes('insufficient') || lower.includes('balance'))) {
    return 'Wallet has no SUI for gas. Get testnet SUI from faucet.sui.io, then come back and click "Get WAL" in your wallet popup.';
  }

  // Gas-coin version race — infrequent now that we wait between sigs.
  if (lower.includes('object version') && lower.includes('unavailable')) {
    return 'Sui gas coin is being reused by another in-flight tx. Refresh the page and retry.';
  }

  // Network/connectivity.
  if (lower.includes('failed to fetch') || lower.includes('network request failed') || lower.includes('econnrefused')) {
    return 'Network request failed. Check your internet, then retry. If persistent, an RPC node may be down.';
  }

  return msg.length > 200 ? msg.slice(0, 200) + '…' : msg;
}

const GALLERY_SEEN_KEY = 'catat:templates-seen';

export default function BuilderSurface({ schema, onSchemaChange: setSchema, activeFormId, onFormPublished, surface, onSurfaceChange, onHome }: Props) {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(schema.fields[0]?.id ?? null);
  const [publishState, setPublishState] = useState<PublishState>({ kind: 'idle' });
  // Templates gallery auto-opens when:
  //   1. First time the user lands on Builder this browser session, OR
  //   2. The canvas is empty (zero fields) — likely after a publish where
  //      they want to start a new form. Without this, returning to Builder
  //      with the default blank canvas leaves them staring at an empty page
  //      with no obvious way to find templates again.
  const [galleryOpen, setGalleryOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (schema.fields.length === 0) return true;
    return sessionStorage.getItem(GALLERY_SEEN_KEY) !== '1';
  });
  const [saveTplOpen, setSaveTplOpen] = useState(false);
  // Bumped on each save so TemplatesGallery re-reads localStorage.
  const [customTplVersion, setCustomTplVersion] = useState(0);
  const closeGallery = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(GALLERY_SEEN_KEY, '1');
    }
    setGalleryOpen(false);
  };

  const account = useCurrentAccount();
  const sui = useSuiClient();
  const queryClient = useQueryClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  // Mirror current account in a ref for use inside async multi-sig flows.
  // The flow's closure captures `account` at call-time but the wallet may
  // switch between sign #1 and sign #3 — `accountRef.current` always sees
  // the latest account so we can detect mid-flow swaps and abort cleanly.
  const accountRef = useRef(account);
  useEffect(() => { accountRef.current = account; }, [account]);

  // Lightweight on-chain ownership check — read Form object's owner field
  // so we can show the "Update this form" button only when the connected
  // wallet actually owns the form (the Move policy on update_schema
  // enforces this; we mirror it in the UI so the user doesn't see a
  // button that would always fail).
  const formMetaQuery = useQuery({
    queryKey: ['form-owner', activeFormId],
    enabled: activeFormId !== BUG_REPORT_FORM_ID,
    queryFn: async () => {
      const obj = await sui.getObject({
        id: activeFormId,
        options: { showContent: true },
      });
      const content = obj.data?.content;
      if (!content || content.dataType !== 'moveObject') return { owner: null as string | null };
      const fields = (content as unknown as { fields: { owner: string } }).fields;
      return { owner: fields.owner ?? null };
    },
    staleTime: 30_000,
  });
  const isOwnedByMe =
    !!account &&
    activeFormId !== BUG_REPORT_FORM_ID &&
    formMetaQuery.data?.owner === account.address;

  const walrusClient = useWalrusClient();

  const addField = (type: FieldType) => {
    const id = newId();
    setSchema(s => ({
      ...s,
      fields: [...s.fields, { id, type, label: 'New field', required: false, ...defaultsForType(type) }],
    }));
    setSelectedFieldId(id);
  };
  const updateField = (id: string, patch: Partial<Field>) => {
    setSchema(s => ({ ...s, fields: s.fields.map(f => (f.id === id ? { ...f, ...patch } : f)) }));
  };
  const removeField = (id: string) => {
    setSchema(s => ({ ...s, fields: s.fields.filter(f => f.id !== id) }));
    if (selectedFieldId === id) {
      const remaining = schema.fields.filter(f => f.id !== id);
      setSelectedFieldId(remaining[0]?.id ?? null);
    }
  };
  const moveField = (id: string, dir: -1 | 1) => {
    setSchema(s => {
      const i = s.fields.findIndex(f => f.id === id);
      if (i < 0) return s;
      const j = i + dir;
      if (j < 0 || j >= s.fields.length) return s;
      const next = [...s.fields];
      const a = next[i]!;
      const b = next[j]!;
      next[i] = b;
      next[j] = a;
      return { ...s, fields: next };
    });
  };

  const handlePublish = async () => {
    if (!account) {
      setPublishState({ kind: 'error', message: 'Connect wallet first (top-right button).' });
      return;
    }
    if (schema.fields.length === 0) {
      setPublishState({ kind: 'error', message: 'Add at least one field before publishing.' });
      return;
    }

    // Lock onto the wallet that initiated this publish. If the user switches
    // accounts between sigs (Slush/Suiet allow this without page reload), we
    // abort — otherwise we'd reserve a Walrus blob with wallet A but mint
    // the Form on Sui under wallet B, leaving the user thinking they own
    // the form when they don't.
    const capturedAddress = account.address;
    const assertSameWallet = () => {
      const current = accountRef.current?.address;
      if (current !== capturedAddress) {
        throw new Error(`Wallet changed mid-publish (${capturedAddress.slice(0, 8)}… → ${current?.slice(0, 8) ?? 'disconnected'}…). Reconnect the original wallet and retry.`);
      }
    };

    try {
      // 1. Upload schema as Walrus blob
      const schemaJson = JSON.stringify(schema, null, 2);
      const file = WalrusFile.from({
        contents: new TextEncoder().encode(schemaJson),
        identifier: 'schema.json',
        tags: { 'content-type': 'application/json' },
      });

      setPublishState({ kind: 'publishing', step: 'Encoding schema for Walrus…' });
      const flow = walrusClient.walrus.writeFilesFlow({ files: [file] });
      // encode() returns the deterministic blob_id (Merkle root of slivers)
      // before any network call. We need it here so we can bake it into the
      // combined certify+create_form PTB below — listFiles() can't be used
      // yet because it requires upload/certify completion first.
      const encoded = await flow.encode();
      const blobId = encoded.blobId;
      if (!blobId) {
        throw new Error('Walrus encode returned no blobId — refusing to start publish flow');
      }

      assertSameWallet();
      setPublishState({ kind: 'publishing', step: 'Sign Walrus reserve', subStep: '1 of 3' });
      const reserveTx = flow.register({ epochs: 26, owner: account.address, deletable: false });
      const reserveResult = await signAndExecute({ transaction: reserveTx });

      setPublishState({ kind: 'publishing', step: 'Uploading via Walrus relay…' });
      await flow.upload({ digest: reserveResult.digest });

      // Sequential 3-sig flow (rolled back from a combined-PTB attempt
      // that proved flaky on testnet — the combined tx's objectChanges
      // didn't reliably surface the new Form object via the public RPC,
      // leaving the publish flow stuck post-sign-2). Three smaller txs
      // index independently and each digest is debuggable on its own.
      assertSameWallet();
      setPublishState({ kind: 'publishing', step: 'Sign Walrus certify', subStep: '2 of 3' });
      const certifyTx = flow.certify();
      const certifyResult = await signAndExecute({ transaction: certifyTx });
      console.log('[publish] Walrus certify confirmed, digest:', certifyResult.digest);

      assertSameWallet();
      setPublishState({ kind: 'publishing', step: 'Sign Sui create_form', subStep: '3 of 3' });
      const createTx = new Transaction();
      createTx.moveCall({
        target: `${CATAT_PACKAGE_ID}::form::create_form`,
        arguments: [
          createTx.pure.string(schema.title),
          createTx.pure.string(blobId),
        ],
      });
      const createResult = await signAndExecute({ transaction: createTx });
      console.log('[publish] Sui create_form submitted, digest:', createResult.digest);

      // Wait for Sui to index the tx and surface objectChanges. The testnet
      // RPC sometimes takes 5-20s to populate objectChanges for a freshly-
      // submitted tx; we retry up to ~30s with explicit progress updates so
      // the user doesn't think the flow has died.
      setPublishState({ kind: 'publishing', step: 'Waiting for Sui indexer…', subStep: '~10–20s' });
      let newFormId: string | undefined;
      const deadline = Date.now() + 30_000;
      let attempt = 0;
      while (!newFormId && Date.now() < deadline) {
        attempt += 1;
        try {
          const txDetails = await sui.waitForTransaction({
            digest: createResult.digest,
            options: { showObjectChanges: true, showEffects: true },
            timeout: 8_000,
          });
          if (txDetails.effects?.status?.status === 'failure') {
            throw new Error(`On-chain execution failed: ${txDetails.effects.status.error ?? 'unknown'}`);
          }
          const formChange = txDetails.objectChanges?.find(
            (c): c is Extract<typeof c, { type: 'created' }> =>
              c.type === 'created' && c.objectType.endsWith('::form::Form'),
          );
          newFormId = formChange?.objectId;
          if (!newFormId) {
            console.warn(`[publish] attempt ${attempt}: no Form object in objectChanges, retrying…`);
            await new Promise(r => setTimeout(r, 1500));
          }
        } catch (waitErr) {
          // waitForTransaction timeout — keep polling within the outer deadline.
          if (Date.now() >= deadline) throw waitErr;
          console.warn(`[publish] attempt ${attempt} timed out, retrying…`);
        }
      }
      if (!newFormId) {
        throw new Error(`Sui indexer didn't return the new Form within 30s. Tx ${createResult.digest.slice(0, 10)}… may still finalize — check Suiscan, then refresh.`);
      }
      console.log('[publish] new Form object id:', newFormId);
      onFormPublished(newFormId);

      // Reaching this point means objectChanges returned a Form object id —
      // the tx was definitively confirmed by the indexer.
      setPublishState({ kind: 'success', blobId, txHash: createResult.digest, formId: newFormId, mode: 'create', indexerConfirmed: true });
      queryClient.invalidateQueries({ queryKey: ['form-stats'] });
      queryClient.invalidateQueries({ queryKey: ['form-real-submissions'] });
    } catch (e) {
      console.error('Publish failed:', e);
      const msg = (e as Error).message || 'Unknown error';
      setPublishState({ kind: 'error', message: friendlyError(msg) });
    }
  };

  /**
   * Update the schema_blob_id of the EXISTING activeFormId via the Move
   * `update_schema(form, new_blob_id, ctx)` function. Owner-only — the
   * Move policy aborts if caller isn't the form's owner. UI gates this
   * via isOwnedByMe so the button is only shown when ownership matches.
   *
   * After update: same form_id, same submission_blob_ids vector (history
   * preserved), but schema_blob_id points to the freshly-uploaded Walrus
   * blob. Existing submissions are still readable; future respondents
   * see the updated schema.
   */
  const handleUpdate = async () => {
    if (!account) {
      setPublishState({ kind: 'error', message: 'Connect wallet first.' });
      return;
    }
    if (schema.fields.length === 0) {
      setPublishState({ kind: 'error', message: 'Add at least one field before updating.' });
      return;
    }
    if (!isOwnedByMe) {
      setPublishState({ kind: 'error', message: 'Only the form owner can update its schema. Use "Publish as new copy" instead.' });
      return;
    }

    // Same wallet-swap guard as handlePublish — the consequences here are
    // worse: an update from wallet B against a Form owned by wallet A
    // will revert with ENotOwner after wasting one Walrus reserve+certify.
    const capturedAddress = account.address;
    const assertSameWallet = () => {
      const current = accountRef.current?.address;
      if (current !== capturedAddress) {
        throw new Error(`Wallet changed mid-update (${capturedAddress.slice(0, 8)}… → ${current?.slice(0, 8) ?? 'disconnected'}…). Reconnect the original wallet and retry.`);
      }
    };

    try {
      const schemaJson = JSON.stringify(schema, null, 2);
      const file = WalrusFile.from({
        contents: new TextEncoder().encode(schemaJson),
        identifier: 'schema.json',
        tags: { 'content-type': 'application/json' },
      });

      setPublishState({ kind: 'publishing', step: 'Encoding new schema for Walrus…' });
      const flow = walrusClient.walrus.writeFilesFlow({ files: [file] });
      const encoded = await flow.encode();
      const blobId = encoded.blobId;
      if (!blobId) throw new Error('Walrus encode returned no blobId');

      assertSameWallet();
      setPublishState({ kind: 'publishing', step: 'Sign Walrus reserve', subStep: '1 of 3' });
      const reserveTx = flow.register({ epochs: 26, owner: account.address, deletable: false });
      const reserveResult = await signAndExecute({ transaction: reserveTx });

      setPublishState({ kind: 'publishing', step: 'Uploading via Walrus relay…' });
      await flow.upload({ digest: reserveResult.digest });

      assertSameWallet();
      setPublishState({ kind: 'publishing', step: 'Sign Walrus certify', subStep: '2 of 3' });
      const certifyTx = flow.certify();
      await signAndExecute({ transaction: certifyTx });
      console.log('[update] Walrus certify confirmed');

      assertSameWallet();
      setPublishState({ kind: 'publishing', step: 'Sign Sui update_schema', subStep: '3 of 3' });
      const updateTx = new Transaction();
      updateTx.moveCall({
        target: `${CATAT_PACKAGE_ID}::form::update_schema`,
        arguments: [
          updateTx.object(activeFormId),
          updateTx.pure.string(blobId),
        ],
      });
      const updateResult = await signAndExecute({ transaction: updateTx });
      console.log('[update] Sui update_schema submitted, digest:', updateResult.digest);

      setPublishState({ kind: 'publishing', step: 'Waiting for Sui indexer…', subStep: '~10–20s' });
      // Two distinct failure modes here, treated differently:
      //   (a) `waitForTransaction` itself throws (timeout, RPC outage, network)
      //       → tolerable — the tx may still have landed, indexer just slow.
      //         Log and continue to success state.
      //   (b) `effects.status === 'failure'` → tx was finalized but the Move
      //       call aborted on-chain. Schema was NOT updated. MUST surface to
      //       user, otherwise we lie about success and trash demo trust.
      let chainFailureMessage: string | null = null;
      let indexerConfirmed = false;
      try {
        const txDetails = await sui.waitForTransaction({
          digest: updateResult.digest,
          options: { showEffects: true },
          timeout: 30_000,
        });
        if (txDetails.effects?.status?.status === 'failure') {
          chainFailureMessage = txDetails.effects.status.error ?? 'unknown abort';
        } else if (txDetails.effects?.status?.status === 'success') {
          indexerConfirmed = true;
        }
      } catch (waitErr) {
        console.warn('[update] indexer wait timed out (tx may still have landed):', waitErr);
      }
      if (chainFailureMessage) {
        throw new Error(`On-chain update_schema reverted: ${chainFailureMessage}`);
      }

      setPublishState({
        kind: 'success',
        blobId,
        txHash: updateResult.digest,
        formId: activeFormId, // same form_id — we updated in place
        mode: 'update',
        indexerConfirmed,
      });
      // Invalidate so MyFormsPicker + useFormSchema + admin all re-read.
      queryClient.invalidateQueries({ queryKey: ['form-stats'] });
      queryClient.invalidateQueries({ queryKey: ['form-real-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['form-schema', activeFormId] });
      queryClient.invalidateQueries({ queryKey: ['form-owner', activeFormId] });
    } catch (e) {
      console.error('Update failed:', e);
      const msg = (e as Error).message || 'Unknown error';
      setPublishState({ kind: 'error', message: friendlyError(msg) });
    }
  };

  const sealedCount = schema.fields.filter(f => f.encrypted).length;
  const selectedField = selectedFieldId ? schema.fields.find(f => f.id === selectedFieldId) ?? null : null;
  const publishing = publishState.kind === 'publishing';

  return (
    <>
      <header className="nav">
        <div className="wrap nav-row">
          <button type="button" onClick={onHome} className="brand" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>
            <BrandGlyph />
            catat
            <small>· builder</small>
          </button>
          <SurfaceTabs current={surface} onChange={onSurfaceChange} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <WalletButton />
          </div>
        </div>
      </header>

      <div className="wrap">
        <div className="sheet">
          <div className="sheet-head">
            <span>Builder · draft</span>
            <button
              type="button"
              className="tpl-pick-btn"
              onClick={() => setGalleryOpen(true)}
              title="Pick from 5 ready-made recipes — bug report, NPS, founder app, contact, feature request"
            >
              📚 Browse templates
            </button>
            <span className="date">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>

          <h1 style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: 1, margin: '0 0 8px', color: 'var(--ink)' }}>
            Sketch your <span className="marker">form</span>.
          </h1>
          <p style={{ fontFamily: 'var(--body)', fontSize: 18, color: 'var(--ink-soft)', margin: '0 0 22px', maxWidth: '60ch' }}>
            Pick a field type from the palette, click any card to edit, toggle 🔒 to seal. Or grab a starter via <b>Browse templates</b> above.
          </p>

          <div className="builder-grid">
            <aside className="palette">
              <h4>Field types</h4>
              <p>tap to add</p>
              <div className="palette-list">
                {groupOrder.map(group => {
                  const items = (Object.entries(fieldMeta) as Array<[FieldType, (typeof fieldMeta)[FieldType]]>)
                    .filter(([, m]) => m.group === group);
                  return (
                    <div key={group}>
                      <div className="palette-section">{groupLabels[group]}</div>
                      {items.map(([type]) => (
                        <button key={type} type="button" className="palette-item" onClick={() => addField(type)}>
                          <span className="ico">{paletteIcon(type)}</span>
                          {fieldMeta[type].label}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            </aside>

            <main className="canvas-wrap">
              <div className="form-meta">
                <div className="form-meta-l">
                  <input
                    type="text"
                    className="form-title-input"
                    value={schema.title}
                    onChange={e => setSchema(s => ({ ...s, title: e.target.value }))}
                    spellCheck={false}
                  />
                  <textarea
                    className="form-desc-input"
                    value={schema.description}
                    onChange={e => setSchema(s => ({ ...s, description: e.target.value }))}
                    placeholder="Describe what this form is for"
                    rows={2}
                    spellCheck={false}
                  />
                </div>
                <div className="form-meta-r">
                  ACTIVE FORM<br />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink)', letterSpacing: 0, textTransform: 'none' }}>
                    {activeFormId.slice(0, 8)}…{activeFormId.slice(-4)}
                  </span>
                </div>
              </div>

              <div className="field-stack">
                {schema.fields.map((f, i) => (
                  <FieldRow
                    key={f.id}
                    field={f}
                    index={i + 1}
                    total={schema.fields.length}
                    selected={selectedFieldId === f.id}
                    onSelect={() => setSelectedFieldId(f.id)}
                    onUpdate={patch => updateField(f.id, patch)}
                    onRemove={() => removeField(f.id)}
                    onMove={dir => moveField(f.id, dir)}
                  />
                ))}
                {schema.fields.length === 0 && (
                  <div className="adm-empty">No fields yet. Pick from the palette on the left.</div>
                )}
              </div>

              {publishState.kind === 'error' && (
                <div className="submit-error" style={{ marginTop: 16 }}>
                  <div className="body">
                    <b>Publish failed</b>
                    <code>{publishState.message}</code>
                  </div>
                </div>
              )}
              {publishing && (
                <div className="publish-progress">
                  <span style={{ width: 16, height: 16, border: '2px dashed var(--marker-green)', borderRadius: '50%', animation: 'spin 1.4s linear infinite' }} />
                  {publishState.step}
                  {publishState.subStep && <small>· {publishState.subStep}</small>}
                </div>
              )}

              <div className="publish-bar">
                <div className="left">
                  <b>{schema.fields.length} fields</b>
                  · {sealedCount} sealed · gate off · 26 epochs
                  {isOwnedByMe && (
                    <span style={{ display: 'block', marginTop: 4, fontFamily: 'var(--type)', fontSize: 10, color: 'var(--marker-green)', letterSpacing: '0.08em' }}>
                      ✓ YOU OWN THIS FORM — UPDATE PRESERVES SUBMISSION HISTORY
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setSaveTplOpen(true)}
                    disabled={publishing || schema.fields.length === 0}
                    title={schema.fields.length === 0 ? 'Add a field first' : 'Save this draft as a reusable template (browser-local)'}
                  >
                    💾 Save as template
                  </button>
                  <button type="button" className="btn btn-sm" onClick={() => onSurfaceChange('runner')} disabled={publishing}>
                    Preview
                  </button>
                  {isOwnedByMe && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleUpdate}
                      disabled={publishing || !account || schema.fields.length === 0}
                      title="Replace the schema_blob_id of THIS on-chain Form — same form_id, history preserved"
                    >
                      {publishing ? 'updating…' : '↻ Update this form'}
                    </button>
                  )}
                  <button
                    type="button"
                    className={isOwnedByMe ? 'btn btn-sm' : 'btn btn-primary btn-sm'}
                    onClick={handlePublish}
                    disabled={publishing || !account || schema.fields.length === 0}
                    title={!account ? 'Connect wallet first' : schema.fields.length === 0 ? 'Add a field first' : isOwnedByMe ? 'Mint a NEW Form (fork) — gets its own form_id + empty inbox' : 'Upload schema to Walrus + create Form on Sui'}
                  >
                    {publishing ? 'publishing…' : isOwnedByMe ? 'Publish as new copy' : 'Publish to Walrus →'}
                  </button>
                </div>
              </div>
            </main>

            <aside className="settings">
              {selectedField ? (
                <div className="set-card selected">
                  <h5>🪶 Field — <span style={{ color: 'var(--marker-blue)' }}>{selectedField.type.replace('_', ' ')}</span></h5>
                  <div className="set-row">
                    <label>Question</label>
                    <input
                      type="text"
                      value={selectedField.label}
                      onChange={e => updateField(selectedField.id, { label: e.target.value })}
                    />
                  </div>
                  <div className="set-row">
                    <label>Required</label>
                    <button
                      type="button"
                      className={`toggle${selectedField.required ? ' on' : ''}`}
                      onClick={() => updateField(selectedField.id, { required: !selectedField.required })}
                      aria-label="Toggle required"
                    />
                  </div>
                  <div className="set-row">
                    <label>🔒 Sealed</label>
                    <button
                      type="button"
                      className={`toggle${selectedField.encrypted ? ' on' : ''}`}
                      onClick={() => updateField(selectedField.id, { encrypted: !selectedField.encrypted })}
                      aria-label="Toggle sealed"
                    />
                  </div>
                  {selectedField.encrypted && (
                    <div className="seal-warn">
                      Encrypted client-side via Seal IBE (2-of-3 threshold). On-chain <code>seal_approve_owner</code> policy enforces that only this form&rsquo;s owner wallet can fetch decryption keys.
                    </div>
                  )}
                </div>
              ) : (
                <div className="set-card">
                  <h5>🪶 Click a field</h5>
                  <p style={{ fontFamily: 'var(--body)', fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>
                    Settings for the selected field appear here.
                  </p>
                </div>
              )}

              <div className="set-card">
                <h5>🌐 Form settings</h5>
                <div className="set-row">
                  <label>Token gate</label>
                  <button type="button" className="toggle" aria-label="Toggle token gate" />
                </div>
                <div className="set-row">
                  <label>Epochs</label>
                  <span style={{ fontFamily: 'var(--hand)', fontSize: 22, color: 'var(--ink)' }}>26</span>
                </div>
                <div className="set-row">
                  <label>Public count</label>
                  <button type="button" className="toggle on" aria-label="Toggle public count" />
                </div>
              </div>

              <div className="postit blue" style={{ transform: 'rotate(-2deg)' }}>
                <b>tip</b>
                Publish creates a NEW Form on-chain owned by your wallet — anyone can fork the demo. The reference form ID at top stays the same.
              </div>
            </aside>
          </div>
        </div>
      </div>

      {publishState.kind === 'success' && (
        <PublishedModal
          blobId={publishState.blobId}
          txHash={publishState.txHash}
          formId={publishState.formId}
          schemaTitle={schema.title}
          mode={publishState.mode}
          indexerConfirmed={publishState.indexerConfirmed}
          onClose={() => setPublishState({ kind: 'idle' })}
        />
      )}

      {galleryOpen && (
        <TemplatesGallery
          currentSchemaId={schema.id}
          customTplVersion={customTplVersion}
          onCustomTplDeleted={() => setCustomTplVersion(v => v + 1)}
          onPick={picked => {
            // Loading a template replaces the draft entirely. The user can
            // then edit any field — they're not coupled to the on-disk
            // template after load. Selected field resets to the first.
            // The gallery component calls onClose() after onPick, which
            // routes to closeGallery() and persists the seen flag.
            setSchema(picked);
            setSelectedFieldId(picked.fields[0]?.id ?? null);
          }}
          onClose={closeGallery}
        />
      )}

      {saveTplOpen && (
        <SaveTemplateModal
          schema={schema}
          onSave={({ name, emoji, description }) => {
            const result = saveCustomTemplate({ name, emoji, description, schema });
            if (!result.persist.ok) {
              // Surface the failure instead of pretending the save worked.
              // The template would otherwise vanish on the next refresh and
              // the user wouldn't know why.
              const reasonText =
                result.persist.reason === 'quota'
                  ? 'localStorage is full — clear old templates or browser data and retry.'
                  : result.persist.reason === 'private-mode'
                  ? "Browser is in private mode — localStorage isn't persisted. Switch to a normal window."
                  : `Couldn't save: ${result.persist.message}`;
              alert(`Template not saved.\n\n${reasonText}`);
              return;
            }
            setCustomTplVersion(v => v + 1);
            setSaveTplOpen(false);
          }}
          onClose={() => setSaveTplOpen(false)}
        />
      )}
    </>
  );
}

interface ModalProps {
  blobId: string;
  txHash: string;
  formId: string;
  schemaTitle: string;
  mode: 'create' | 'update';
  /** Whether the indexer confirmed the tx within the wait window. */
  indexerConfirmed: boolean;
  onClose: () => void;
}

function PublishedModal({ blobId, txHash, formId, schemaTitle, mode, indexerConfirmed, onClose }: ModalProps) {
  const blobShort = `${blobId.slice(0, 12)}…${blobId.slice(-6)}`;
  const txShort = `${txHash.slice(0, 12)}…${txHash.slice(-6)}`;
  const formShort = `${formId.slice(0, 12)}…${formId.slice(-6)}`;
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?f=${formId}&go=submit`
    : `https://catat-walrus.vercel.app/?f=${formId}&go=submit`;
  const [copied, setCopied] = useState<'ok' | 'manual' | null>(null);
  const manualSelectRef = useRef<HTMLInputElement>(null);
  const copyShare = async () => {
    // Try modern Clipboard API first.
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied('ok');
      setTimeout(() => setCopied(null), 1800);
      return;
    } catch (err) {
      console.warn('clipboard API blocked, falling back to execCommand:', err);
    }
    // Fallback: deprecated but universally-supported execCommand. Need
    // a focused, selected input element. We render a hidden input below
    // and select its value here.
    const input = manualSelectRef.current;
    if (input) {
      input.removeAttribute('readonly');
      input.focus();
      input.select();
      input.setSelectionRange(0, input.value.length);
      try {
        const ok = document.execCommand('copy');
        input.setAttribute('readonly', '');
        if (ok) {
          setCopied('ok');
          setTimeout(() => setCopied(null), 1800);
          return;
        }
      } catch (err) {
        console.warn('execCommand copy failed:', err);
      }
    }
    // Last-resort: surface the input as a manual-select fallback (no alert
    // popup — alerts feel broken on mobile + can be dismissed by accident).
    setCopied('manual');
  };

  // When the indexer never confirmed within the wait window, soften every
  // visible "this happened on-chain!" claim — the tx is *probably* fine but
  // we don't have positive proof. Encourages the user to check Suiscan.
  const stampLabel = !indexerConfirmed
    ? 'submitted'
    : mode === 'update' ? 'updated!' : 'published!';
  const headline = !indexerConfirmed
    ? mode === 'update' ? 'Update submitted — verify on Suiscan.' : 'Publish submitted — verify on Suiscan.'
    : mode === 'update' ? 'Schema updated on-chain.' : 'Your form is on-chain.';

  return (
    <div className="publish-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="publish-modal">
        <div
          className="publish-stamp"
          style={
            !indexerConfirmed
              ? { background: 'var(--marker-yellow, #d4a44d)' }
              : mode === 'update'
                ? { background: 'var(--marker-green)' }
                : undefined
          }
        >
          {stampLabel}
        </div>
        <h3>{headline}</h3>
        <p>
          <b>{schemaTitle}</b> —{' '}
          {!indexerConfirmed ? (
            <>
              tx submitted to the wallet but the Sui indexer didn't confirm within 30s.
              The tx <i>probably</i> landed — check Suiscan below to verify before sharing the link.
            </>
          ) : mode === 'update' ? (
            <>
              new schema blob on Walrus, <code style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>update_schema</code> recorded on Sui.
              {' '}
              <b style={{ color: 'var(--marker-green)' }}>Same form_id, same submission history</b> — only the schema pointer changed.
            </>
          ) : (
            <>
              schema on Walrus, Form minted on Sui owned by your wallet.
              {' '}
              <b style={{ color: 'var(--marker-green)' }}>Submit + Inbox now point to this form.</b>
              {' '}
              Decrypt sealed fields from Inbox after collecting replies.
            </>
          )}
        </p>

        <div className="share-link">
          <div className="sl-label">share with respondents</div>
          <div className="sl-row">
            <code>{shareUrl}</code>
            <button type="button" onClick={copyShare} className="btn btn-sm btn-primary">
              {copied === 'ok' ? '✓ copied' : 'Copy link'}
            </button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm"
              title="Open the standalone form in a new tab"
            >
              Open ↗
            </a>
          </div>
          {copied === 'manual' && (
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--marker-yellow, #d4a44d)' }}>
              ⚠ Browser blocked clipboard access. Select &amp; copy manually:
              <input
                ref={manualSelectRef}
                type="text"
                value={shareUrl}
                readOnly
                onFocus={e => e.currentTarget.select()}
                style={{ display: 'block', width: '100%', marginTop: 6, padding: 6, fontFamily: 'var(--mono)', fontSize: 12 }}
              />
            </div>
          )}
          {copied !== 'manual' && (
            // Always-mounted but hidden input target for the execCommand
            // fallback path. We can't conditionally mount only when needed
            // because copyShare is async + the input must exist when
            // .focus() fires.
            <input
              ref={manualSelectRef}
              type="text"
              defaultValue={shareUrl}
              readOnly
              tabIndex={-1}
              aria-hidden="true"
              style={{ position: 'absolute', left: -9999, top: -9999, opacity: 0, pointerEvents: 'none' }}
            />
          )}
          <small>opens this form directly in Submit mode for anyone with the URL</small>
        </div>

        <div className="receipt-row">
          <span>form object</span>
          <a href={suiscanObject(formId)} target="_blank" rel="noopener noreferrer">
            {formShort}
          </a>
        </div>
        <div className="receipt-row">
          <span>schema blob</span>
          <a href={walruscanBlob(blobId)} target="_blank" rel="noopener noreferrer">
            {blobShort}
          </a>
        </div>
        <div className="receipt-row">
          <span>create_form tx</span>
          <a href={suiscanTx(txHash)} target="_blank" rel="noopener noreferrer">
            {txShort}
          </a>
        </div>
        <div className="receipt-row">
          <span>move package</span>
          <a href={suiscanObject(CATAT_PACKAGE_ID)} target="_blank" rel="noopener noreferrer">
            {`${CATAT_PACKAGE_ID.slice(0, 12)}…`}
          </a>
        </div>
        <div className="receipt-row">
          <span>storage</span>
          <b>26 epochs (~26 days)</b>
        </div>

        <div className="actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>Close</button>
          <a className="btn btn-sm" href={suiscanObject(formId)} target="_blank" rel="noopener noreferrer">
            Open Form ↗
          </a>
          <a className="btn btn-sm" href={suiscanTx(txHash)} target="_blank" rel="noopener noreferrer">
            create_form tx ↗
          </a>
        </div>
      </div>
    </div>
  );
}

function paletteIcon(type: FieldType): string {
  switch (type) {
    case 'short_text': return 'Aa';
    case 'rich_text': return '¶';
    case 'dropdown': return '◉';
    case 'checkboxes': return '☑';
    case 'star_rating': return '★';
    case 'image_upload': return '📎';
    case 'video_upload': return '🎬';
    case 'url': return '🔗';
    case 'email': return '@';
    case 'wallet_address': return '◊';
    case 'number': return '#';
    case 'date': return '📅';
  }
}
