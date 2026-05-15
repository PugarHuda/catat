import { Callout, P, H2, Lead, Code, KeyList } from '../primitives';

export function WalrusDoc() {
  return (
    <>
      <Lead>
        Walrus is decentralized blob storage on Sui. Default per-blob upload is uneconomic for small
        objects (a 2 KB submission carries minimum storage overhead). <b>Quilt</b> solves that by
        batching multiple files into one logical blob — ~100× cheaper per submission.
      </Lead>

      <H2>Plain Walrus vs Quilt — why catat uses Quilt for everything</H2>
      <KeyList items={[
        ['One submission with a 2 KB JSON', '~0.5 WAL plain · ~0.005 WAL Quilt'],
        ['JSON + 3 screenshot files', '4 separate blobs / reserves / certifies plain · 1 reserve, 1 certify with Quilt'],
        ['Reading a single file by name', 'N/A on plain blob · .files({ identifiers: [name] }) on Quilt'],
        ['Atomicity', 'Risk of partial state plain · all-or-nothing per Quilt batch'],
      ]} />

      <H2>Blob IDs — how they look, how to share</H2>
      <P>
        Walrus blob_ids are <b>URL-safe base64 of a BLAKE2b hash</b>. Example:
      </P>
      <Code>blob_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789ABCDEFG</Code>
      <P>
        In catat code, blob_ids are stored as strings with the <Code>blob_</Code> prefix. In share
        URLs we use <Code>walrus://&lt;blob_id&gt;</Code>. The <Code>walruscan.com</Code> explorer is
        the standard third-party viewer — every Admin row links there.
      </P>

      <H2>Storage duration</H2>
      <P>
        When you reserve, you pay for <b>N epochs</b> of storage. Each epoch is ~24 hours. Catat
        defaults to <b>53 epochs (~6 months)</b> — a balance between cost and useful submission
        lifetime. Form owners can extend by re-calling reserve before expiry.
      </P>
      <P>
        After expiry, Walrus storage nodes garbage-collect. The blob_id remains a valid reference in
        Sui events forever, but Verify will report "blob not found in Walrus" if you try to fetch
        expired content.
      </P>

      <H2>Read patterns we use</H2>
      <pre><code>{`// Just the submission JSON, no attachments (Admin table — cheap):
const { f_title, f_severity } = await walrus
  .getBlob({ blobId })
  .files({ identifiers: ['submission.json'] })
  .json();

// All file identifiers (when user clicks "view attachments"):
const manifest = await walrus.getBlob({ blobId }).manifest();
// manifest.files = [{ id: 'submission.json' }, { id: 'screenshot-1.png' }, ...]

// One specific attachment (lazy, on click):
const png = await walrus
  .getBlob({ blobId })
  .files({ identifiers: ['screenshot-1.png'] })
  .bytes();`}</code></pre>

      <H2>Network choice</H2>
      <P>
        Catat defaults to <b>Walrus Testnet</b> for the hackathon. Mainnet swap is a config change in{' '}
        <Code>packages/web/src/lib/walrus.ts</Code> (single constant). Testnet WAL is free from the
        faucet; real WAL is needed on mainnet.
      </P>

      <Callout tone="tip">
        Walrus is async-eventual. After certify, the blob is "available" but storage nodes need a few
        seconds to fully propagate. If you immediately try to read a freshly-uploaded blob you might
        get a 404 from some gateways. Catat retries reads with exponential backoff (3 attempts, 500ms initial).
      </Callout>
    </>
  );
}
