import { Callout, P, H2, H3, Lead, Code, KeyList } from '../primitives';

export function Architecture() {
  return (
    <>
      <Lead>
        catat is a static SPA hosted on Walrus Sites, talking to two on-chain layers (Sui Move
        + Walrus blobs) and one off-chain key service (Seal). No backend, no database, no
        server-side code.
      </Lead>

      <H2>Three-layer model</H2>
      <KeyList items={[
        ['Layer 1 — Compute',  'Static SPA hosted on Walrus Sites. Vite + React + TS, no SSR'],
        ['Layer 2 — Identity', 'Sui Move package catat::form holds Form objects + emits events'],
        ['Layer 3 — Storage',  'Walrus content-addressed blobs (schema, submissions, attachments)'],
        ['Cross-cutting',      'Seal IBE 2-of-3 threshold encryption for private fields'],
      ]} />

      <H2>Why this split?</H2>
      <P>
        Each layer has a single responsibility, which makes the system auditable:
      </P>
      <ul>
        <li><b>Sui Move</b> is fast and cheap for state transitions (form created, submission added) but expensive for blob data — so it only stores IDs and pointers</li>
        <li><b>Walrus</b> is content-addressed and ~100× cheaper per byte for blob data, but doesn't know about ownership/permissions — so it doesn't gate access</li>
        <li><b>Seal</b> is a key-management network — it can decrypt for you only if a Move call says you're allowed</li>
      </ul>

      <H2>Data model</H2>
      <H3>Sui Move (catat::form)</H3>
      <pre><code>{`module catat::form {
    struct Form has key {
        id: UID,
        owner: address,           // the publisher wallet
        title: String,
        schema_blob_id: String,   // pointer to Walrus blob
        submissions: u64,         // counter
        accept_submissions: bool, // owner can pause
    }

    struct FormCreated has copy, drop { form_id, owner, schema_blob_id }
    struct SubmissionAdded has copy, drop { form_id, submitter, blob_id, submitted_at_ms }
    struct SchemaUpdated has copy, drop { form_id, schema_blob_id }
}`}</code></pre>

      <H3>Walrus blobs</H3>
      <P>
        Two blob shapes:
      </P>
      <ul>
        <li>
          <b>Schema blob</b> — single JSON file matching the <Code>FormSchema</Code> Zod type.
          One blob per form (or per version after <Code>update_schema</Code>).
        </li>
        <li>
          <b>Submission Quilt</b> — a batched blob containing <Code>submission.json</Code> +
          any uploaded files (named with their original filenames). Identified by{' '}
          <Code>identifiers: ['submission.json']</Code> when reading.
        </li>
      </ul>

      <H2>End-to-end submit flow</H2>
      <P>
        Walking the submit path top-to-bottom:
      </P>
      <ol>
        <li>Respondent opens <Code>walrus://catat.wal.app?form=0x...&respond=1</Code></li>
        <li>SPA reads <Code>form.schema_blob_id</Code> from Sui RPC</li>
        <li>SPA fetches schema bytes from Walrus aggregator HTTP endpoint</li>
        <li>SPA validates schema with Zod, renders form via <Code>react-hook-form</Code></li>
        <li>User fills fields; Sealed fields are encrypted client-side before any submit</li>
        <li>On submit, SPA builds a Quilt: <Code>submission.json</Code> + attachments</li>
        <li>3-sig: Walrus reserve → upload → Sui <Code>submit(form, blob_id)</Code> Move call</li>
        <li>Move emits <Code>SubmissionAdded</Code> event with submitter address + blob_id</li>
        <li>Owner's Inbox picks the event up via Sui RPC <Code>queryEvents</Code> polling</li>
      </ol>

      <Callout tone="note">
        Sui event queries are eventually consistent (~2–5s after tx finality). The "30s
        refresh" cadence on Inbox is generous; in practice events show up in 5–10s.
      </Callout>

      <H2>Cost model (testnet → mainnet)</H2>
      <P>
        On Sui mainnet (estimated at current prices):
      </P>
      <ul>
        <li><b>Publish form</b>: ~0.005 SUI gas + 1 epoch of Walrus storage tip for ~2 KB schema (~0.0001 WAL)</li>
        <li><b>Submit</b>: ~0.005 SUI gas + 1 epoch tip for ~5–50 KB Quilt (~0.001 WAL with attachments)</li>
        <li><b>Update schema</b>: same as publish, but reuses the Form object — submissions history intact</li>
      </ul>
      <P>
        Compared to Typeform's $25/mo plan, catat is essentially free at any submission volume
        under ~10,000/month, and the user pays gas (not the form owner) — so popular forms
        don't scale costs to the publisher.
      </P>

      <H2>What we did NOT use</H2>
      <ul>
        <li><b>zkLogin</b> — adds OAuth friction; we want wallet-native UX</li>
        <li><b>Custom indexer</b> — Sui RPC's <Code>queryEvents</Code> is enough for hackathon volumes</li>
        <li><b>SSR / Next.js</b> — static SPA fits Walrus Sites perfectly; no advantage to SSR for an owner-side dashboard</li>
        <li><b>Backend DB</b> — would defeat the entire "fully on-chain" pitch</li>
      </ul>
    </>
  );
}
