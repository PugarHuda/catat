import { useCallback, useMemo, useRef } from 'react';
import { useCurrentAccount, useSignPersonalMessage, useSuiClient } from '@mysten/dapp-kit';
import { SealClient, SessionKey, EncryptedObject } from '@mysten/seal';
import { Transaction } from '@mysten/sui/transactions';
import { fromHex } from '@mysten/sui/utils';
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
      const sessionStale =
        !sessionKey ||
        sessionKey.isExpired() ||
        sessionKey.getAddress() !== account.address;

      if (sessionStale) {
        sessionKey = await SessionKey.create({
          address: account.address,
          packageId: meta.packageId,
          ttlMin: SESSION_TTL_MIN,
          suiClient: sui as unknown as Parameters<typeof SessionKey.create>[0]['suiClient'],
        });
        const sig = await signPersonalMessage({
          message: sessionKey.getPersonalMessage(),
        });
        await sessionKey.setPersonalMessageSignature(sig.signature);
        sessionKeyRef.current = sessionKey;
      }

      const ciphertextBytes = base64ToBytes(meta.ciphertext_b64);
      const idHex = EncryptedObject.parse(ciphertextBytes).id;
      const idBytes = fromHex(idHex);

      const tx = new Transaction();
      tx.moveCall({
        target: `${meta.packageId}::form::seal_approve_owner`,
        arguments: [tx.pure.vector('u8', idBytes), tx.object(meta.formId)],
      });
      const txBytes = await tx.build({ client: sui, onlyTransactionKind: true });

      await sealClient.fetchKeys({
        ids: [idHex],
        txBytes,
        sessionKey: sessionKey!,
        threshold: 2,
      });

      const plaintextBytes = await sealClient.decrypt({
        data: ciphertextBytes,
        sessionKey: sessionKey!,
        txBytes,
      });

      return new TextDecoder().decode(plaintextBytes);
    },
    [account, sui, signPersonalMessage, sealClient],
  );
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
