# catat

> **Forms with proof.** Walrus-native feedback platform for Web3 builders.

Submission for **Walrus Sessions Session 2 — Form Tooling** (May 5–18, 2026).

---

## Apa ini

catat adalah platform form & feedback yang dibangun native di atas Walrus, Seal, dan Sui. Anggap saja seperti Typeform/Tally, dengan tiga perbedaan fundamental:

1. **Submission tersimpan di Walrus** (decentralized blob storage), bundled jadi Quilt untuk efisiensi 100×
2. **Field sensitif dienkripsi end-to-end** via Seal (only owner / token holder bisa decrypt), per-field bukan all-or-nothing
3. **Verifiable on-chain** — tiap submission punya `blob_id` + transaction hash di Sui, klaim "form ini dapat 500 respons" bisa diverifikasi siapa pun

## Status

🚧 **Prototype phase.** Form Builder + Form Runner UI sudah jalan. Walrus/Seal/Sui integration belum disambung — submission di-display sebagai JSON yang akan di-upload.

Roadmap di [`packages/web/CLAUDE.md`](packages/web/CLAUDE.md).

## Struktur

```
.
├── docs/                    # PRD, architecture, competitive landscape
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   └── COMPETITIVE-LANDSCAPE.md
├── packages/
│   └── web/                 # Vite + React 19 + TS + Tailwind v4
│       └── src/
│           ├── builder/     # Form Builder (slash command, inline edit)
│           └── runner/      # Form Runner (fill + submission preview)
└── spike/                   # SDK validation scripts (Walrus/Seal/Sui)
```

## Run lokal

```bash
npm install
npm run web:dev
# open http://localhost:5173
```

## Stack

| Lapisan | Pilihan |
|---|---|
| Frontend | Vite 6 + React 19 + TypeScript strict |
| UI | Tailwind v4 + shadcn-ready (zinc base) |
| Wallet | `@mysten/dapp-kit` (planned) |
| Storage | `@mysten/walrus` + Quilt (planned) |
| Encryption | `@mysten/seal` threshold 2-of-3 (planned) |
| Smart contract | Move minimal: `catat::form` (planned) |
| Hosting | Walrus Sites via `site-builder` |

## Hackathon submission

- **Track**: Builder Tools
- **Prize**: $1,500 + $200 special + 6× $50 WAL "Best Feedback"
- **Submission form**: [Airtable](https://airtable.com/appoDAKpC74UOqoDa/shrN8UbJRdbkd5Lso)
- **Strategi multi-win**: target juara + special prize (open-source quality) + best feedback (dogfood: pakai catat untuk submit feedback ke tim Walrus)

## Lisensi

MIT — silakan fork, self-host sebagai Walrus Site sendiri. Itu intinya.
