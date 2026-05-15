# catat

> **Forms with proof.** Walrus-native feedback platform for Web3 builders.

Submission for **Walrus Sessions Session 2 — Form Tooling** (May 5–18, 2026).

🌐 **Live**: https://catat-walrus.vercel.app
📚 **In-app docs**: https://catat-walrus.vercel.app/?go=docs
📦 **Repo**: https://github.com/PugarHuda/catat

---

## What it is

catat is a form & feedback platform built native on **Walrus** (storage), **Sui** (registry + ownership), and **Seal** (per-field encryption). Like Typeform/Tally, with three fundamental differences:

1. **Submissions stored in Walrus** as Quilt batches — content-addressed bytes anyone can re-fetch via blob_id. The schema itself is a Walrus blob too.
2. **On-chain registry on Sui** via Move package `catat::form`. Every submit appends a blob_id to `Form.submission_blob_ids` — verifiable count = `vector::length(form.submission_blob_ids)`, queryable by anyone without permission.
3. **Per-field encryption via Seal IBE 2-of-3 threshold**. Toggle 🔒 on any field in the Builder; ciphertext lives in the public blob but only the form owner can decrypt via on-chain `seal_approve_owner` policy.

## What you can do today

- ✅ **Form Builder** with 12 field types + 12 templates + custom-template save (localStorage)
- ✅ **Update vs new copy** — re-publish a form you own preserves submission history; publish-as-new mints a fresh Form object
- ✅ **Form Runner** — real submit via 3-sig flow (Walrus reserve → certify → Sui submit), Quilt-batched JSON + attachments
- ✅ **Inbox** — notification feed across all your forms (per-form aggregate + recent-12 with headlines)
- ✅ **Admin** — triage workbench: status / priority / notes (localStorage + optional Walrus backup), filter, sort, decrypt sealed fields, sparkline + status/severity charts
- ✅ **Multi-format export** — CSV (Excel-friendly UTF-8 BOM + injection-safe), JSON (full structured payload), Markdown (presentation-ready report)
- ✅ **Verify** — paste any blob_id, anyone can re-derive the receipt without trusting catat
- ✅ **In-app gitbook docs** — 11 pages covering architecture, Walrus, Seal, Builder, Templates, Submitting, Inbox/Admin, Verify, FAQ
- ✅ **Public seed Bug Report form** — pre-seeded with real on-chain submissions across 7 templates

## Live on-chain artifacts

