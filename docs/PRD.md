# catat — Product Requirements Document

> **Versi**: 0.1 (draft)
> **Update terakhir**: 2026-05-08
> **Status**: Untuk diskusi & iterasi sebelum scaffold

---

## 1. Visi

> **"The Typeform of Walrus — feedback yang verifiable, private kalau perlu, dan dimiliki oleh komunitas, bukan vendor."**

catat adalah platform form & feedback yang dibangun **native** di atas Walrus, Seal, dan Sui. Tidak menyembunyikan stack-nya — justru menonjolkan: tiap submission punya bukti on-chain (transaction hash + blob_id), field sensitif dienkripsi end-to-end pakai Seal, dan keseluruhan dApp berjalan di Walrus Sites tanpa server tradisional.

## 2. Pernyataan masalah

Tim Web3 dan komunitas Walrus saat ini mengumpulkan feedback pakai tools Web2 (Tally, Typeform, Google Forms, Airtable). Konsekuensi:

1. **Tidak ada wallet identity** — sulit verifikasi siapa yang submit, gampang spam
2. **Tidak ada token gating native** — sulit batasi survei ke token holder/komunitas
3. **Data terkumpul di vendor pihak ketiga** — kontradiktif dengan etos crypto
4. **Tidak ada bukti submission** — admin bisa hapus/ubah respons tanpa jejak
5. **Tidak ada enkripsi end-to-end yang composable** — bug report dengan screenshot sensitif harus hardcode pakai email PGP

Sementara, kompetitor Web3 (Formo, BlockSurvey, Web3Forms, Deform) hanya mendukung **EVM dan Solana**. Tidak ada form tool native di Sui/Walrus. Niche kosong.

## 3. Target persona

### 3.1 Form Creator (Admin)

| Atribut | Detail |
|---|---|
| Siapa | Project lead, community manager, builder Walrus, DAO ops, grant program |
| Skill | Familiar Web2 form tools, punya Sui wallet, mungkin tidak ngerti Move |
| Goal | Setup form cepat, dapat submission terstruktur, prioritize, export |
| Pain | Tally tidak verifikasi wallet; Google Forms terlalu publik untuk respons sensitif |
| Sukses | Bisa launch form < 5 menit, tahu siapa submit, bisa filter & ekspor |

### 3.2 Respondent (User)

| Atribut | Detail |
|---|---|
| Siapa | Pengguna komunitas, kontributor, applicant grant, beta tester |
| Skill | Punya Sui wallet, tidak harus tahu apa itu Walrus |
| Goal | Submit feedback cepat, kadang ingin anonim, kadang ingin attribution untuk reward |
| Pain | Form Web3 saat ini lambat, banyak gas cost, UX berantakan |
| Sukses | Submit dalam 30 detik, tahu submission "tercatat" tanpa harus paham detail |

### 3.3 Public Auditor (Stretch)

| Atribut | Detail |
|---|---|
| Siapa | Reporter, peneliti, member komunitas, calon investor |
| Goal | Verifikasi klaim creator: "Form ini dapat 500 respons dari unique wallet" |
| Pain | Klaim survei sering tidak bisa diverifikasi |
| Sukses | Lihat halaman publik dengan summary stats + bukti on-chain |

## 4. Use case prioritas

| # | Nama | Detail | Prioritas |
|---|---|---|---|
| UC1 | **Bug report** | Project Walrus minta laporan bug, dengan attachment screenshot/video, opsi private | P0 |
| UC2 | **Feature request** | Komunitas vote fitur baru, public karena untuk diskusi | P0 |
| UC3 | **Application form** | Grant program / hackathon submission, fields multi-step, kadang private | P0 |
| UC4 | **Survey/NPS** | Survey kepuasan komunitas, multi-rating, biasanya pendek | P0 |
| UC5 | **Embedded widget** | Form bisa di-embed di docs/blog (misal: feedback footer di docs.wal.app) | P1 |
| UC6 | **Token-gated form** | Hanya holder NFT X yang bisa submit | P1 |
| UC7 | **Reward attestation** | Submitter dapat attestation (NFT/role) sebagai bukti partisipasi | P2 |

## 5. Functional requirements

> Mapping eksplisit ke brief hackathon. Setiap item brief harus tercentang.

### 5.1 Form Builder (brief: "Custom form builder (fields, required/optional inputs)")

- [ ] **FR-1.1** UI drag-and-drop atau add-field button — minimal: tambah, hapus, reorder, edit field
- [ ] **FR-1.2** Setiap field bisa di-mark required/optional
- [ ] **FR-1.3** Form metadata: title, description, banner image (Walrus blob)
- [ ] **FR-1.4** Save draft locally + publish (publish = upload schema ke Walrus, register di Sui)
- [ ] **FR-1.5** Form settings: public/private/token-gated, encrypted fields, allow multiple submissions per wallet, deadline epoch

### 5.2 Field types yang disuport (brief: list eksplisit)

