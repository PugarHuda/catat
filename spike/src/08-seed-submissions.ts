/**
 * Seed N varied test submissions to a given Form on-chain. Dispatches
 * to a payload-generator function based on TEMPLATE_KEY env so each
 * form gets shape-appropriate seed data (NPS scores for NPS, project
 * pitches for Hackathon, etc.). Triggered by the GH workflow
 * `.github/workflows/seed-submissions.yml`.
 *
 * Env:
 *   SUI_PRIVATE_KEY  bech32 ed25519 key (from secrets)
 *   FORM_ID          Sui Form object id (0x...)
 *   COUNT            number of submissions (defaults 5, max 10)
 *   TEMPLATE_KEY     bug_report | nps | contact | newsletter |
 *                    hackathon | feature | job   (default: bug_report)
 */
import 'dotenv/config';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { Transaction } from '@mysten/sui/transactions';
import { walrus, WalrusFile } from '@mysten/walrus';

const CATAT_PACKAGE_ID =
  '0xaf0df999a89d1c50ea692a71723b1ff79bd961a5cdafd9b153a296349d3489b9';
const SUI_CLOCK_OBJECT_ID = '0x6';

const PRIVATE_KEY = req('SUI_PRIVATE_KEY');
const FORM_ID = req('FORM_ID');
const COUNT = Math.max(1, Math.min(10, parseInt(process.env.COUNT ?? '5', 10) || 5));
const TEMPLATE_KEY = (process.env.TEMPLATE_KEY ?? 'bug_report').toLowerCase();

if (!/^0x[a-fA-F0-9]{64}$/.test(FORM_ID)) {
  console.error('FORM_ID must be a 0x-prefixed 32-byte hex string');
  process.exit(1);
}

const kp = Ed25519Keypair.fromSecretKey(PRIVATE_KEY);
const address = kp.toSuiAddress();

const sui = new SuiJsonRpcClient({
  url: process.env.SUI_FULLNODE ?? getJsonRpcFullnodeUrl('testnet'),
  network: 'testnet',
}).$extend(
  walrus({
    uploadRelay: {
      host: 'https://upload-relay.testnet.walrus.space',
      sendTip: { max: 1_000 },
    },
  }),
);

console.log('[seed] address     :', address);
console.log('[seed] form_id     :', FORM_ID);
console.log('[seed] template    :', TEMPLATE_KEY);
console.log('[seed] count       :', COUNT);

// ============================================================
// SAMPLE GENERATORS PER TEMPLATE
// Each returns an object mapped to its template's f_* field ids.
// Sealed fields (encrypted: true in schema) are seeded as null —
// Seal SDK encryption requires the browser threshold flow.
// ============================================================

type SampleFn = () => Record<string, unknown>;

const bugReportSamples: SampleFn[] = [
  () => ({
    f_title: 'Cannot upload blob > 100MB to testnet',
    f_severity: 'High',
    f_description: 'When uploading a video file via writeBlob, the request hangs indefinitely after ~95MB. No error in console.',
    f_screenshot: null, f_repro_url: 'https://github.com/example/walrus-large-blob-repro', f_email: null, f_rating: 5,
  }),
  () => ({
    f_title: 'Walrus Sites deploy fails with site-builder 1.2.0',
    f_severity: 'Critical',
    f_description: 'site-builder deploy hits "Cannot read property of undefined". Worked fine on 1.1.0. Clean install + cache clear tried.',
    f_screenshot: null, f_repro_url: 'https://github.com/example/site-builder-1.2-bug', f_email: null, f_rating: 5,
  }),
  () => ({
    f_title: 'Quilt write fails with single file',
    f_severity: 'High',
    f_description: 'When passing array with single WalrusFile to writeFiles, get error "Quilt requires minimum 2 files".',
    f_screenshot: null, f_repro_url: null, f_email: null, f_rating: 4,
  }),
  () => ({
    f_title: 'Seal SDK: 1-of-1 threshold not supported',
    f_severity: 'Medium',
    f_description: 'Documentation mentions threshold encryption, but SDK throws when threshold=1.',
    f_screenshot: null, f_repro_url: null, f_email: null, f_rating: 4,
  }),
  () => ({
    f_title: 'Connect wallet broken on Safari 18.1 mobile',
    f_severity: 'High',
    f_description: 'dapp-kit connect modal does not appear on iOS Safari 18.1. Works on Chrome and Firefox.',
    f_screenshot: null, f_repro_url: 'https://github.com/example/dappkit-safari-bug', f_email: null, f_rating: 4,
  }),
  () => ({
    f_title: 'Typo in error message: "blod_id" should be "blob_id"',
    f_severity: 'Low',
    f_description: 'In the SDK error toast, "Invalid blod_id format" — should be blob_id.',
    f_screenshot: null, f_repro_url: null, f_email: null, f_rating: 2,
  }),
  () => ({
    f_title: 'Suggestion: bulk submission triage view',
    f_severity: 'Low',
    f_description: 'Triage multiple submissions at once with checkbox + bulk action menu.',
    f_screenshot: null, f_repro_url: null, f_email: null, f_rating: 3,
  }),
];

