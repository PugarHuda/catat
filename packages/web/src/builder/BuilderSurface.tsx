import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';
import { walrus, WalrusFile } from '@mysten/walrus';
import walrusWasmUrl from '@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url';
import type { Field, FieldType, FormSchema } from './types';
import { fieldMeta, groupOrder, groupLabels } from './fieldMeta';
import FieldRow from './FieldRow';
import TemplatesGallery from './TemplatesGallery';
import SurfaceTabs from '@/components/SurfaceTabs';
import WalletButton from '@/components/WalletButton';
import BrandGlyph from '@/components/BrandGlyph';
import type { Surface } from '@/lib/surfaces';
import {
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
  | { kind: 'success'; blobId: string; txHash: string; formId: string }
  | { kind: 'error'; message: string };

let nextId = 1000;
const newId = () => `f${nextId++}`;

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
  }
}

function friendlyError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('user reject') || lower.includes('rejected')) return 'You rejected a wallet signature. Try Publish again.';
  if (lower.includes('wal') && (lower.includes('insufficient') || lower.includes('balance'))) return 'Wallet has no WAL token. Get testnet WAL from stakely.io/faucet/walrus-testnet-wal.';
  if (lower.includes('sui') && (lower.includes('insufficient') || lower.includes('balance'))) return 'Wallet has no SUI for gas. Get testnet SUI from faucet.sui.io.';
  return msg.length > 200 ? msg.slice(0, 200) + '…' : msg;
}

export default function BuilderSurface({ schema, onSchemaChange: setSchema, activeFormId, onFormPublished, surface, onSurfaceChange, onHome }: Props) {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(schema.fields[0]?.id ?? null);
  const [publishState, setPublishState] = useState<PublishState>({ kind: 'idle' });
  const [galleryOpen, setGalleryOpen] = useState(false);

  const account = useCurrentAccount();
  const sui = useSuiClient();
  const queryClient = useQueryClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const walrusClient = useMemo(() => {
    return sui.$extend(
      walrus({
        wasmUrl: walrusWasmUrl,
        uploadRelay: {
          host: 'https://upload-relay.testnet.walrus.space',
          sendTip: { max: 1_000 },
        },
      }),
    );
  }, [sui]);

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
      await flow.encode();

      setPublishState({ kind: 'publishing', step: 'Sign Walrus reserve', subStep: '1 of 3' });
      const reserveTx = flow.register({ epochs: 26, owner: account.address, deletable: false });
      const reserveResult = await signAndExecute({ transaction: reserveTx });

      setPublishState({ kind: 'publishing', step: 'Uploading via Walrus relay…' });
      await flow.upload({ digest: reserveResult.digest });

      setPublishState({ kind: 'publishing', step: 'Sign Walrus certify', subStep: '2 of 3' });
      const certifyTx = flow.certify();
      await signAndExecute({ transaction: certifyTx });

      const filesUploaded = await flow.listFiles();
      const blobId = filesUploaded[0]?.blobId;
      if (!blobId) {
        throw new Error('Walrus certify returned no blobId — refusing to mint Form pointing to empty schema');
      }

      // 2. Mint a new Form on Sui via catat::form::create_form
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

      // Extract the freshly-created Form object id so Runner + Admin can switch
      // to it. signAndExecute by default returns just the digest — we need to
      // wait for indexing then fetch the tx with showObjectChanges to see the
      // Form created by create_form().
      const txDetails = await sui.waitForTransaction({
        digest: createResult.digest,
        options: { showObjectChanges: true },
      });
      const formChange = txDetails.objectChanges?.find(
        (c): c is Extract<typeof c, { type: 'created' }> =>
          c.type === 'created' && c.objectType.endsWith('::form::Form'),
      );
      const newFormId = formChange?.objectId;
      if (!newFormId) {
        throw new Error('create_form succeeded but Form object id was not found in objectChanges');
      }
      onFormPublished(newFormId);

      setPublishState({ kind: 'success', blobId, txHash: createResult.digest, formId: newFormId });
      queryClient.invalidateQueries({ queryKey: ['form-stats'] });
      queryClient.invalidateQueries({ queryKey: ['form-real-submissions'] });
    } catch (e) {
      console.error('Publish failed:', e);
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
            <span className="date">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>

          <h1 style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: 1, margin: '0 0 8px', color: 'var(--ink)' }}>
            Sketch your <span className="marker">form</span>.
          </h1>
          <p style={{ fontFamily: 'var(--body)', fontSize: 18, color: 'var(--ink-soft)', margin: '0 0 22px', maxWidth: '60ch' }}>
            Pick a field type from the palette, click any card to edit, toggle 🔒 to seal. Schema lives on Walrus, the form is a Sui shared object.
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
                  <button
                    type="button"
                    className="tpl-open-btn"
                    onClick={() => setGalleryOpen(true)}
                    title="Pick from a starter template"
                  >
                    📚 Templates
                  </button>
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
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-sm" onClick={() => onSurfaceChange('runner')} disabled={publishing}>
                    Preview
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handlePublish}
                    disabled={publishing || !account || schema.fields.length === 0}
                    title={!account ? 'Connect wallet first' : schema.fields.length === 0 ? 'Add a field first' : 'Upload schema to Walrus + create Form on Sui'}
                  >
                    {publishing ? 'publishing…' : 'Publish to Walrus →'}
                  </button>
                </div>
              </div>
            </main>

            <aside className="settings">
              {selectedField ? (
                <div className="set-card selected">
                  <h5>🪶 Field — <span style={{ color: 'var(--marker-red)' }}>{selectedField.type.replace('_', ' ')}</span></h5>
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
          onClose={() => setPublishState({ kind: 'idle' })}
        />
      )}

      {galleryOpen && (
        <TemplatesGallery
          currentSchemaId={schema.id}
          onPick={picked => {
            // Loading a template replaces the draft entirely. The user can
            // then edit any field — they're not coupled to the on-disk
            // template after load. Selected field resets to the first.
            setSchema(picked);
            setSelectedFieldId(picked.fields[0]?.id ?? null);
          }}
          onClose={() => setGalleryOpen(false)}
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
  onClose: () => void;
}

function PublishedModal({ blobId, txHash, formId, schemaTitle, onClose }: ModalProps) {
  const blobShort = `${blobId.slice(0, 12)}…${blobId.slice(-6)}`;
  const txShort = `${txHash.slice(0, 12)}…${txHash.slice(-6)}`;
  const formShort = `${formId.slice(0, 12)}…${formId.slice(-6)}`;

  return (
    <div className="publish-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="publish-modal">
        <div className="publish-stamp">published!</div>
        <h3>Your form is on-chain.</h3>
        <p>
          <b>{schemaTitle}</b> — schema on Walrus, Form minted on Sui owned by your wallet.
          {' '}
          <b style={{ color: 'var(--marker-green)' }}>Submit + Inbox now point to this form.</b>
          {' '}
          Decrypt sealed fields from Inbox after collecting replies.
        </p>

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