Wajib (per brief):
- [ ] **FR-2.1** Rich text input (markdown editor)
- [ ] **FR-2.2** Dropdown (single select)
- [ ] **FR-2.3** Checkboxes (multi select)
- [ ] **FR-2.4** Star rating (1–5 atau 1–10)
- [ ] **FR-2.5** Screenshot upload (image, multi-file)
- [ ] **FR-2.6** Video upload
- [ ] **FR-2.7** URL input (validated)
- [ ] **FR-2.8** Required field flag

Tambahan diferensiator (tidak diminta brief tapi value-add):
- [ ] **FR-2.9** Short text & long text (basic)
- [ ] **FR-2.10** Number / scale
- [ ] **FR-2.11** Email
- [ ] **FR-2.12** Wallet address (autofill dari connected wallet)
- [ ] **FR-2.13** Date / datetime
- [ ] **FR-2.14** **Encrypted field** (toggle per-field: konten dienkripsi via Seal sebelum upload)

### 5.3 Sharing (brief: "Shareable form links")

- [ ] **FR-3.1** Setiap form publish dapat URL: `quillform.wal.app/f/<form_object_id>` atau slug custom
- [ ] **FR-3.2** Embed code: `<iframe src="quillform.wal.app/embed/<id>">`
- [ ] **FR-3.3** QR code generator
- [ ] **FR-3.4** OG meta untuk preview di Twitter/Discord

### 5.4 Submission storage (brief: "Walrus-based storage for submissions")

- [ ] **FR-4.1** Submission disimpan sebagai Walrus blob (JSON)
- [ ] **FR-4.2** Multi-file attachments (screenshot, video) disimpan sebagai bagian dari Quilt yang sama dengan submission JSON
- [ ] **FR-4.3** Blob_id submission dicatat di Sui shared object Form
- [ ] **FR-4.4** Storage epoch awal: 12 epoch (~12 hari testnet) — creator bisa perpanjang

### 5.5 Encryption (brief: "optional encryption via Seal for private data")

- [ ] **FR-5.1** Toggle "private form" — seluruh submission dienkripsi, hanya owner bisa decrypt
- [ ] **FR-5.2** Toggle "private field" — per-field enkripsi (mis. email private, sisa publik)
- [ ] **FR-5.3** Threshold encryption pakai Seal (default: 2-of-3 key servers testnet)
- [ ] **FR-5.4** Decrypt dilakukan client-side oleh admin via SessionKey

### 5.6 Admin dashboard (brief: "filtering, reviewing, prioritizing feedback, export csv")

- [ ] **FR-6.1** List view semua submission (tabel)
- [ ] **FR-6.2** Filter: by date, status, field value, wallet address
- [ ] **FR-6.3** Sort: by submitted_at, rating, custom
- [ ] **FR-6.4** Detail view per-submission (semua field, attachments preview)
- [ ] **FR-6.5** Status workflow: New → Triaging → In Progress → Resolved → Archived
- [ ] **FR-6.6** Tagging & prioritization (high/med/low atau custom labels)
- [ ] **FR-6.7** Export CSV (semua submission, hormati enkripsi — admin yang sudah unlock bisa export plaintext)
- [ ] **FR-6.8** Bulk action: tag, archive, delete

### 5.7 Beyond brief (diferensiator)

- [ ] **FR-7.1** Public stats page: count submission, distribusi rating, tanpa expose isi (untuk Public Auditor persona)
- [ ] **FR-7.2** Wallet auth + signature challenge (anti-spam)
- [ ] **FR-7.3** Token gating: only address holding object/coin X bisa submit
- [ ] **FR-7.4** Webhook notification (Discord/Telegram) on new submission
- [ ] **FR-7.5** Form template gallery (Bug Report, Feature Request, NPS, Application — pre-built)

## 6. Non-functional requirements

| Kategori | Requirement |
|---|---|
| **Performance** | Submit form → blob certified < 30 detik di testnet |
| **Cost** | < 0.1 SUI gas + storage WAL minim untuk submission ≤ 50 KB (Quilt mandatory) |
| **Reliability** | Retry otomatis ke storage node lain; resume upload kalau crash |
| **Security** | Seal encryption end-to-end; admin key tidak pernah leave client; signature verification untuk submit |
| **Accessibility** | WCAG AA; keyboard navigation; screen reader friendly form runner |
| **i18n** | English default, Bahasa Indonesia secondary (untuk demo lokal) |
| **Browser support** | Chrome/Firefox/Safari last 2 versions, mobile Safari & Chrome |
| **No tracking** | Tidak ada Google Analytics, no third-party trackers |

## 7. Diferensiator vs kompetitor

(Detail lengkap di [`docs/COMPETITIVE-LANDSCAPE.md`](COMPETITIVE-LANDSCAPE.md))

| Diferensiator | Cara |
|---|---|
| **First & only di Sui/Walrus** | Tidak ada Formo/BlockSurvey/Deform di sini |
| **Verifiable submissions** | Tiap submission = transaction hash + blob_id, bisa dicek di Sui explorer |
| **Composable encryption** | Per-field encryption (bukan all-or-nothing) — Seal-powered |
| **No-vendor-lockin** | Schema, submission, dan dApp UI semua di Walrus → user bisa fork/migrate |
| **Cost-optimized** | Quilt batching: 100× lebih murah dari naive blob-per-submission |
| **Self-host trivial** | Frontend = Walrus Site, no infra; siapa pun bisa publish fork-nya sendiri |

