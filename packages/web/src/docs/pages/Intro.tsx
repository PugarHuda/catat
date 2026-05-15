import { Callout, P, H2, H3, Lead, KeyList, Code } from '../primitives';

export function Intro() {
  return (
    <>
      <Lead>
        <b>catat</b> is a Walrus-native form & feedback platform. Build forms in seconds,
        host them on Walrus Sites, store submissions in Walrus Quilts, and encrypt sensitive
        fields with Seal — no backend, no SaaS.
      </Lead>

      <Callout tone="note">
        catat is the Indonesian word for "to note / to jot down". Pronounced{' '}
        <i>cha-thaht</i>.
      </Callout>

      <H2>The 30-second pitch</H2>
      <P>
        Web2 form tools (Typeform, Tally, Google Forms) charge per submission, lock data in
        their database, and disappear when the company pivots. Web3 form tools (Formo, Daylight)
        focus on token gating but still rely on centralized backends for storage.
      </P>
      <P>
        catat keeps every part of the form lifecycle on decentralized infra:
      </P>
      <KeyList items={[
        ['Schema',     'JSON blob stored on Walrus, referenced from a Sui Move object'],
        ['Submissions','Walrus Quilt — submission.json + media files in a single batched blob'],
        ['Encryption', 'Seal IBE 2-of-3 threshold — only the form owner can decrypt'],
        ['Hosting',    'Walrus Sites — the dashboard you are reading runs on Walrus too'],
        ['Identity',   'Sui wallet — no email, no password, no account creation'],
      ]} />

      <H2>Who is this for?</H2>
      <H3>Bug-bounty teams</H3>
      <P>
        Reports must be tamper-evident and auditable. Walrus' content-addressed storage means
        every report blob has a verifiable hash. Sensitive PoC details are sealed so only your
        triage wallet can read them.
      </P>
      <H3>DAO operators & community managers</H3>
      <P>
        Run NPS surveys, governance proposals, grant applications. Submissions are filtered by
        wallet address (token gating coming in v2) without a SaaS contract.
      </P>
      <H3>Open-source maintainers</H3>
      <P>
        Replace the GitHub issues vs. Discord vs. Discourse mess with a single form per
        intake type. Free-tier Walrus storage is generous enough for issue volume.
      </P>

      <H2>What you can ship right now</H2>
      <P>
        This MVP supports:
      </P>
      <ul>
        <li>12 pre-built templates (NPS, contact, bug report, hackathon, application, newsletter, feature request, job, etc.)</li>
        <li>Custom drag-and-drop builder with 14 field types</li>
        <li>Encrypted (Sealed) fields — set per-field with a single click</li>
        <li>File attachments (images, PDFs) batched into the same Quilt as the submission</li>
        <li>Real-time on-chain inbox + admin triage with status / priority / notes</li>
        <li>Public verification surface — anyone can prove a submission was real</li>
        <li>One-click CSV export from the admin table</li>
      </ul>

      <Callout tone="tip">
        <b>Demo flow for evaluators:</b> open <Code>Quick start</Code> next, publish a form,
        submit a response from another wallet, then open <Code>Inbox & Admin</Code> to see the
        real-time event feed.
      </Callout>
    </>
  );
}
