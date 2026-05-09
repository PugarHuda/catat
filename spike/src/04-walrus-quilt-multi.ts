import 'dotenv/config';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { walrus, WalrusFile } from '@mysten/walrus';

const kp = Ed25519Keypair.fromSecretKey(req('SUI_PRIVATE_KEY'));

const client = new SuiGrpcClient({
  network: 'testnet',
  baseUrl: process.env.SUI_FULLNODE ?? 'https://fullnode.testnet.sui.io:443',
}).$extend(walrus());

const submission = {
  form_id: '0xtest_form',
  submitted_at_ms: Date.now(),
  submitter: kp.toSuiAddress(),
  values: {
    f_title: 'Bug: cannot scroll on mobile',
    f_severity: 'High',
    f_description: 'Scrolling locks up after 3 swipes on iOS Safari 18.x',
    f_screenshot: ['screenshot-1.png', 'screenshot-2.png'],
  },
};

const mockImage = (size: number) => {
  const buf = new Uint8Array(size);
  for (let i = 0; i < size; i++) buf[i] = (i * 31 + 7) & 0xff;
  return buf;
};

const files = [
  WalrusFile.from({
    contents: new TextEncoder().encode(JSON.stringify(submission)),
    identifier: 'submission.json',
    tags: { 'content-type': 'application/json' },
  }),
  WalrusFile.from({
    contents: mockImage(50_000),
    identifier: 'screenshot-1.png',
    tags: { 'content-type': 'image/png', field: 'f_screenshot', index: '0' },
  }),
  WalrusFile.from({
    contents: mockImage(80_000),
    identifier: 'screenshot-2.png',
    tags: { 'content-type': 'image/png', field: 'f_screenshot', index: '1' },
  }),
];

const totalBytes = 50_000 + 80_000 + JSON.stringify(submission).length;
console.log('=== Real submission scenario ===');
console.log(`1 JSON + 2 mock screenshots, total ~${(totalBytes / 1024).toFixed(1)} KB`);

const t0 = Date.now();
const results = await client.walrus.writeFiles({
  files,
  epochs: 3,
  deletable: false,
  signer: kp,
});
console.log(`writeFiles done in ${Date.now() - t0} ms`);
console.log('result count       :', results.length);
console.log('quilt blob_id (sama):', results[0].blobId);
results.forEach((r, i) => console.log(`  file[${i}] id:`, r.id));

console.log('\n=== Reading individual files via identifier query ===');
const blob = await client.walrus.getBlob({ blobId: results[0].blobId });

const [submissionFile] = await blob.files({ identifiers: ['submission.json'] });
const submissionBytes = await submissionFile.bytes();
console.log('submission.json bytes:', submissionBytes.length);
console.log('submission.json json :', await submissionFile.json());

const screenshots = await blob.files({ tags: [{ field: 'f_screenshot' }] });
console.log('\nscreenshots tagged with field=f_screenshot:', screenshots.length);
for (const s of screenshots) {
  const bytes = await s.bytes();
  console.log(`  size: ${bytes.length} bytes`);
}

console.log('\n→ Cocok dengan flow real catat: 1 quilt = 1 submission lengkap dengan attachment');
console.log('→ Update notes/findings.md untuk Q1 cost & timing');

function req(k: string): string {
  const v = process.env[k];
  if (!v) {
    console.error(`Missing env var: ${k}`);
    process.exit(1);
  }
  return v;
}
