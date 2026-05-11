/**
 * On-chain catat::form package + the seed Form object created at publish.
 * Replace via .github/workflows/publish-move.yml run summary.
 *
 * Network: Sui testnet
 */

export const CATAT_PACKAGE_ID =
  '0xaf0df999a89d1c50ea692a71723b1ff79bd961a5cdafd9b153a296349d3489b9';

/** The Form object backing the "Walrus Bug Report" template in the demo. */
export const BUG_REPORT_FORM_ID =
  '0x9f07bece204759981bb05ee93101b0bd09859d75aeb98253a7bff640032af028';

/** Sui's well-known Clock object. Required by submit() for timestamp_ms. */
export const SUI_CLOCK_OBJECT_ID = '0x6';

/**
 * Official Walrus testnet WAL coin + SUI->WAL exchange.
 * The stakely.io faucet hands out WAL from a different package
 * (0x8190b041…) which the Walrus client refuses to spend — must use
 * this exchange to swap real SUI gas into spendable WAL.
 */
export const WAL_COIN_TYPE =
  '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL';
export const WAL_EXCHANGE_PACKAGE =
  '0x82593828ed3fcb8c6a235eac9abd0adbe9c5f9bbffa9b1e7a45cdd884481ef9f';
export const WAL_EXCHANGE_OBJECT =
  '0xf4d164ea2def5fe07dc573992a029e010dba09b1a8dcbc44c5c2e79567f39073';

/** Default swap amount for the in-app "Get WAL" button (0.5 SUI -> ~0.5 WAL). */
export const DEFAULT_WAL_SWAP_MIST = 500_000_000n;

/**
 * Mysten-allowlisted Seal key server object IDs on Sui testnet.
 * Verified via spike (see spike/src/05-seal-spike.ts) — `getAllowlistedKeyServers`
 * helper is not exported in @mysten/seal v1.1.3+.
 */
export const SEAL_KEY_SERVERS_TESTNET = [
  '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
  '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
] as const;

/** Suiscan link for any object/tx — handy for explorer references. */
export const suiscanObject = (id: string) => `https://suiscan.xyz/testnet/object/${id}`;
export const suiscanTx = (digest: string) => `https://suiscan.xyz/testnet/tx/${digest}`;
export const walruscanBlob = (blobId: string) =>
  `https://walruscan.com/testnet/blob/${blobId.replace(/^blob_/, '')}`;

/**
 * Build the Seal IBE identity for a sealed field.
 *
 * Layout: 32-byte form object id || ":" || utf8 field_id
 * Returned as a hex string ("0x…") because the @mysten/seal SDK accepts
 * the `id` arg as hex and decodes it to bytes internally.
 *
 * The 32-byte prefix is critical — the on-chain `seal_approve_owner`
 * function rejects any id whose bytes don't begin with this form's UID,
 * preventing the form owner from re-using their signature to decrypt
 * blobs that belong to a different form they happen to own.
 */
export function sealIdentity(formId: string, fieldId: string): string {
  const formBytes = hexToBytes(formId);
  const tail = new TextEncoder().encode(`:${fieldId}`);
  const out = new Uint8Array(formBytes.length + tail.length);
  out.set(formBytes, 0);
  out.set(tail, formBytes.length);
  return bytesToHex(out);
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0) throw new Error(`invalid hex: ${hex}`);
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  let s = '0x';
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i]!.toString(16).padStart(2, '0');
  }
  return s;
}
