import 'dotenv/config';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { seal, getAllowlistedKeyServers } from '@mysten/seal';

const kp = Ed25519Keypair.fromSecretKey(req('SUI_PRIVATE_KEY'));

const keyServerIds = getAllowlistedKeyServers('testnet');
console.log('=== Allowlisted Seal key servers (testnet) ===');
keyServerIds.forEach((id, i) => console.log(`  [${i}] ${id}`));

const serverConfigs = keyServerIds.map(objectId => ({ objectId, weight: 1 }));

const client = new SuiGrpcClient({
  network: 'testnet',
  baseUrl: process.env.SUI_FULLNODE ?? 'https://fullnode.testnet.sui.io:443',
}).$extend(seal({ serverConfigs }));

const PACKAGE_ID = '0x0000000000000000000000000000000000000000000000000000000000000001';
const FORM_ID = '0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abcd';

const data = new TextEncoder().encode('private email: pugarhudam@gmail.com');
console.log('\n=== Encrypting via Seal threshold 2 ===');
console.log(`plaintext bytes: ${data.length}`);

try {
  const t0 = Date.now();
  const { encryptedObject } = await client.seal.encrypt({
    threshold: 2,
    packageId: PACKAGE_ID,
    id: FORM_ID,
    data,
  });
  console.log(`encrypt done in ${Date.now() - t0} ms`);
  console.log('ciphertext bytes:', encryptedObject.length);
  console.log('overhead       :', encryptedObject.length - data.length, 'bytes');
  console.log('✅ encrypt API works in Node');
} catch (e) {
  console.error('❌ encrypt failed:', e);
}

console.log('\n=== Decrypt: NOT TESTED in spike ===');
console.log('Decrypt butuh:');
console.log('  1. Move package dengan fungsi `seal_approve_*`');
console.log('  2. SessionKey signed by user wallet');
console.log('  3. Tx bytes yang call `seal_approve_*`');
console.log('  4. Key servers approve dan return decryption key');
console.log('→ Akan ditest setelah Move package catat::form di-publish');

function req(k: string): string {
  const v = process.env[k];
  if (!v) {
    console.error(`Missing env var: ${k}`);
    process.exit(1);
  }
  return v;
}
