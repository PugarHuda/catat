import { Callout, P, H2, H3, Lead, Code, KeyList } from '../primitives';

export function VerifyDoc() {
  return (
    <>
      <Lead>
        Verify is a no-auth, no-wallet, anyone-can-use surface. Paste any catat submission's{' '}
        <Code>blob_id</Code> and catat re-fetches it from Walrus, cross-references the Sui event log,
        and shows you "yes this exists, here's the schema it answered, here's when."
      </Lead>

      <H2>Why this surface exists</H2>
      <P>
        Imagine you submitted a bug report to a Walrus-team form. Months later you want to prove "I
        submitted this on May 10th, and my repro steps were X." With centralized form tools, the
        operator could deny or alter your submission silently. With catat:
      </P>
      <ol>
        <li>The blob_id is a BLAKE2b hash — content-addressed; bytes can't change without changing the ID</li>
        <li>Walrus stores N redundant copies across storage nodes for the epoch duration paid</li>
        <li>The Sui <Code>SubmissionAdded</Code> event log is immutable — anyone can re-query</li>
      </ol>
      <P>
        So <b>Verify is a friendly viewer over public infra</b>. It computes nothing trust-requiring —
        literally a Walrus GET + Sui event query, displayed nicely.
      </P>

      <H2>What you see when you verify</H2>
      <KeyList items={[
        ['✓ Blob found on Walrus', 'Re-confirmed BLAKE2b hash, storage epoch end date, replication count'],
        ['✓ Sui SubmissionAdded indexed', 'Sui checkpoint number, transaction digest, timestamp'],
        ['✓ Schema linked', 'Fetches the form schema, shows field labels + answers side by side'],
        ['Attachments', 'Named files in the Quilt, click-to-download from walruscan'],
      ]} />

      <H2>Use cases</H2>
      <H3>Audit a contest</H3>
      <P>
        Show judges that submission X existed on-chain before deadline Y. Sui checkpoint timestamps
        are stronger than email timestamps — operators can't backdate.
      </P>

      <H3>Spot-check your own data</H3>
      <P>
        As a form owner, paste a blob_id from Admin into Verify — confirms exactly what's stored.
        Useful sanity check after a schema migration.
      </P>

      <H3>Public dispute resolution</H3>
      <P>
        Two parties disagree on what was submitted. The blob_id is the source of truth. Both can
        verify independently, no third-party arbiter.
      </P>

      <H2>What Verify can NOT do</H2>
      <ul>
        <li>Decrypt Sealed fields if you're not the form owner (that's the entire point of Seal)</li>
        <li>Prove who *physically* typed the submission — only that this wallet signed the submit tx</li>
        <li>Recover blobs whose storage epoch has expired (you can pay to extend, but expired = gone)</li>
      </ul>

      <Callout tone="tip">
        Submit a test form, copy the blob_id from the success screen, paste into Verify. The whole
        loop is under 30 seconds and is the single best moment in catat's demo.
      </Callout>
    </>
  );
}