const npsSamples: SampleFn[] = [
  () => ({
    f_score: 9, f_reason: 'Incredibly smooth onboarding — wallet connect + first publish under 2 minutes. The on-chain proof story sells itself.',
    f_persona: 'Builder / dev', f_email: null,
  }),
  () => ({
    f_score: 10, f_reason: 'Game-changer for community feedback. Walrus + Seal stack is the future of forms. Already replaced our Tally subscription.',
    f_persona: 'Builder / dev', f_email: null,
  }),
  () => ({
    f_score: 8, f_reason: 'Love the paper aesthetic — actually feels human. Minor nit: 3 wallet sigs per publish is a lot, but I get the security trade-off.',
    f_persona: 'Researcher', f_email: null,
  }),
  () => ({
    f_score: 7, f_reason: 'Good demo. Need better docs around Seal threshold tuning before I migrate sensitive flows.',
    f_persona: 'Researcher', f_email: null,
  }),
  () => ({
    f_score: 6, f_reason: 'Promising but worried about Walrus epoch costs at scale. Need pricing calculator.',
    f_persona: 'Investor', f_email: null,
  }),
  () => ({
    f_score: 9, f_reason: 'The Verify page alone is worth it — try recomputing a Google Form submission, you cannot.',
    f_persona: 'Curious onlooker', f_email: null,
  }),
  () => ({
    f_score: 4, f_reason: 'Steep learning curve coming from Web2. Mental model takes time to click.',
    f_persona: 'Curious onlooker', f_email: null,
  }),
];

const contactSamples: SampleFn[] = [
  () => ({
    f_name: 'Lina Wijaya', f_topic: 'Sales',
    f_message: 'We run a 200-person DAO and need a sealed-feedback form for governance proposals. Can we get a custom demo?',
    f_email: null,
  }),
  () => ({
    f_name: 'Marco Reyes', f_topic: 'Partnership',
    f_message: 'Walrus Foundation here — want to feature catat in the Sessions showcase. Reach out.',
    f_email: null,
  }),
  () => ({
    f_name: 'Anonymous', f_topic: 'Support',
    f_message: 'Tried publishing but got "no WAL token". Followed the swap button in wallet popup — worked! Just noting in case docs need an update.',
    f_email: null,
  }),
  () => ({
    f_name: 'Hiroshi Tanaka', f_topic: 'Other',
    f_message: 'Is there a Japanese translation in the roadmap? Happy to contribute.',
    f_email: null,
  }),
  () => ({
    f_name: 'Priya Sharma', f_topic: 'Sales',
    f_message: 'Education non-profit — need GDPR-compliant student feedback forms. Sealed email field looks promising. Pricing?',
    f_email: null,
  }),
];

const newsletterSamples: SampleFn[] = [
  () => ({ f_email: null, f_topics: ['Product changelog', 'Engineering deep-dives'], f_frequency: 'Weekly' }),
  () => ({ f_email: null, f_topics: ['Community events'], f_frequency: 'Monthly' }),
  () => ({ f_email: null, f_topics: ['Product changelog', 'Hiring announcements', 'Engineering deep-dives'], f_frequency: 'Bi-weekly' }),
  () => ({ f_email: null, f_topics: ['Hiring announcements'], f_frequency: 'Monthly' }),
  () => ({ f_email: null, f_topics: ['Product changelog'], f_frequency: 'Weekly' }),
  () => ({ f_email: null, f_topics: ['Engineering deep-dives', 'Community events'], f_frequency: 'Bi-weekly' }),
];

