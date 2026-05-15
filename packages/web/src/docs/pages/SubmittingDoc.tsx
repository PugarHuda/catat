import { Callout, P, H2, H3, Lead, Code, KeyList } from '../primitives';

export function SubmittingDoc() {
  return (
    <>
      <Lead>
        From a respondent's perspective: open the share URL, fill in answers, sign 3 transactions,
        done. The Runner surface validates with Zod, encrypts Sealed fields client-side, and writes
        the submission as a Walrus Quilt — submission JSON + any uploaded files in a single batched blob.
      </Lead>

      <H2>The respondent flow</H2>
      <P>
        A share URL looks like <Code>walrus://catat.wal.app?form=0x...&respond=1</Code>. Opening it
        loads the Runner, which:
      </P>
      <ol>
        <li>Reads the Form object from Sui RPC to get <Code>schema_blob_id</Code></li>
        <li>Fetches the schema from Walrus + validates with Zod (rejects malformed schemas)</li>
        <li>Renders fields via <Code>react-hook-form</Code> with inline error messages</li>
        <li>On submit: encrypts Sealed fields, builds the Quilt, runs the 3-sig flow</li>
      </ol>

      <H2>Anonymous vs wallet-attached submissions</H2>
      <KeyList items={[
        ['Wallet-attached', 'Submitter address = your wallet. Recorded on-chain via SubmissionAdded event. Good for accountability (applications, hiring).'],
        ['Anonymous', 'Catat generates an ephemeral session keypair, pays gas from a faucet-funded relay (planned). Submission is pseudonymous. Good for sensitive feedback.'],
      ]} />

      <Callout tone="note">
        Anonymous mode is technically demo-stage right now — the relay is not deployed, so all
        submissions in v1 use wallet-attached mode. The Move package supports both paths.
      </Callout>

      <H2>Attachments — where do files go?</H2>
      <P>
        Each uploaded file becomes a named entry in the same Quilt batch as the submission JSON:
      </P>
      <pre><code>{`Quilt batch (one blob_id) {
  submission.json    → { f_title: "...", f_severity: "high", ... }
  screenshot-1.png   → binary bytes
  console-log.txt    → text bytes
}`}</code></pre>
      <P>
        Admin reads only <Code>submission.json</Code> for the table view (cheap), then lazy-fetches
        media on demand when you click a row. Files retain their original names — no rewriting.
      </P>

      <H2>What if a signature fails mid-flow?</H2>
      <ul>
        <li>
          <b>Reject sig #1 (Walrus reserve)</b> — nothing happens on-chain, your form values stay
          in the inputs. Re-click submit to retry.
        </li>
        <li>
          <b>Reject sig #2 (certify)</b> — Walrus blob is uploaded but uncertified. Storage nodes
          garbage-collect after ~10 minutes. No state pollution.
        </li>
        <li>
          <b>Reject sig #3 (submit Move call)</b> — blob is certified but never linked to the form.
          Effectively orphaned (you paid for storage you don't use). Inbox doesn't see this.
        </li>
      </ul>

      <H3>Success state</H3>
      <P>
        After all 3 sigs confirm, the respondent sees a confirmation card with the submission's
        <Code>blob_id</Code> + a "Verify your submission" link → opens Verify pre-filled with that
        blob_id. The form owner's Inbox lights up within ~5–10s (Sui event polling cadence).
      </P>

      <Callout tone="tip">
        Worth showing in your demo: submitter signs 3 times → owner's Inbox lights up live → owner
        clicks Decrypt on a Sealed field → ciphertext reveals the email. End-to-end loop in under
        60 seconds.
      </Callout>
    </>
  );
}