| Artifact | Address | Explorer |
|---|---|---|
| Move package `catat::form` | `0xe270518be3...9441` | [Suiscan](https://suiscan.xyz/testnet/object/0xe270518be3f37a2a9c65007af2ace7967ee087cf12c950de16b2987606269441) |
| Bug Report Form (shared object) | `0xe88fda404f...e34e` | [Suiscan](https://suiscan.xyz/testnet/object/0xe88fda404fe15a122c57ed220e668ec21a3f4119f2c38c65e490fbccd1e3a34e) |
| Walrus Site (frontend, testnet) | `0xe362ed40...8db7` | [Suiscan](https://suiscan.xyz/testnet/object/0xe362ed40995b7eca96dbbfc856b1115fc5c10b6938803df648e1fdb9bc5e8db7) |

## 3-minute browser demo

Prereq: Sui Wallet ([Slush](https://chromewebstore.google.com/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil) or Suiet) + funded testnet wallet.

1. Open https://catat-walrus.vercel.app
2. Click **"Try the demo →"**
3. Builder opens with the Templates gallery — pick **Bug Report**
4. Tweak any field; toggle 🔒 on the contact-email field for Seal encryption
5. Click **Publish form** → 3 wallet popups (Walrus reserve → certify → Sui create_form)
6. Success modal shows your share URL + Form ID. Copy the share URL
7. Open the share URL in another tab/wallet → fill the form → 3 more sigs
8. Back on owner wallet → **Inbox** lights up within ~10s with the new submission
9. Click into **Admin** → set Status to "triaging" → click **Decrypt** on the sealed email field → wallet popup → plaintext reveals
10. Click **⬇ export** → pick Markdown → presentation-ready report downloaded
11. Copy any submission's blob_id, paste into **Verify** → re-fetched independently from Walrus + Sui events

Wallet needs:
- ≥ 0.05 SUI testnet (gas for ~3 tx) — get at https://faucet.sui.io
- ≥ 0.1 WAL testnet (storage tip for ~10 epochs) — get via wallet's "Get WAL" swap or `spike/src/06-swap-sui-wal.ts`

## Project structure

```
.
├── docs/                              # external markdown docs
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── COMPETITIVE-LANDSCAPE.md
│   └── DEMO-VIDEO.md                  # script for hackathon submission video
├── packages/
│   ├── web/                           # Vite 6 + React 19 + TS strict + Tailwind v4
│   │   └── src/
│   │       ├── landing/               # Hero with live on-chain counter
│   │       ├── builder/               # Form Builder + 12 templates + custom save
│   │       ├── runner/                # Form Runner — 3-sig submit flow
│   │       ├── inbox/                 # Pure notification feed across owned forms
│   │       ├── admin/                 # Triage workbench + multi-format export
│   │       ├── verify/                # Public proof viewer
│   │       ├── docs/                  # In-app gitbook (11 pages + sidebar nav)
│   │       ├── components/            # WalletButton, SurfaceTabs, MyFormsPicker
│   │       └── lib/                   # contract.ts, providers.tsx, useWalrusClient (singleton)
│   └── contracts/                     # Move package catat::form
│       ├── Move.toml
│       └── sources/form.move
└── spike/                             # SDK validation scripts (E2E test fixtures)
    └── src/
        ├── 02-walrus-blob.ts          # writeBlob/readBlob smoke
        ├── 03-walrus-quilt-single.ts  # Quilt 1-file
        ├── 04-walrus-quilt-multi.ts   # Quilt + attachments
        ├── 05-seal-spike.ts           # Seal encrypt/decrypt smoke
        ├── 06-swap-sui-wal.ts         # SUI → WAL via official exchange
        ├── 07-test-runner-submit.ts   # Full E2E mirror of Runner.handleSubmit
        └── 08-seed-submissions.ts     # CI seed dispatcher (per-template payloads)
```

## Stack

| Layer | Choice | Status |
|---|---|---|
| Frontend | Vite 6 + React 19 + TS strict | ✅ |
| UI | Tailwind v4 + paper-aesthetic CSS + shadcn-ready (zinc) | ✅ |
| Wallet | `@mysten/dapp-kit` ^1.0 | ✅ |
| Storage | `@mysten/walrus` + Quilt + Upload Relay (singleton via `useWalrusClient`) | ✅ |
| Encryption | `@mysten/seal` 2-of-3 IBE per-field with on-chain `seal_approve_owner` policy | ✅ |
| Smart contract | Move `catat::form` (testnet, 5 entry points) | ✅ |
| Lint | ESLint flat config + typescript-eslint + react-hooks | ✅ |
| Hosting | Vercel (auto-deploy via GH Actions) + Walrus Sites (manual) | ✅ |

## CI/CD

| Workflow | Trigger | Purpose |
|---|---|---|
| `.github/workflows/deploy-vercel.yml` | push to `main` (web/**) | Auto-deploy production to Vercel via vercel CLI |
| `.github/workflows/deploy-walrus.yml` | manual `workflow_dispatch` | Deploy frontend to Walrus Sites testnet (manual: deploy wallet needs SUI + WAL top-up first) |
| `.github/workflows/publish-move.yml` | manual `workflow_dispatch` | Compile + publish `catat::form` Move package |
| `.github/workflows/seed-submissions.yml` | manual `workflow_dispatch` | Dispatch sample submissions per template (bug_report, nps, contact, etc.) |

## Run locally

```bash
npm install
npm run web:dev          # http://localhost:5173
npm run web:typecheck    # tsc --noEmit
cd packages/web && npm run lint  # ESLint flat config
```

Optional `.env` (in `packages/web/.env`):

```bash
VITE_WALRUS_UPLOAD_RELAY=https://upload-relay.testnet.walrus.space  # or mainnet
```

## Hackathon submission

- **Track**: Builder Tools
- **Prize pool**: $1,500 (1st $500, 2nd $300, 3rd $200) + $200 WAL special + 6× $50 WAL "Best Feedback"
- **Submission form**: [Airtable](https://airtable.com/appoDAKpC74UOqoDa/shrN8UbJRdbkd5Lso)
- **Multi-win strategy**:
  - **Juara** — full real on-chain integration: schema + submissions + access policy + per-field encryption all on-chain
  - **Special prize** — reusable patterns: paginated event scan, ownership cross-check, gas-coin race waits, Walrus singleton, multi-format export, hardenSchema validator, share-URL phishing lockdown
  - **Best Feedback** — dogfood: catat's own bug report form is published on testnet; we triage real catat issues via catat itself

## License

MIT — fork, self-host as your own Walrus Site. That's the whole point.