const hackathonSamples: SampleFn[] = [
  () => ({
    f_project_name: 'Riptide', f_track: 'DeFi',
    f_one_liner: 'Concentrated liquidity on Sui with fee-curve optimization.',
    f_description: 'Built a UNI-v3-style AMM with custom fee tiers that adapt to vol. Demo handles 10k swaps/sec on testnet.',
    f_demo_url: 'https://riptide-demo.vercel.app',
    f_video: null, f_team_wallet: null,
  }),
  () => ({
    f_project_name: 'WalrusFS', f_track: 'Infra / Tooling',
    f_one_liner: 'POSIX-compatible filesystem layer over Walrus blobs.',
    f_description: 'Mount Walrus as a network drive on macOS/Linux. fuse adapter + caching layer. Read latency under 100ms for cached blobs.',
    f_demo_url: 'https://github.com/example/walrusfs',
    f_video: null, f_team_wallet: null,
  }),
  () => ({
    f_project_name: 'OceanChat', f_track: 'Consumer / Social',
    f_one_liner: 'Sealed group chat with on-chain receipt history.',
    f_description: 'Messages encrypted with Seal, stored as Walrus blobs, message order proven by Sui Move events. End-to-end open-source client.',
    f_demo_url: 'https://oceanchat.app',
    f_video: null, f_team_wallet: null,
  }),
  () => ({
    f_project_name: 'TideMind', f_track: 'AI x Crypto',
    f_one_liner: 'On-chain RAG agent with Walrus-backed memory.',
    f_description: 'LLM agent that reads/writes Walrus for long-term memory. Sui events log all tool calls for auditability.',
    f_demo_url: 'https://tidemind.ai',
    f_video: null, f_team_wallet: null,
  }),
  () => ({
    f_project_name: 'SealVote', f_track: 'Other',
    f_one_liner: 'Anonymous on-chain voting with Seal threshold reveal.',
    f_description: 'Ballots encrypted under Seal during voting; reveal phase decrypts only after quorum. Sui events provide ordering + receipts.',
    f_demo_url: 'https://sealvote.xyz',
    f_video: null, f_team_wallet: null,
  }),
];

const featureSamples: SampleFn[] = [
  () => ({
    f_title: 'Native CSV import for bulk form duplication',
    f_priority: 'Would help a lot',
    f_use_case: 'I have 50 similar feedback surveys for different teams. Want to upload a CSV with template variables + auto-generate 50 forms.',
    f_screenshots: null, f_voter: '0x873becac16795c465d3d584cf0ce2fb16bb241905363c86d12d3f7b29343bea1',
  }),
  () => ({
    f_title: 'Embeddable form widget (iframe + JS snippet)',
    f_priority: 'Critical to our workflow',
    f_use_case: 'Want to embed catat forms directly on our marketing landing pages without redirecting users to catat-walrus.vercel.app.',
    f_screenshots: null, f_voter: null,
  }),
  () => ({
    f_title: 'Webhook on new submission',
    f_priority: 'Critical to our workflow',
    f_use_case: 'Trigger Zapier/Make/n8n when a new submission lands. Currently I poll the Sui RPC every 30s which is brittle.',
    f_screenshots: null, f_voter: null,
  }),
  () => ({
    f_title: 'Multi-language support for form runner',
    f_priority: 'Would help a lot',
    f_use_case: 'Our community is mostly Indonesian. Form labels render fine but UI chrome (Submit button, error messages) are English only.',
    f_screenshots: null, f_voter: null,
  }),
  () => ({
    f_title: 'Dark mode',
    f_priority: 'Nice to have',
    f_use_case: 'Paper aesthetic is beautiful but eyes need dark mode for late-night triage sessions.',
    f_screenshots: null, f_voter: null,
  }),
];

