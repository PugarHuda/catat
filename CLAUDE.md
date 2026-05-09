# catat — Walrus-native Feedback & Form Platform

> **Status**: PRD / design phase. Belum ada kode.
> Submission untuk **Walrus Sessions Session 2 — Form Tooling** (5–18 Mei 2026).

## Apa ini

Form & feedback platform native Walrus. Memungkinkan tim/komunitas:
- Membuat custom form (bug report, feature request, survey, application)
- Submission disimpan di Walrus (sebagai Quilt batch untuk efisiensi biaya)
- Field sensitif dienkripsi via Seal (only form owner / token holder bisa decrypt)
- Admin dashboard untuk review, filter, prioritize, export CSV
- Form & dashboard di-host di Walrus Sites — full-stack on-chain

## Mana yang harus dibaca dulu

| File | Isi | Untuk |
|---|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Visi, persona, use case, fitur, scope | "Apa yang dibangun & kenapa" |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Data model, stack, user flow, cost, security | "Bagaimana dibangun" |
| [`docs/COMPETITIVE-LANDSCAPE.md`](docs/COMPETITIVE-LANDSCAPE.md) | Web2/Web3 form tools, diferensiasi | "Apa yang sudah ada di luar" |

## Stack (rencana, dikonfirmasi sebelum scaffold)

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Frontend | Vite + React + TypeScript | Static SPA, kompatibel Walrus Sites |
| UI | Tailwind + shadcn/ui | Cepat, taste-aligned |
| Wallet | `@mysten/dapp-kit` | Standar Sui |
| Storage | `@mysten/walrus` + Quilt | Submission jadi blob batch (100× lebih murah) |
| Encryption | `@mysten/seal` | Private field |
| Smart contract | Move (Sui) — minimal | Form registry + Seal access policy |
| Form runtime | Custom React + JSON schema | MIT-safe, bisa kustom Walrus-native |
| Form state | react-hook-form + zod | Industri standar |
| Tabel admin | TanStack Table | Filter/sort/paginate |
| Export | papaparse | CSV |
| Hosting | Walrus Sites (via `site-builder`) | Decentralized hosting |

## Konvensi proyek

- **Bahasa**: Indonesia untuk prosa/dokumen/komentar bermakna. Inggris untuk identifier kode dan konsep teknis (function name, error, dll).
- **TypeScript strict mode** — tidak ada `any` implisit.
- **Blob ID**: prefix `blob_` di kode, `walrus://<blob_id>` di URL display.
- **Form schema**: JSON yang divalidasi `zod`, disimpan sebagai Walrus blob.
- **Move package**: satu modul `catat::form` di awal. Tambah modul lain hanya jika perlu.
- **Sub-folder CLAUDE.md** akan dibuat saat scaffolding (`packages/web/CLAUDE.md`, `packages/contracts/CLAUDE.md`).

## Status hackathon

- Track: Builder Tools
- Prize pool: $1,500 (juara 1: $500, 2: $300, 3: $200) + Special $200 WAL + 6× $50 WAL "Best Feedback"
- Strategi multi-win: target juara + special prize (open-source quality) + best feedback (dogfood: submit feedback ke tim Walrus pakai produk sendiri)
- Submission: airtable form (link di brief), demo video harus host di Walrus

## Inspirasi & referensi langsung

- **Walgo** (Walrus Sessions Session 1 winner) — sekarang RFP winner, bukti pola "menang Sessions → adopsi ekosistem"
- **Tally / Typeform** — UX form builder yang harus dipertahankan
- **Formo** (Web3 form di EVM/Solana) — fitur token gating, wallet auth jadi baseline
- **Formbricks** (open source) — pattern admin dashboard
