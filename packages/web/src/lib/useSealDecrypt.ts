import { useCallback, useMemo, useRef } from 'react';
import { useCurrentAccount, useSignPersonalMessage, useSuiClient } from '@mysten/dapp-kit';
import { SealClient, SessionKey, EncryptedObject } from '@mysten/seal';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64, fromHex } from '@mysten/sui/utils';
import { SEAL_KEY_SERVERS_TESTNET } from './contract';

/**
 * Persisted shape of a single sealed-field value inside the Walrus
 * submission JSON. RunnerSurface writes this; AdminDetail reads it.
 */
export interface SealedFieldMeta {
  encrypted: true;
  scheme: string;
  packageId: string;
  formId: string;
  fieldId: string;
  keyId: string;
  ciphertext_b64: string;
  ciphertext_bytes: number;
  plaintext_bytes: number;
}

const SESSION_TTL_MIN = 10;

/**
 * Returns a `decrypt(meta)` callback. The first call in a session pops the
 * wallet for a personal-message signature (creates a SessionKey valid for
 * SESSION_TTL_MIN). Subsequent calls within the same component tree reuse
 * that key — no extra popups.
 *
 * Requires the on-chain `seal_approve_owner(id, form, ctx)` policy. The
 * Move call is built and dry-run by Seal's key servers; if it aborts
 * (caller != form.owner, or id prefix mismatch), no key shares come back.
 */
export function useSealDecrypt() {
  const account = useCurrentAccount();
  const sui = useSuiClient();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const sessionKeyRef = useRef<SessionKey | null>(null);
  // In-flight session-key creation promise. Multiple decrypt() calls fired
  // concurrently (e.g. user clicks decrypt on field A, then quickly on
  // field B before signing) all await the SAME wallet popup instead of
  // each spawning their own — without this, both signPersonalMessage
  // popups would resolve and race to set sessionKeyRef.current, which can
  // leave the second-resolving key written there even though the first
  // call already used a different one.
  const sessionKeyPromiseRef = useRef<Promise<SessionKey> | null>(null);

  const sealClient = useMemo(
    () =>
      new SealClient({
        suiClient: sui as unknown as ConstructorParameters<typeof SealClient>[0]['suiClient'],
        serverConfigs: SEAL_KEY_SERVERS_TESTNET.map(objectId => ({ objectId, weight: 1 })),
      }),
    [sui],
  );

  return useCallback(
    async (meta: SealedFieldMeta): Promise<string> => {
      if (!account) throw new Error('Connect wallet to decrypt');

      let sessionKey = sessionKeyRef.current;
      // packageId mismatch invalidates the session — Seal binds the session
      // signature to a specific Move package so we can't reuse a key signed
      // for a different package.
      const sessionStale =
        !sessionKey ||
        sessionKey.isExpired() ||
        sessionKey.getAddress() !== account.address ||
        sessionKey.getPackageId() !== meta.packageId;

      if (sessionStale) {
        try {
          // If another concurrent caller already started a session-key
          // creation, await theirs instead of starting a second wallet
          // popup. Distinct addresses/packageIds break sharing — we only
          // share when the in-flight key matches what THIS caller needs.
          if (!sessionKeyPromiseRef.current) {
            sessionKeyPromiseRef.current = (async () => {
              const newKey = await SessionKey.create({
                address: account.address,
                packageId: meta.packageId,
                ttlMin: SESSION_TTL_MIN,
                suiClient: sui as unknown as Parameters<typeof SessionKey.create>[0]['suiClient'],
              });
              const sig = await signPersonalMessage({
                message: newKey.getPersonalMessage(),
              });
              await newKey.setPersonalMessageSignature(sig.signature);
              sessionKeyRef.current = newKey;
              return newKey;
            })().finally(() => {
              // Clear the in-flight slot so a future stale-session check
              // can spawn a fresh popup later.
              sessionKeyPromiseRef.current = null;
            });
          }
          sessionKey = await sessionKeyPromiseRef.current;
        } catch (err) {
          throw tagPhase('session-key', err);
        }
      }

      let ciphertextBytes: Uint8Array;
      let idHex: string;
      try {
        ciphertextBytes = fromBase64(meta.ciphertext_b64);
        idHex = EncryptedObject.parse(ciphertextBytes).id;
      } catch (err) {
        throw tagPhase('parse-ciphertext', err);
      }
      const idBytes = fromHex(idHex);

      const tx = new Transaction();
      tx.moveCall({
        target: `${meta.packageId}::form::seal_approve_owner`,
        arguments: [tx.pure.vector('u8', idBytes), tx.object(meta.formId)],
      });
      const txBytes = await tx.build({ client: sui, onlyTransactionKind: true });

      try {
        await sealClient.fetchKeys({
          ids: [idHex],
          txBytes,
          sessionKey: sessionKey!,
          threshold: 2,
        });
      } catch (err) {
        throw tagPhase('fetch-keys', err);
      }

      try {
        const plaintextBytes = await sealClient.decrypt({
          data: ciphertextBytes,
          sessionKey: sessionKey!,
          txBytes,
        });
        return new TextDecoder().decode(plaintextBytes);
      } catch (err) {
        throw tagPhase('decrypt', err);
      }
    },
    [account, sui, signPersonalMessage, sealClient],
  );
}

function tagPhase(phase: string, err: unknown): Error {
  const orig = err instanceof Error ? err : new Error(String(err));
  const tagged = new Error(`[seal:${phase}] ${orig.message}`);
  tagged.cause = orig;
  return tagged;
}
