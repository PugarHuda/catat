import 'dotenv/config';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { walrus } from '@mysten/walrus';

const kp = Ed25519Keypair.fromSecretKey(req('SUI_PRIVATE_KEY'));

const client = new SuiGrpcClient({
  network: 'testnet',
  baseUrl: process.env.SUI_FULLNODE ?? 'https://fullnode.testnet.sui.io:443',
}).$extend(walrus());

const payload = new TextEncoder().encode(`hello catat @ ${new Date().toISOString()}`);
console.log(`Writing blob, size: ${payload.length} bytes, epochs: 3`);

const t0 = Date.now();
const { blobId } = await client.walrus.writeBlob({
  blob: payload,
  deletable: false,
  epochs: 3,
  signer: kp,
});
console.log(`writeBlob done in ${Date.now() - t0} ms`);
console.log('blobId:', blobId);

console.log('\nReading back via readBlob...');
const t1 = Date.now();
const read = await client.walrus.readBlob({ blobId });
console.log(`readBlob done in ${Date.now() - t1} ms`);

const text = new TextDecoder().decode(read);
console.log('Roundtrip:', text);
console.log(text === new TextDecoder().decode(payload) ? '✅ match' : '❌ mismatch');

function req(k: string): string {
  const v = process.env[k];
  if (!v) {
    console.error(`Missing env var: ${k}`);
    process.exit(1);
  }
  return v;
}
