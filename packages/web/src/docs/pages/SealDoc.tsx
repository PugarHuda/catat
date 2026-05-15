import { Callout, P, H2, Lead, Code, KeyList } from '../primitives';

export function SealDoc() {
  return (
    <>
      <Lead>
        Seal is Mysten's Identity-Based Encryption (IBE) with on-chain access policies. Catat uses it
        so any field marked <b>🔒 Sealed</b> in the Builder is encrypted before it ever leaves the
        respondent's browser, and only the form owner can decrypt — verified by an on-chain Move call.
      </Lead>

      <H2>Threat model — what Seal protects against</H2>
      <ul>
        <li><b>Walrus storage node operators</b> reading your data — they only see ciphertext</li>
        <li><b>Random people fetching your blob_id</b> — same, ciphertext</li>
        <li><b>One compromised Mysten key server</b> — 2-of-3 threshold means 1 bad server isn't enough</li>
      </ul>
      <P>What Seal does <b>not</b> protect against:</P>
      <ul>
        <li>The submitter's browser being compromised before encryption</li>
        <li>The form owner's wallet being compromised — they're the legitimate decryptor</li>
        <li>2 of 3 Mysten key servers colluding (this is the trust assumption)</li>
      </ul>

      <H2>How it works in catat</H2>
      <ol>
        <li>Form schema declares: <Code>{`f_contact_email { type: 'email', sealed: true }`}</Code></li>
        <li>At submit-time the Runner calls <Code>SealClient.encrypt(bytes, policy = formId, threshold = 2)</Code></li>
        <li>The submission JSON stores the base64 ciphertext, NOT plaintext</li>
        <li>Anyone fetching the blob sees: <Code>"U2VhbDpFbmNyeXB0ZWRD..."</Code> (gibberish)</li>
        <li>Form owner clicks Decrypt → Mysten key servers run <Code>seal_approve_owner</Code> against the chain → release key shares → browser combines → plaintext</li>
      </ol>

      <H2>The access policy is on-chain</H2>
      <P>
        The Move function <Code>seal_approve_owner</Code> lives in <Code>catat::form</Code>. When a
        key server asks "should I release a key share for this requester?", it simulates the call —
        succeeds only if the requester is the form's owner address.
      </P>
      <Callout tone="note">
        This means access control is itself an on-chain rule. To grant a teammate decrypt access today,
        you'd transfer ownership (full transfer). A future <Code>seal_approve_team(form, addr, ctx)</Code>
        could support multi-decryptor without ownership transfer. Listed in roadmap.
      </Callout>

      <H2>Performance characteristics</H2>
      <KeyList items={[
        ['Encrypt (per field, in Runner)', '~80ms — one round-trip to fetch the public key set, cached after first field'],
        ['Decrypt first field (in Admin)', '~250ms — session key creation + key server fetch'],
        ['Decrypt subsequent fields (same session)', '~40ms — session key reused'],
        ['Ciphertext overhead', '+180 bytes per field (constant, doesn\'t scale with plaintext size)'],
      ]} />

      <Callout tone="warn">
        Don't seal every field. Sealed fields are unsearchable, unsortable in Admin until decrypted.
        Seal only personally-identifying info (email, name, phone) and free-text that may contain
        PII. Keep status/severity/rating as plaintext so charts and filters work without per-row
        decrypt round-trips.
      </Callout>
    </>
  );
}
