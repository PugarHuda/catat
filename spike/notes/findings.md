# Spike Findings

> Update file ini saat run script. Sync ke `../../docs/ARCHITECTURE.md` dan `../../docs/PRD.md` setelah selesai.

---

## Q1: Quilt support 1 file?

- **Status**: ⏳ TBD — run `npm run quilt-single`
- **Hasil**: ___ (sukses / gagal / requires N≥2 / dst)
- **Catatan**: ___
- **Implikasi arsitektur**:
  - Kalau ✅: 1 submission = 1 Quilt (selalu, terlepas attachment ada/tidak)
  - Kalau ❌: butuh batching strategy — submission JSON + dummy file, atau pakai `writeBlob` untuk submission tanpa attachment

## Q2: Walrus Sites SPA fallback?

- **Status**: ✅ RESOLVED (research-based)
- **Cara**: `ws-resources.json` dengan `routes: { "/f/*": "/index.html" }`
- **Constraint**: wildcard hanya di akhir path
- **Detail**: lihat [`walrus-sites-spa.md`](walrus-sites-spa.md)

## Q3: Seal SDK browser-friendly?

- **Status**: ⏳ partial — Node smoke test via `npm run seal`
- **Confirmed**: SDK exists `@mysten/seal@1.1.1`, helper `getAllowlistedKeyServers('testnet')` available
- **Testnet key servers** (per riset):
  - `0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75`
  - `0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8`
- **Browser test**: TBD setelah scaffold `packages/web` (Vite). Cek apakah perlu WASM config seperti `@mysten/walrus`.
- **Decrypt E2E**: TBD setelah Move package catat::form di-publish

## Q4: Faucet & WAL availability?

- **Status**: ⏳ TBD — run `npm run faucet`
- **Faucet endpoint**: https://faucet.sui.io (testnet)
- **Discord fallback**: #testnet-faucet `!faucet 0x...`
- **WAL acquisition**: tidak via faucet langsung — convert SUI → WAL via Walrus CLI: `walrus --context=testnet get-wal` (1:1 rate)
- **Rate limit**: ___ (catat dari run)

---

## Q5 (bonus): Keypair format

- Sui private key: bech32 `suiprivkey1...`
- Load via `Ed25519Keypair.fromSecretKey(envString)`
- Generate baru: `npm run keygen`

## Cost observation (validasi cost model)

Catat hasil dari spike runs untuk validasi estimasi di `docs/ARCHITECTURE.md` section 6.

| Operation | Bytes | Time | SUI cost | WAL cost |
|---|---|---|---|---|
| writeBlob (small text ~50 B) | 50 | ___ ms | ___ | ___ |
| writeFiles single (~200 B JSON) | 200 | ___ ms | ___ | ___ |
| writeFiles 1 JSON + 2 imgs (~130 KB) | 130000 | ___ ms | ___ | ___ |
| Seal encrypt (~50 B) | 50 | ___ ms | (off-chain) | (off-chain) |

## Issue / blocker

(Catat error atau friction selama run)

- ___

## Action items

- [ ] Update `docs/ARCHITECTURE.md` open questions section dengan Q1 hasil
- [ ] Update `docs/PRD.md` cost section kalau hasil jauh dari estimasi
- [ ] Buat issue di repo Walrus / Seal kalau ada bug — sekaligus jadi material untuk "Best Feedback" $50 WAL prize
