import { useMemo } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { walrus } from '@mysten/walrus';
import walrusWasmUrl from '@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url';

/**
 * Module-level singleton cache: one WalrusClient extension per SuiClient
 * identity. Without this, every hook (Builder, Runner, Inbox, Admin,
 * useFormSchema, useRecentSubmissions, useAdminOverlay, useRealSubmissions)
 * called `sui.$extend(walrus({...}))` independently — Walrus' WASM module
 * is ~360 KB so we'd carry 4–6× redundant heap during heavy surfaces.
 *
 * WeakMap means cached entries are eligible for GC when the SuiClient
 * itself is replaced (e.g. user switches network), so we don't pin the
 * old client + WASM forever.
 */

// Configurable upload-relay host. Default is testnet so the dev experience
// stays zero-config; override via .env (VITE_WALRUS_UPLOAD_RELAY=...) when
// switching networks. Vite inlines import.meta.env at build-time.
const UPLOAD_RELAY_HOST =
  (import.meta.env.VITE_WALRUS_UPLOAD_RELAY as string | undefined)
  ?? 'https://upload-relay.testnet.walrus.space';

// Helper: capture the precise return type of a sample $extend call so the
// cache + return type stay narrow (ClientWithExtensions<{walrus: WalrusClient}>).
// We don't actually instantiate it — `typeof` only walks the type system.
function buildExtended(sui: ReturnType<typeof useSuiClient>) {
  return sui.$extend(walrus({
    wasmUrl: walrusWasmUrl,
    uploadRelay: {
      host: UPLOAD_RELAY_HOST,
      sendTip: { max: 1_000 },
    },
  }));
}

type ExtendedSuiClient = ReturnType<typeof buildExtended>;
const walrusClientCache = new WeakMap<object, ExtendedSuiClient>();

/**
 * Returns a cached WalrusClient-extended SuiClient. Safe to call from any
 * number of hooks — they all share the same underlying WASM instance.
 */
export function useWalrusClient(): ExtendedSuiClient {
  const sui = useSuiClient();

  return useMemo(() => {
    const cached = walrusClientCache.get(sui);
    if (cached) return cached;
    const extended = buildExtended(sui);
    walrusClientCache.set(sui, extended);
    return extended;
  }, [sui]);
}
