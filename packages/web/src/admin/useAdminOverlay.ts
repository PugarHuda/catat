import { useCallback, useEffect, useRef, useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { WalrusFile } from '@mysten/walrus';
import { useWalrusClient } from '@/lib/useWalrusClient';
import type { Submission } from './types';

/**
 * Per-submission triage state that lives outside the immutable Walrus blob:
 * status, priority, free-text notes. Keyed by Submission.id.
 */
export type OverlayPatch = Partial<Pick<Submission, 'status' | 'priority' | 'notes' | 'tags'>>;
export type OverlayMap = Map<string, OverlayPatch>;

interface BackupEntry {
  blobId: string;
  /** ISO timestamp of when the backup was written. */
  savedAtIso: string;
  /** How many submissions had patches at backup time. */
  count: number;
}

interface PersistedShape {
  version: 1;
  formId: string;
  patches: Record<string, OverlayPatch>;
  lastBackup?: BackupEntry;
}

const LS_PREFIX = 'catat:admin-overlay:v1:';

function lsKey(formId: string): string {
  return `${LS_PREFIX}${formId}`;
}

function loadFromLocal(formId: string): { overlay: OverlayMap; lastBackup?: BackupEntry } {
  if (typeof window === 'undefined') return { overlay: new Map() };
  try {
    const raw = window.localStorage.getItem(lsKey(formId));
    if (!raw) return { overlay: new Map() };
    const parsed = JSON.parse(raw) as Partial<PersistedShape>;
    if (parsed.version !== 1 || parsed.formId !== formId) return { overlay: new Map() };
    // Defensive: localStorage values can be tampered (extension, manual
    // devtools edit, future schema migration leaving v1 keys around). If
    // `patches` is anything other than a plain object, Object.entries will
    // throw and crash the entire AdminSurface render. Coerce to {}.
    const patchesRaw = parsed.patches;
    const patches = (patchesRaw && typeof patchesRaw === 'object' && !Array.isArray(patchesRaw))
      ? (patchesRaw as Record<string, OverlayPatch>)
      : {};
    return {
      overlay: new Map(Object.entries(patches)),
      lastBackup: parsed.lastBackup,
    };
  } catch (err) {
    console.warn('[admin-overlay] localStorage hydrate failed:', err);
    return { overlay: new Map() };
  }
}

function saveToLocal(formId: string, overlay: OverlayMap, lastBackup?: BackupEntry) {
  if (typeof window === 'undefined') return;
  try {
    const patches: Record<string, OverlayPatch> = {};
    overlay.forEach((v, k) => { patches[k] = v; });
    const persisted: PersistedShape = { version: 1, formId, patches, lastBackup };
    window.localStorage.setItem(lsKey(formId), JSON.stringify(persisted));
  } catch (err) {
    console.warn('[admin-overlay] localStorage save failed:', err);
  }
}

/**
 * Manages the admin triage overlay with two persistence layers:
 * 1. localStorage — synchronous, always-on, survives refresh, per-formId
 * 2. Walrus blob — explicit backup/restore for cross-device + on-chain proof
 *
 * The Walrus path requires 2 wallet sigs (reserve + certify) per backup.
 * It returns a blob_id that the form owner can copy/share, and any browser
 * with that blob_id can hydrate the overlay via `restoreFromWalrus`.
 */
export function useAdminOverlay(activeFormId: string) {
  const sui = useSuiClient();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [overlay, setOverlayState] = useState<OverlayMap>(new Map());
  const [lastBackup, setLastBackup] = useState<BackupEntry | undefined>();
  const [busy, setBusy] = useState<'idle' | 'backing-up' | 'restoring'>('idle');
  const lastFormIdRef = useRef<string | null>(null);
  // Mirror lastBackup in a ref so setOverlay's closure always reads the
  // latest backup metadata. Without this, after a backup completes and
  // setLastBackup updates state, the next patchSubmission call still
  // persists the stale (undefined or older) lastBackup, intermittently
  // wiping the "↗ last backup" link.
  const lastBackupRef = useRef<BackupEntry | undefined>(lastBackup);
  useEffect(() => { lastBackupRef.current = lastBackup; }, [lastBackup]);

  const walrusClient = useWalrusClient();

  // Hydrate from localStorage when the active form changes.
  useEffect(() => {
    if (lastFormIdRef.current === activeFormId) return;
    lastFormIdRef.current = activeFormId;
    const { overlay: loaded, lastBackup: lb } = loadFromLocal(activeFormId);
    setOverlayState(loaded);
    setLastBackup(lb);
  }, [activeFormId]);

  // Mutator that also persists to localStorage immediately. Reads
  // lastBackup from the ref so we never persist a stale value (see
  // lastBackupRef declaration for the bug context).
  const setOverlay = useCallback((updater: (prev: OverlayMap) => OverlayMap) => {
    setOverlayState(prev => {
      const next = updater(prev);
      saveToLocal(activeFormId, next, lastBackupRef.current);
      return next;
    });
  }, [activeFormId]);

  const patchSubmission = useCallback((id: string, patch: OverlayPatch) => {
    setOverlay(prev => {
      const next = new Map(prev);
      const merged = { ...(next.get(id) ?? {}), ...patch };
      next.set(id, merged);
      return next;
    });
  }, [setOverlay]);

  const backupToWalrus = useCallback(async (): Promise<BackupEntry | { error: string }> => {
    if (!account) return { error: 'Connect wallet to back up to Walrus.' };
    if (overlay.size === 0) return { error: 'Overlay is empty — nothing to back up.' };

    setBusy('backing-up');
    try {
      const patches: Record<string, OverlayPatch> = {};
      overlay.forEach((v, k) => { patches[k] = v; });
      const payload: PersistedShape = { version: 1, formId: activeFormId, patches };
      const file = WalrusFile.from({
        contents: new TextEncoder().encode(JSON.stringify(payload)),
        identifier: `admin_overlay_${activeFormId}.json`,
        tags: { 'content-type': 'application/json' },
      });

      const flow = walrusClient.walrus.writeFilesFlow({ files: [file] });
      await flow.encode();
      const reserveTx = flow.register({ epochs: 26, owner: account.address, deletable: false });
      const reserveResult = await signAndExecute({ transaction: reserveTx });
      await flow.upload({ digest: reserveResult.digest });
      const certifyTx = flow.certify();
      await signAndExecute({ transaction: certifyTx });

      const filesUploaded = await flow.listFiles();
      const blobId = filesUploaded[0]?.blobId;
      if (!blobId) throw new Error('Walrus certify returned no blobId');

      const entry: BackupEntry = {
        blobId,
        savedAtIso: new Date().toISOString(),
        count: overlay.size,
      };
      setLastBackup(entry);
      saveToLocal(activeFormId, overlay, entry);
      return entry;
    } catch (err) {
      return { error: (err as Error).message };
    } finally {
      setBusy('idle');
    }
  }, [account, overlay, activeFormId, walrusClient, signAndExecute]);

  const restoreFromWalrus = useCallback(async (blobId: string): Promise<{ count: number } | { error: string }> => {
    setBusy('restoring');
    try {
      // Overlay backup is Quilt-wrapped (identifier matches the file name
      // written by backupToWalrus). Quilt-aware read with whole-blob fallback
      // for older single-blob backups.
      const blob = await walrusClient.walrus.getBlob({ blobId: blobId.trim() });
      const files = await blob.files({});
      const overlayFile = files[0] ?? blob.asFile();
      const parsed = (await overlayFile.json()) as PersistedShape;
      if (parsed.version !== 1) return { error: `Unsupported overlay version: ${parsed.version}` };
      // Merge — restore doesn't wipe, so user keeps their unsaved local edits.
      setOverlay(prev => {
        const next = new Map(prev);
        Object.entries(parsed.patches).forEach(([k, v]) => {
          next.set(k, { ...(next.get(k) ?? {}), ...v });
        });
        return next;
      });
      return { count: Object.keys(parsed.patches).length };
    } catch (err) {
      return { error: (err as Error).message };
    } finally {
      setBusy('idle');
    }
  }, [walrusClient, setOverlay]);

  return { overlay, patchSubmission, lastBackup, backupToWalrus, restoreFromWalrus, busy };
}
