import { Callout, P, H2, H3, Lead, Code, Step } from '../primitives';

export function QuickStart() {
  return (
    <>
      <Lead>
        Five minutes from "wallet connected" to "first on-chain submission verified".
        Bring a Sui testnet wallet (Slush, Suiet, Phantom) with a few SUI tokens — get them
        from <Code>discord.gg/sui</Code> faucet.
      </Lead>

      <H2>Prerequisites</H2>
      <ul>
        <li>Sui testnet wallet with ≥ 0.1 SUI for gas</li>
        <li>A few testnet WAL tokens (the Walrus token) for storage tip-jar — get from{' '}
          <Code>walrus.site/devnet-faucet</Code></li>
        <li>Modern browser with localStorage (Chrome, Firefox, Edge, Safari)</li>
      </ul>

      <H2>Step-by-step</H2>

      <Step n={1} title="Open the app & connect wallet">
        <P>
          From the landing page, click <b>Open the app</b>. The top-right wallet button opens
          dapp-kit's picker — pick Slush or whatever Sui wallet you use. We never read your
          private key; signing happens entirely inside the wallet extension.
        </P>
      </Step>

      <Step n={2} title="Pick a template (or start blank)">
        <P>
          Builder loads with a paper aesthetic. Use the <b>📚 templates</b> palette on the left
          to pick from 12 built-in templates (NPS, Bug Report, Contact, Job Application, etc.)
          or start with a blank canvas.
        </P>
        <P>
          Each template seeds the title, description, and a sensible field set. You can edit
          everything before publishing.
        </P>
      </Step>

      <Step n={3} title="Tweak the schema">
        <P>
          Drag fields from the palette into the canvas. Click any field to edit its label,
          help text, required flag, and (for sensitive fields) toggle <b>🔒 Seal-encrypt</b>.
        </P>
        <Callout tone="tip">
          Right-click a field for "duplicate" or use the small ⋮ menu to delete. Reorder by
          dragging the field header.
        </Callout>
      </Step>

      <Step n={4} title="Publish on-chain">
        <P>
          Click <b>Publish form</b>. The 3-signature flow runs:
        </P>
        <ol>
          <li><b>Walrus reserve</b> — pay the storage epoch for your schema.json blob</li>
          <li><b>Walrus upload</b> — push the schema bytes (no signature, just HTTP)</li>
          <li><b>Sui Move call</b> — <Code>catat::form::create_form(blob_id, owner)</Code> creates the on-chain Form object</li>
        </ol>
        <P>
          The success modal gives you a shareable <Code>?form=...&respond=1</Code> URL — copy it
          and send to your respondents.
        </P>
      </Step>

      <Step n={5} title="Submit a response (use another wallet)">
        <P>
          Open the share URL in an incognito window with a different wallet. The Runner surface
          loads your schema directly from Walrus, validates inputs with Zod, and on submit
          runs another 3-sig flow to write the submission Quilt.
        </P>
      </Step>

      <Step n={6} title="Watch the Inbox light up">
        <P>
          Back on your owner wallet, open the <b>Inbox</b> tab. The new submission appears
          within ~5 seconds (Sui events). Click any row → jumps to Admin for triage with status /
          priority / notes.
        </P>
      </Step>

      <Step n={7} title="Verify publicly">
        <P>
          Copy any submission's blob_id from the admin row. Paste into the <b>Verify</b>{' '}
          surface — anyone (not just owner) can confirm the blob exists, see its hash, view the
          on-chain event, and check the parent Form object.
        </P>
      </Step>

      <H2>Common gotchas</H2>
      <H3>"Wallet has insufficient gas"</H3>
      <P>
        Sui testnet gas can stall after large surges. Hit the <Code>!faucet</Code> command in
        the Sui Discord every hour.
      </P>

      <H3>"Form published but Inbox is empty"</H3>
      <P>
        Empty forms show in <b>📋 by form</b> with the 📭 icon. Submissions only appear after
        someone actually submits the form — your own preview from Builder is not stored.
      </P>

      <H3>"Decrypt failed on a Sealed field"</H3>
      <P>
        Make sure you connected the same wallet that owns the Form object. Seal access is gated
        by <Code>form.owner == ctx.sender</Code> in the Move package; a different wallet (even
        if it's yours on another browser) will fail the on-chain access check.
      </P>
    </>
  );
}