const jobSamples: SampleFn[] = [
  () => ({
    f_full_name: 'Aisha Putri', f_role: 'Senior Engineer',
    f_portfolio: 'https://github.com/aishaputri',
    f_pitch: '8 years backend, last 3 in crypto. Built indexers for Aptos and now Sui. Want to work on Walrus storage layer.',
    f_resume: null, f_email: null, f_wallet: null,
  }),
  () => ({
    f_full_name: 'Daniel Chen', f_role: 'Designer',
    f_portfolio: 'https://danielchen.design',
    f_pitch: 'Product designer with Web3 chops. Want to make on-chain feel as intuitive as Web2. Loved the catat paper aesthetic.',
    f_resume: null, f_email: null, f_wallet: null,
  }),
  () => ({
    f_full_name: 'Maya Wijaya', f_role: 'Mid Engineer',
    f_portfolio: 'https://github.com/mayawijaya',
    f_pitch: 'Rust + TypeScript. Looking for Move + frontend role. Strongest at protocol UX (transaction summaries, gas estimates).',
    f_resume: null, f_email: null, f_wallet: null,
  }),
  () => ({
    f_full_name: 'Kenji Sato', f_role: 'PM',
    f_portfolio: 'https://linkedin.com/in/kenjisato',
    f_pitch: 'Was a PM at Google for 5 years, dropped to start a crypto-native PM career. Strong on user research + dev relations.',
    f_resume: null, f_email: null, f_wallet: null,
  }),
];

const SAMPLE_MAP: Record<string, SampleFn[]> = {
  bug_report: bugReportSamples,
  nps: npsSamples,
  contact: contactSamples,
  newsletter: newsletterSamples,
  hackathon: hackathonSamples,
  feature: featureSamples,
  job: jobSamples,
};

const samples = SAMPLE_MAP[TEMPLATE_KEY];
if (!samples) {
  console.error(`Unknown TEMPLATE_KEY "${TEMPLATE_KEY}". Valid: ${Object.keys(SAMPLE_MAP).join(', ')}`);
  process.exit(1);
}

const samplesToUse = samples.slice(0, COUNT);

async function submitOne(index: number, sampleFn: SampleFn): Promise<void> {
  const values = sampleFn();
  const payload = {
    version: '1.0',
    form_id: FORM_ID,
    submitted_at_ms: Date.now() - index * 1000 * 60 * (3 + Math.floor(Math.random() * 30)),
    submitter: address,
    values,
  };
  const file = WalrusFile.from({
    contents: new TextEncoder().encode(JSON.stringify(payload)),
    identifier: 'submission.json',
    tags: { 'content-type': 'application/json' },
  });

  const flow = sui.walrus.writeFilesFlow({ files: [file] });
  const encoded = await flow.encode();
  const blobId = encoded.blobId;

  // Wait between sigs to avoid gas-coin version race (see commit
  // b08a336 — first run all failed because the SDK's local object
  // cache lagged the on-chain gas coin version bumps).
  const reserveTx = flow.register({ epochs: 5, owner: address, deletable: false });
  const reserveResult = await sui.signAndExecuteTransaction({ transaction: reserveTx, signer: kp });
  await sui.waitForTransaction({ digest: reserveResult.digest });
  await flow.upload({ digest: reserveResult.digest });

  const certifyTx = flow.certify();
  const certifyResult = await sui.signAndExecuteTransaction({ transaction: certifyTx, signer: kp });
  await sui.waitForTransaction({ digest: certifyResult.digest });

  const recordTx = new Transaction();
  recordTx.moveCall({
    target: `${CATAT_PACKAGE_ID}::form::submit`,
    arguments: [
      recordTx.object(FORM_ID),
      recordTx.pure.string(blobId),
      recordTx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });
  const recordResult = await sui.signAndExecuteTransaction({ transaction: recordTx, signer: kp });
  await sui.waitForTransaction({ digest: recordResult.digest });

  const headline =
    (typeof values.f_title === 'string' && values.f_title) ||
    (typeof values.f_project_name === 'string' && values.f_project_name) ||
    (typeof values.f_name === 'string' && values.f_name) ||
    (typeof values.f_full_name === 'string' && values.f_full_name) ||
    (typeof values.f_reason === 'string' && (values.f_reason as string).slice(0, 50)) ||
    '(no headline)';
  console.log(`[seed] submission ${index + 1}/${COUNT}: ${String(headline).slice(0, 60)}…`);
  console.log(`[seed] tx ${recordResult.digest}`);
  console.log(`[seed] blob ${blobId}`);
}

for (let i = 0; i < samplesToUse.length; i++) {
  try {
    await submitOne(i, samplesToUse[i]!);
    await new Promise(r => setTimeout(r, 1500));
  } catch (err) {
    console.error(`[seed] submission ${i + 1} failed:`, err);
  }
}

console.log(`\n[seed] done — https://suiscan.xyz/testnet/object/${FORM_ID}`);

function req(k: string): string {
  const v = process.env[k];
  if (!v) {
    console.error(`Missing env var: ${k}`);
    process.exit(1);
  }
  return v;
}