## 8. Out of scope (untuk MVP/hackathon)

- ❌ Multi-tenant org/team management (assume 1 wallet = 1 admin)
- ❌ Payment-gated forms (paid surveys) — bisa P2 setelah hackathon
- ❌ Form versioning / migrate response saat schema berubah
- ❌ AI-generated form (let user describe, AI bikin)
- ❌ Mobile native app
- ❌ Cross-chain (assume Sui only)
- ❌ Mainnet deploy (testnet cukup untuk demo)
- ❌ White-label / custom domain (pakai default `quillform.wal.app`)

## 9. Success metrics

### Untuk hackathon (judges)

1. **Coverage requirement**: 100% field types yang diminta brief tercheck
2. **Walrus depth**: Pakai Quilt + Seal + Walrus Sites = 3 primitive (banyak peserta cuma 1)
3. **Real submission**: minimal 1 submission asli pakai produk sendiri (brief mandatory)
4. **Demo quality**: video di-host di Walrus, bukan YouTube
5. **Open source quality**: README jelas, kode rapi, kontrak Move kecil & readable

### Untuk product (post-hackathon)

1. 5 form ter-publish di testnet dalam 1 minggu pertama
2. 50 submission masuk total (asli, bukan test)
3. 1 tim Walrus core actually pakai untuk feedback channel mereka

## 10. Naming

**Final name**: **catat** (stylized lowercase, mengikuti pola modern brand seperti vercel/linear/sst).

| Aspek | Alasan |
|---|---|
| **Bahasa Indonesia native** | "Catat" = "to note down" / "record". Verb yang relate ke aktivitas inti produk. |
| **Memorable & short** | 5 huruf, mudah ucap & ketik di URL: `catat.wal.app`. |
| **Action-oriented** | Verb, bukan noun — "catat feedback", "catat bug". |
| **Cross-language friendly** | Pendek, tidak konflik dengan brand global existing, terbaca natural baik di Bahasa Indonesia maupun Inggris. |

Domain plan:
- `catat.wal.app` (Walrus Site)
- `catat.sui` (SuiNS testnet untuk human-readable URL)

Convention penulisan:
- **Prose & judul**: kapital di awal kalimat ("Catat adalah platform..."), lowercase di tengah ("kita pakai catat untuk...")
- **Code, URL, identifier**: selalu lowercase (`catat::form`, `catat.wal.app`, `packages/catat-web`)
- **Logo/wordmark** (nanti): lowercase

Alternatif sebelumnya yang dipertimbangkan (untuk arsip): Quillform, Floeforms, Pinnipad, Sealdesk.

## 11. Risiko & open question

| # | Risiko | Mitigasi |
|---|---|---|
| R1 | Walrus testnet down/lambat saat demo | Record video sebelum hari-H; siapkan retry logic; fallback aggregator |
| R2 | Seal SDK quirky / dokumentasi minim | Spike awal hari-1; kalau buntu, Seal jadi P1 (bukan P0) |
| R3 | Sui wallet adoption rendah dari respondent | Tambah opsi "submit anonim tanpa wallet" untuk public form |
| R4 | Quilt minimum N files — tidak praktis untuk single submission | Cek apakah Quilt bisa 1 file; kalau tidak, batch submission per-jam atau wrap submission JSON + attachment |
| R5 | Move contract bug saat decrypt → semua data hilang | Test extensively; gunakan threshold rendah (2-of-3) untuk recovery |
| R6 | Demo video > Walrus blob limit | Compress video, target < 50 MB |

| # | Open question | Cara jawab |
|---|---|---|
| Q1 | Apakah Quilt support single-file write? | Test SDK; baca [`introducing-quilt`](https://blog.walrus.xyz/introducing-quilt/) |
| Q2 | ✅ Bisa Walrus Sites pakai dynamic routes? | RESOLVED: pakai `ws-resources.json` dengan `routes: { "/f/*": "/index.html", ... }`. Wildcard hanya di akhir path. Lihat `spike/notes/walrus-sites-spa.md`. |
| Q3 | Berapa biaya total per-form (1 form + 100 submissions)? | Estimasi awal di ARCHITECTURE.md, validasi dengan upload nyata |
| Q4 | Apakah respondent harus punya WAL sendiri untuk pay storage? | Pakai Upload Relay → form creator bayar untuk respondent |

## 12. Submission checklist (hackathon brief)

- [ ] App live URL (Walrus Sites)
- [ ] Demo video < 3 menit, di Walrus
- [ ] Repo publik (GitHub)
- [ ] Penjelasan singkat di README
- [ ] Minimal 1 real feedback submission
- [ ] Register via airtable form
- [ ] (Opsional) Submit feedback Walrus pakai produk sendiri → menang "Best Feedback" $50 WAL

---

**Next**: lihat [`ARCHITECTURE.md`](ARCHITECTURE.md) untuk technical design dan stack rationale.
