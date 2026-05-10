/**
 * Mirrors RunnerSurface.handleSubmit() in packages/web — exact same SDK calls,
 * just signing with keypair (Node) instead of wallet popup (browser).
 *
 * If this passes, the browser flow should work too. Remaining unknowns are
 * UX-level (wallet extension compat, popup timing) which can't be tested here.
 */
import 'dotenv/config';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { walrus, WalrusFile } from '@mysten/walrus';

const kp = Ed25519Keypair.fromSecretKey(req('SUI_PRIVATE_KEY'));
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

console.log('Mimicking RunnerSurface.handleSubmit() with keypair (no wallet popup)');
console.log('Address :', address);

// Build the EXACT submission payload that RunnerSurface produces
const submissionPayload = {
  version: '1.0',
  form_id: '0xtest_form_object_id',
  submitted_at_ms: Date.now(),
  submitter: address,
  values: {
    f_title: 'Spike test: real Walrus submit from catat Runner logic',
    f_severity: 'High',
    f_description:
      'This submission mirrors what RunnerSurface.handleSubmit produces. ' +
      'If this completes, the browser flow (writeFilesFlow with wallet popup) should work.',
    f_screenshot: null,
    f_repro_url: 'https://github.com/PugarHuda/catat',
    f_email: null,
    f_rating: 5,
  },
};

const submissionFile = WalrusFile.from({
  contents: new TextEncoder().encode(JSON.stringify(submissionPayload)),
  identifier: 'submission.json',
  tags: { 'content-type': 'application/json' },
});

console.log('Payload bytes:', JSON.stringify(submissionPayload).length);
console.log();

const t0 = Date.now();

console.log('[1/4] writeFilesFlow.encode()');
const flow = sui.walrus.writeFilesFlow({ files: [submissionFile] });
await flow.encode();
console.log('     done in', Date.now() - t0, 'ms');

console.log('[2/4] sign+execute REGISTER tx');
const t1 = Date.now();
const registerTx = flow.register({
  epochs: 5,
  owner: address,
  deletable: false,
});
const registerResult = await sui.signAndExecuteTransaction({
  transaction: registerTx,
  signer: kp,
  options: { showEffects: true },
});
console.log('     register tx digest:', registerResult.digest);
console.log('     register status   :', registerResult.effects?.status.status);
console.log('     done in', Date.now() - t1, 'ms');

console.log('[3/4] flow.upload()');
const t2 = Date.now();
await flow.upload({ digest: registerResult.digest });
console.log('     done in', Date.now() - t2, 'ms');

console.log('[4/4] sign+execute CERTIFY tx');
const t3 = Date.now();
const certifyTx = flow.certify();
const certifyResult = await sui.signAndExecuteTransaction({
  transaction: certifyTx,
  signer: kp,
  options: { showEffects: true },
});
console.log('     certify tx digest :', certifyResult.digest);
console.log('     certify status    :', certifyResult.effects?.status.status);
console.log('     done in', Date.now() - t3, 'ms');

const filesUploaded = await flow.listFiles();
const blobId = filesUploaded[0]?.blobId ?? 'unknown';

console.log();
console.log('=== RESULT ===');
console.log('total time   :', Date.now() - t0, 'ms');
console.log('blob_id      :', blobId);
console.log('certify hash :', certifyResult.digest);
console.log('walruscan    : https://walruscan.com/testnet/blob/' + blobId.replace(/^blob_/, ''));
console.log('suiscan      : https://suiscan.xyz/testnet/tx/' + certifyResult.digest);

console.log();
console.log('=== Roundtrip read ===');
const [readFile] = await sui.walrus.getFiles({ ids: [filesUploaded[0]!.id] });
const readJson = await readFile.json();
const match =
  JSON.stringify(readJson) === JSON.stringify(submissionPayload);
console.log('content match:', match ? '✅' : '❌');
if (!match) {
  console.log('expected:', JSON.stringify(submissionPayload).slice(0, 200));
  console.log('got     :', JSON.stringify(readJson).slice(0, 200));
}

function req(k: string): string {
  const v = process.env[k];
  if (!v) {
    console.error(`Missing env var: ${k}`);
    process.exit(1);
  }
  return v;
}
