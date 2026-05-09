import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const kp = new Ed25519Keypair();
const address = kp.toSuiAddress();
const privateKey = kp.getSecretKey();

console.log('=== Fresh Ed25519 keypair (TESTNET ONLY — disposable) ===\n');
console.log('Address    :', address);
console.log('Private key:', privateKey);
console.log('\nAdd to spike/.env :');
console.log(`SUI_PRIVATE_KEY=${privateKey}`);
console.log('\nFund this address via:');
console.log('  https://faucet.sui.io  (select testnet, paste address)');
console.log(`  Discord #testnet-faucet:  !faucet ${address}`);
console.log('\nKemudian convert SUI → WAL via Walrus CLI (kalau ada):');
console.log('  walrus --context=testnet get-wal');
