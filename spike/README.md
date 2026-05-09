# catat — Spike

Quick validation scripts untuk 4 unknown sebelum scaffold proyek beneran.

## Open question yang ditest

| # | Question | Bagaimana ditest | Status |
|---|---|---|---|
| Q1 | Apakah Quilt support 1 file saja? | `npm run quilt-single` | ⏳ TBD |
| Q2 | Walrus Sites SPA fallback `/f/anything` → `index.html`? | Riset docs (no script) | ✅ resolved — pakai `ws-resources.json` |
| Q3 | Seal SDK browser-friendly (WASM)? | `npm run seal` (Node smoke) + scaffold Vite test terpisah | ⏳ TBD |
| Q4 | Sui testnet faucet & WAL masih jalan? | `npm run faucet` | ⏳ TBD |

Detail finding di [`notes/findings.md`](notes/findings.md).

## Setup

```bash
cd spike
npm install
cp .env.example .env
npm run keygen                 # generate fresh testnet keypair
# copy private key dari output ke .env
```

## Run

```bash
npm run keygen        # generate ed25519 keypair (DISPOSABLE — testnet only)
npm run faucet        # request SUI dari faucet + cek balance
npm run blob          # writeBlob + readBlob smoke test
npm run quilt-single  # Q1: writeFiles dengan 1 file (the key question)
npm run quilt-multi   # real submission scenario (1 JSON + 2 mock images)
npm run seal          # Seal encrypt smoke test (decrypt butuh Move contract)
```

Disarankan jalankan secara berurutan: `keygen → faucet → blob → quilt-single → quilt-multi → seal`.

## Prereq

- Node 20+
- (Opsional tapi disarankan) [Walrus CLI](https://docs.wal.app/docs/getting-started) untuk convert SUI → WAL: `walrus --context=testnet get-wal`
- (Opsional) Sui CLI untuk verifikasi tx di explorer

## Catatan keamanan

Keypair yang di-generate `00-keygen.ts` adalah **disposable testnet wallet**. Jangan pernah pakai untuk mainnet atau pegang token bernilai. `.env` di-gitignore.

## Setelah spike done

1. Update `notes/findings.md` dengan hasil run
2. Sync ke `../docs/ARCHITECTURE.md` (open questions section) dan `../docs/PRD.md` (risiko section)
3. Lalu mulai scaffold proper monorepo (`packages/web` + `packages/contracts`)
