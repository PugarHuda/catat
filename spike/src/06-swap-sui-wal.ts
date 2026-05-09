import 'dotenv/config';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { Transaction } from '@mysten/sui/transactions';

const EXCHANGE_PACKAGE = '0x82593828ed3fcb8c6a235eac9abd0adbe9c5f9bbffa9b1e7a45cdd884481ef9f';
const EXCHANGE_OBJECT  = '0xf4d164ea2def5fe07dc573992a029e010dba09b1a8dcbc44c5c2e79567f39073';
const WAL_COIN_TYPE    = '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL';

const SWAP_AMOUNT_MIST = 500_000_000n; // 0.5 SUI -> 0.5 WAL (rate 1:1)

const PRIVATE_KEY = req('SUI_PRIVATE_KEY');
const kp = Ed25519Keypair.fromSecretKey(PRIVATE_KEY);
const address = kp.toSuiAddress();

const sui = new SuiJsonRpcClient({ url: process.env.SUI_FULLNODE ?? getJsonRpcFullnodeUrl('testnet') });

console.log('Address:', address);
console.log('Swapping', Number(SWAP_AMOUNT_MIST) / 1e9, 'SUI -> WAL via official testnet exchange');

const tx = new Transaction();
const [coinForSwap] = tx.splitCoins(tx.gas, [SWAP_AMOUNT_MIST]);

const walCoin = tx.moveCall({
  target: `${EXCHANGE_PACKAGE}::wal_exchange::exchange_all_for_wal`,
  arguments: [tx.object(EXCHANGE_OBJECT), coinForSwap],
});

tx.transferObjects([walCoin], address);

const result = await sui.signAndExecuteTransaction({
  transaction: tx,
  signer: kp,
  options: { showEffects: true, showBalanceChanges: true },
});

console.log('\nTx digest:', result.digest);
console.log('Status   :', result.effects?.status.status);
if (result.balanceChanges) {
  console.log('\nBalance changes:');
  for (const b of result.balanceChanges) {
    console.log(`  ${b.coinType.includes('::wal::WAL') ? 'WAL' : 'SUI'} : ${b.amount}`);
  }
}

await new Promise(r => setTimeout(r, 3000));
const wal = await sui.getCoins({ owner: address, coinType: WAL_COIN_TYPE });
console.log('\nFinal WAL balance:');
for (const c of wal.data) {
  console.log(`  ${c.balance} (${c.coinObjectId})`);
}

function req(k: string): string {
  const v = process.env[k];
  if (!v) {
    console.error(`Missing env var: ${k}`);
    process.exit(1);
  }
  return v;
}
