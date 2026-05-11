/**
 * On-chain catat::form package + the seed Form object created at publish.
 * Replace via .github/workflows/publish-move.yml run summary.
 *
 * Network: Sui testnet
 */

export const CATAT_PACKAGE_ID =
  '0xe270518be3f37a2a9c65007af2ace7967ee087cf12c950de16b2987606269441';

/** The Form object backing the "Walrus Bug Report" template in the demo. */
export const BUG_REPORT_FORM_ID =
  '0xe88fda404fe15a122c57ed220e668ec21a3f4119f2c38c65e490fbccd1e3a34e';

/** Sui's well-known Clock object. Required by submit() for timestamp_ms. */
export const SUI_CLOCK_OBJECT_ID = '0x6';

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
 * Pattern: hex-formId concatenated with utf8-fieldId. Decrypt requires a
 * future Move policy `seal_approve_*(id, form, ctx)` that verifies the
 * caller is the form owner before key servers release shares.
 */
export function sealIdentity(formId: string, fieldId: string): string {
  return `${formId}::${fieldId}`;
}
