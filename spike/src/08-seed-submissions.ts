/**
 * Seed N varied test submissions to a given Form on-chain. Triggered
 * by the GH workflow `.github/workflows/seed-submissions.yml` to
 * populate an inbox with realistic on-chain data for demos.
 *
 * Env:
 *   SUI_PRIVATE_KEY  bech32 ed25519 key (from secrets)
 *   FORM_ID          Sui Form object id (0x...)
 *   COUNT            number of submissions (defaults 5, max 10)
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

console.log('[seed] address  :', address);
console.log('[seed] form_id  :', FORM_ID);
console.log('[seed] count    :', COUNT);

/** Varied bug-report payloads — different severities, ratings, descriptions
 *  so the seeded inbox has visual variety (mix of new/triaged-shaped data). */
const SAMPLES = [
  {
    f_title: 'Cannot upload blob > 100MB to testnet',
    f_severity: 'High',
    f_description:
      'When uploading a video file via writeBlob, the request hangs indefinitely after ~95MB. No error in console. SDK 0.6.2 on testnet.',
    f_repro_url: 'https://github.com/example/walrus-large-blob-repro',
    f_rating: 5,
  },
  {
    f_title: 'Walrus Sites deploy fails with site-builder 1.2.0',
    f_severity: 'Critical',
    f_description:
      'site-builder deploy hits "Cannot read property of undefined (reading manifest)". Worked fine on 1.1.0. Tried clean install + cache clear.',
    f_repro_url: 'https://github.com/example/site-builder-1.2-bug',
    f_rating: 5,
  },
  {
    f_title: 'Quilt write fails with single file',
    f_severity: 'High',
    f_description:
      'When passing array with single WalrusFile to writeFiles, get error "Quilt requires minimum 2 files". Should support 1 file or auto-pad transparently.',
    f_rating: 4,
  },
  {
    f_title: 'Seal SDK: 1-of-1 threshold not supported',
    f_severity: 'Medium',
    f_description:
      'Documentation mentions threshold encryption, but SDK throws when threshold=1. Need at least 2 servers? Should clarify or support single-server testing flow.',
    f_rating: 4,
  },
  {
    f_title: 'Connect wallet broken on Safari 18.1 mobile',
    f_severity: 'High',
    f_description:
      'dapp-kit connect modal does not appear on iOS Safari 18.1. Works on Chrome and Firefox. Console shows no errors. Suspected WalletStandard registration timing.',
    f_repro_url: 'https://github.com/example/dappkit-safari-bug',
    f_rating: 4,
  },
  {
    f_title: 'Suggestion: bulk submission triage view',
    f_severity: 'Low',
    f_description:
      'Would be great to triage multiple submissions at once with checkbox + bulk action menu (mark all resolved, archive selected, etc).',
    f_rating: 3,
  },
  {
    f_title: 'Anonymous: Are submissions GDPR-compliant by default?',
    f_severity: 'Medium',
    f_description:
      'Asking for a friend in EU. If form has sealed email field, is the encrypted blob still considered PII under GDPR? Where is it stored geographically?',
    f_rating: 3,
  },
  {
    f_title: 'Typo in error message: "blod_id" should be "blob_id"',
    f_severity: 'Low',
    f_description: 'In the SDK error toast, "Invalid blod_id format" — should be blob_id. Trivial fix.',
    f_rating: 2,
  },
  {
    f_title: 'Question: behavior with 3-of-5 servers down?',
    f_severity: 'Low',
    f_description:
      'Asking, not reporting. Curious what happens when 3 of 5 Seal key servers are unreachable but threshold is 3.',
    f_rating: 3,
  },
  {
    f_title: 'Burst — same submitter, third report this week',
    f_severity: 'Medium',
    f_description:
      'Pattern: testnet RPC returning 503 during peak hours (UTC 14:00-16:00). Likely Mysten side, not catat.',
    f_rating: 4,
  },
];

async function submitOne(index: number, sample: (typeof SAMPLES)[number]): Promise<void> {
  const payload = {
    version: '1.0',
    form_id: FORM_ID,
    submitted_at_ms: Date.now() - index * 1000 * 60 * (3 + Math.floor(Math.random() * 30)),
    submitter: address,
    values: {
      f_title: sample.f_title,
      f_severity: sample.f_severity,
      f_description: sample.f_description,
      f_screenshot: null,
      f_repro_url: sample.f_repro_url ?? null,
      f_email: null, // sealed fields require browser Seal SDK; skip in seeder
      f_rating: sample.f_rating ?? null,
    },
  };
  const file = WalrusFile.from({
    contents: new TextEncoder().encode(JSON.stringify(payload)),
    identifier: 'submission.json',
    tags: { 'content-type': 'application/json' },
  });

  const flow = sui.walrus.writeFilesFlow({ files: [file] });
  const encoded = await flow.encode();
  const blobId = encoded.blobId;

  // Each signAndExecuteTransaction returns immediately on submission;
  // the gas coin's NEW version isn't yet known to the local SDK cache,
  // so subsequent tx-build picks the OLD version and validators reject
  // with "object version unavailable for consumption". Fix: wait for
  // full finalization between tx's so the SDK sees the bumped gas
  // coin version before constructing the next tx.
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

  console.log(`[seed] submission ${index + 1}/${COUNT}: ${sample.f_title.slice(0, 50)}…`);
  console.log(`[seed] tx ${recordResult.digest}`);
  console.log(`[seed] blob ${blobId}`);
}

const samplesToUse = SAMPLES.slice(0, COUNT);
for (let i = 0; i < samplesToUse.length; i++) {
  try {
    await submitOne(i, samplesToUse[i]!);
    // small inter-submission delay so testnet RPC can index
    await new Promise(r => setTimeout(r, 1500));
  } catch (err) {
    console.error(`[seed] submission ${i + 1} failed:`, err);
  }
}

console.log(`\n[seed] done — check inbox at https://suiscan.xyz/testnet/object/${FORM_ID}`);

function req(k: string): string {
  const v = process.env[k];
  if (!v) {
    console.error(`Missing env var: ${k}`);
    process.exit(1);
  }
  return v;
}
