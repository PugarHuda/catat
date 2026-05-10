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

/** Suiscan link for any object/tx — handy for explorer references. */
export const suiscanObject = (id: string) => `https://suiscan.xyz/testnet/object/${id}`;
export const suiscanTx = (digest: string) => `https://suiscan.xyz/testnet/tx/${digest}`;
export const walruscanBlob = (blobId: string) =>
  `https://walruscan.com/testnet/blob/${blobId.replace(/^blob_/, '')}`;
