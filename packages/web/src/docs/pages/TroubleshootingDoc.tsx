import { Callout, P, H2, H3, Lead, Code } from '../primitives';

export function TroubleshootingDoc() {
  return (
    <>
      <Lead>
        Common issues and how to fix them. If something's not here, file an issue on{' '}
        <a href="https://github.com/PugarHuda/catat/issues" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>{' '}— or submit it via this form (yes, we dogfood).
      </Lead>

      <H2>Publishing</H2>

      <H3>"Object version unavailable" on first signature</H3>
      <P>
        Sui's local gas-coin cache occasionally lags chain state. Catat already calls{' '}
        <Code>waitForTransaction</Code> between signatures to prevent this; if you still see it,
        refresh the page (resets the SDK's coin cache). If your wallet has &lt; 0.05 SUI, top up
        at the faucet first.
      </P>

      <H3>"Insufficient gas" when I have plenty of SUI</H3>
      <P>
        You probably have lots of WAL (used to pay for storage) but minimal SUI (used to pay for
        gas). Sui and WAL are separate tokens. Check both at{' '}
        <a href="https://suiscan.xyz/testnet/account" target="_blank" rel="noopener noreferrer">
          suiscan.xyz
        </a>. Get more SUI at <Code>faucet.sui.io</Code>.
      </P>

      <H3>Publish succeeded but the share link 404s</H3>
      <P>
        Walrus storage nodes need a few seconds to propagate after certify. Catat retries reads with
        backoff (3 attempts, 500 ms initial) — usually self-heals within 5 seconds. If it persists
        past 30 seconds, the upload may have failed silently. Re-publish.
      </P>

      <H2>Inbox / Admin</H2>

      <H3>I published a form but Inbox shows "No forms yet"</H3>
      <P>
        Inbox queries <Code>FormCreated</Code> events filtered by your wallet address. Confirm the
        wallet you connected matches the one that signed the publish (e.g. you didn't switch
        wallets). Also check that you're on the same Sui network (testnet ↔ mainnet have separate
        event logs).
      </P>

      <H3>A submission appears in Inbox but Admin can't load its blob</H3>
      <P>
        The blob's storage epoch may have expired (catat defaults to ~6 months). The Sui event log
        keeps the blob_id forever, but the actual bytes are gone. There's no recovery for expired
        storage — you'd need the responder to resubmit.
      </P>

      <H3>Decrypt button does nothing</H3>
      <P>
        Open browser devtools and check the Network tab. Common causes:
      </P>
      <ul>
        <li>Mysten key servers temporarily down — retry after 30s</li>
        <li>The form was published on a different network than the one you're connected to — switch network to match</li>
        <li>You're not the form's owner — only the owner can decrypt by default</li>
      </ul>

      <H2>Wallet</H2>

      <H3>Wallet auto-disconnects on every page load</H3>
      <P>
        Catat uses <Code>@mysten/dapp-kit</Code>'s default persistence (localStorage). If you're in
        a private/incognito window, storage is wiped on close. Switch to a normal window or grant
        your wallet extension persistence permissions for the catat site.
      </P>

      <H3>"WrongNetwork" error</H3>
      <P>
        The wallet is on Mainnet but catat is running against Testnet (or vice versa). Switch
        network in the wallet's selector — for Slush/Suiet it's a dropdown in the top bar.
      </P>

      <H2>Templates &amp; data</H2>

      <H3>I saved a custom template but it's gone</H3>
      <P>
        localStorage was cleared (browser settings, Clear Site Data, switching to private mode).
        Custom templates are local-only — they don't sync. Workaround: publish the template as a
        real form and re-import on other devices from its share URL.
      </P>

      <H3>Export CSV is missing my Sealed columns</H3>
      <P>
        By design — Sealed columns export as <Code>(sealed)</Code> until you've decrypted them in
        the current session. Decrypt the rows you want, then re-export. The decryption is
        in-memory only; refresh wipes it.
      </P>

      <H2>Getting help</H2>
      <ul>
        <li>GitHub issues — <Code>github.com/PugarHuda/catat</Code></li>
        <li>Walrus Discord — <Code>#sessions</Code> channel for hackathon-related questions</li>
        <li>Sui Discord — <Code>#dev-help</Code> for chain-side issues</li>
      </ul>

      <Callout tone="tip">
        We dogfood. The <b>Walrus Bug Report</b> seed form on testnet IS the form we use to triage
        catat's own issues — meta, but it works.
      </Callout>
    </>
  );
}
