import 'dotenv/config';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { requestSuiFromFaucetV2, getFaucetHost } from '@mysten/sui/faucet';

const kp = Ed25519Keypair.fromSecretKey(req('SUI_PRIVATE_KEY'));
const address = kp.toSuiAddress();
const sui = new SuiClient({ url: process.env.SUI_FULLNODE ?? getFullnodeUrl('testnet') });

console.log('Address:', address);

const before = await sui.getBalance({ owner: address });
console.log('SUI before:', formatSui(before.totalBalance));

console.log('\nRequesting SUI from faucet...');
try {
  await requestSuiFromFaucetV2({ host: getFaucetHost('testnet'), recipient: address });
  console.log('Faucet request OK');
} catch (e) {
  console.error('Faucet failed:', (e as Error).message);
  console.log('Manual fallback: https://faucet.sui.io  (testnet)');
  console.log(`              : Discord #testnet-faucet  !faucet ${address}`);
}

await sleep(8000);
const after = await sui.getBalance({ owner: address });
console.log('SUI after :', formatSui(after.totalBalance));

const all = await sui.getAllBalances({ owner: address });
console.log('\nAll coin balances:');
for (const b of all) {
  console.log(`  ${b.coinType}`);
  console.log(`    total: ${b.totalBalance}  (objects: ${b.coinObjectCount})`);
}

const hasWal = all.some(b => b.coinType.toLowerCase().includes('::wal::wal'));
if (!hasWal) {
  console.log('\n⚠️  Belum ada WAL token. Convert via Walrus CLI:');
  console.log('     walrus --context=testnet get-wal');
}

function req(k: string): string {
  const v = process.env[k];
  if (!v) {
    console.error(`Missing env var: ${k}`);
    console.error('Tips: jalankan `npm run keygen` dulu, lalu copy ke .env');
    process.exit(1);
  }
  return v;
}
function formatSui(mist: string): string {
  return `${(Number(mist) / 1e9).toFixed(4)} SUI (${mist} MIST)`;
}
function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
