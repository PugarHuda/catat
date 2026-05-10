# catat

> **Forms with proof.** Walrus-native feedback platform for Web3 builders.

Submission for **Walrus Sessions Session 2 — Form Tooling** (May 5–18, 2026).

🌐 **Live**: https://catat-walrus.vercel.app
📦 **Repo**: https://github.com/PugarHuda/catat

---

## Apa ini

catat adalah platform form & feedback yang dibangun native di atas **Walrus**, **Sui**, dan (segera) **Seal**. Mirip Typeform/Tally, dengan tiga perbedaan fundamental:

1. **Submission tersimpan di Walrus** (decentralized blob storage). Bukan klaim, bukan abstraksi — content-addressable bytes yang siapa saja bisa fetch via blob_id.
2. **On-chain registry di Sui** via Move package `catat::form`. Tiap submit append blob_id ke `Form.submission_blob_ids`. Verifiable count = `vector::length(form.submission_blob_ids)`, queryable oleh siapa pun tanpa permission.
3. **Per-field encryption via Seal** *(coming soon)*. Toggle 🔒 per field di Builder, ciphertext di blob hanya bisa di-decrypt oleh form owner via Seal threshold key servers.

## Status

✅ **Real on-chain MVP**:
- Form Builder dengan slash command + 12 field types
- Form Runner: real submit ke Walrus (Quilt) + Sui registry (3 wallet sigs)
- Admin Dashboard: reads dari on-chain Form + Walrus blobs (real submissions appear next to demo data)
- Landing page dengan live counter dari `Form.submission_blob_ids.length`

⏳ **Pending**:
- Seal encryption (butuh `seal_approve_*` Move addition)
- Schema upload via Builder's "Publish" button (currently no-op)
- Code-split untuk landing-first paint

## Live on-chain artifacts

| Artifact | Address | Explorer |
|---|---|---|
| Move package `catat::form` | `0xe270518be3...9441` | [Suiscan](https://suiscan.xyz/testnet/object/0xe270518be3f37a2a9c65007af2ace7967ee087cf12c950de16b2987606269441) |
| Bug Report Form (shared object) | `0xe88fda404f...e34e` | [Suiscan](https://suiscan.xyz/testnet/object/0xe88fda404fe15a122c57ed220e668ec21a3f4119f2c38c65e490fbccd1e3a34e) |
| Walrus Site (frontend, testnet) | `0xe362ed40...8db7` | [Suiscan](https://suiscan.xyz/testnet/object/0xe362ed40995b7eca96dbbfc856b1115fc5c10b6938803df648e1fdb9bc5e8db7) |

## Coba di browser (~3 menit)

Prereq: Sui Wallet ([Chrome](https://chromewebstore.google.com/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil)) installed + funded testnet wallet.

1. Buka https://catat-walrus.vercel.app
2. Klik **"Try the demo →"** di hero
3. Builder muncul dengan template Bug Report. Tekan `/` untuk slash menu, lihat 12 field types incl. **Web3-only group** (Wallet address) dan toggle **🔒 Encrypted**
4. Klik tab **Preview** → form runner muncul
5. Klik **"Connect wallet"** top-right
6. Isi field required (title, severity, description) → klik **"Submit to Walrus"**
7. Approve 3 wallet popups: Walrus reserve → Walrus certify → Sui registry
8. Review screen: real `blob_id` + `tx_hash` + `form_id` dengan link ke Walruscan/Suiscan
9. Klik tab **Submissions** → submission kamu muncul di top dengan pulsing emerald dot (real on-chain) di samping 12 demo entries

Wallet butuh:
- ≥ 0.05 SUI testnet (gas untuk 3 tx) — get di https://faucet.sui.io
- ≥ 0.1 WAL testnet (storage 10 epochs) — get di https://stakely.io/faucet/walrus-testnet-wal atau swap SUI→WAL via Walrus exchange (lihat `spike/src/06-swap-sui-wal.ts`)

## Struktur

```
.
├── docs/
│   ├── PRD.md                        # product requirements
│   ├── ARCHITECTURE.md               # data model, flows, stack
│   └── COMPETITIVE-LANDSCAPE.md      # vs Tally/Formo/BlockSurvey
├── packages/
│   ├── web/                          # Vite + React 19 + TS + Tailwind v4 + dapp-kit
│   │   └── src/
│   │       ├── landing/              # Hero with live on-chain counter
│   │       ├── builder/              # Form Builder (slash command)
│   │       ├── runner/               # Form Runner (Walrus + Sui submit)
│   │       ├── admin/                # Linear-style triage + chain reads
│   │       ├── components/           # WalletButton, SurfaceTabs
│   │       └── lib/                  # contract.ts, providers.tsx
│   └── contracts/                    # Move package catat::form
│       ├── Move.toml
│       └── sources/form.move
└── spike/                            # SDK validation scripts
    └── src/
        ├── 02-walrus-blob.ts         # writeBlob/readBlob
        ├── 03-walrus-quilt-single.ts # Quilt 1-file
        ├── 04-walrus-quilt-multi.ts  # Quilt + attachments
        ├── 05-seal-spike.ts          # Seal encrypt smoke
        ├── 06-swap-sui-wal.ts        # SUI → WAL via official exchange
        └── 07-test-runner-submit.ts  # Full E2E mirror of Runner.handleSubmit
```

## Stack

| Lapisan | Pilihan | Status |
|---|---|---|
| Frontend | Vite 6 + React 19 + TS strict | ✅ |
| UI | Tailwind v4 + shadcn-ready (zinc) | ✅ |
| Wallet | `@mysten/dapp-kit` ^1.0 | ✅ |
| Storage | `@mysten/walrus` + Upload Relay | ✅ |
| Smart contract | Move `catat::form` (testnet) | ✅ |
| Encryption | `@mysten/seal` per-field | ⏳ pending |
| Hosting | Vercel + Walrus Sites (testnet) | ✅ |

## CI/CD

| Workflow | Trigger | Purpose |
|---|---|---|
| `.github/workflows/deploy-walrus.yml` | push to `main` (web/**) | Deploy frontend to Walrus Sites testnet via [`MystenLabs/walrus-sites-github-actions/deploy@v3`](https://github.com/MystenLabs/walrus-sites-github-actions) |
| `.github/workflows/publish-move.yml` | manual dispatch | Compile + publish `catat::form` Move package, create initial Form |

Vercel deploy: `npx vercel --prod` (auto-aliases via `vercel.json`).

## Run lokal

```bash
npm install
npm run web:dev   # http://localhost:5173
```

## Hackathon submission

- **Track**: Builder Tools
- **Prize**: $1,500 + $200 special + 6× $50 WAL "Best Feedback"
- **Submission form**: [Airtable](https://airtable.com/appoDAKpC74UOqoDa/shrN8UbJRdbkd5Lso)
- **Strategi multi-win**:
  - Juara — full real on-chain integration via Walrus + Sui Move
  - Special prize — open-source quality + reusable patterns (CI/CD for Move publish, Walrus Upload Relay handling, dapp-kit + walrus integration recipe)
  - Best Feedback — dogfood: submit feedback ke tim Walrus pakai catat sendiri (track: WAL coin type drift between stakely.io faucet vs official package, Upload Relay necessity for browser, etc.)

## Lisensi

MIT — silakan fork, self-host sebagai Walrus Site sendiri. Itu intinya.
