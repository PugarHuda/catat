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
  values: { f_title: 'Spike: single-file quilt', f_severity: 'Low' },
};

const file = WalrusFile.from({
  contents: new TextEncoder().encode(JSON.stringify(submission)),
  identifier: 'submission.json',
  tags: { 'content-type': 'application/json' },
});

console.log('=== Q1: writeFiles dengan 1 file? ===');
console.log(`Payload size: ~${JSON.stringify(submission).length} bytes`);

const t0 = Date.now();
const results = await client.walrus.writeFiles({
  files: [file],
  epochs: 3,
  deletable: false,
  signer: kp,
});
console.log(`writeFiles done in ${Date.now() - t0} ms`);
console.log('result count :', results.length);
console.log('quilt blob_id:', results[0].blobId);
console.log('file id      :', results[0].id);

console.log('\nReading via getFiles({ ids: [file.id] })...');
const [readFile] = await client.walrus.getFiles({ ids: [results[0].id] });
const json = await readFile.json();
console.log('decoded:', json);
console.log(JSON.stringify(json) === JSON.stringify(submission) ? '✅ roundtrip match' : '❌ mismatch');

console.log('\nReading via getBlob({ blobId }).files()...');
const blob = await client.walrus.getBlob({ blobId: results[0].blobId });
const filesInQuilt = await blob.files();
console.log('files in quilt:', filesInQuilt.length);

console.log('\n→ Update notes/findings.md untuk Q1');

function req(k: string): string {
  const v = process.env[k];
  if (!v) {
    console.error(`Missing env var: ${k}`);
    process.exit(1);
  }
  return v;
}
