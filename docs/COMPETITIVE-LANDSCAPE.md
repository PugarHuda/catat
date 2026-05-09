# Competitive Landscape — Form & Feedback Tools

> **Versi**: 0.1
> **Update terakhir**: 2026-05-08

Riset cepat untuk menempatkan catat di pasar yang ada.

---

## 1. Web2 incumbents

| Tool | Strength | Weakness untuk Web3 |
|---|---|---|
| **Typeform** | UX legendaris, conversational | Tidak ada wallet, expensive, vendor lock |
| **Tally** | Free unlimited, generous tier, fast UX | Tidak ada Web3 fitur sama sekali |
| **Google Forms** | Ubiquitous, free | Estetika lemah, tidak ada gating, data ke Google |
| **Airtable Forms** | Terhubung database | Vendor lock, mahal, tidak ada wallet |
| **Jotform** | Banyak template | UX dated, tidak ada Web3 |
| **Formbricks** (open source) | Self-hosted, MIT, modern | Tidak ada Web3 fitur, perlu infra sendiri |

**Pelajaran**: Tally adalah benchmark UX yang harus dicocokkan. Form builder cepat, drag-drop, auto-save = standar industri.

## 2. Web3 form builders (kompetitor langsung)

### 2.1 Formo ([formo.so](https://formo.so))

**Stack**: EVM (20+ chain) + Solana. **Tidak support Sui/Walrus**.

| Fitur | Ada? |
|---|---|
| Wallet connect (EVM, Solana) | ✅ |
| Token gating | ✅ |
| Onchain analytics & attribution | ✅ |
| Discord/Twitter verification | ✅ |
| Decentralized storage submission | ❌ (centralized DB) |
| End-to-end encryption | ❌ |
| Self-hostable | ❌ (SaaS) |
| Open source | ❌ |

**Posisi**: Market leader di Web3 form builders. Tapi paradigm-nya masih SaaS — data masih di server mereka. Bukan benar-benar "decentralized".

### 2.2 BlockSurvey ([blocksurvey.io](https://blocksurvey.io/web3))

**Stack**: Multi-chain. Encryption-focused.

| Fitur | Ada? |
|---|---|
| Wallet auth | ✅ |
| End-to-end encryption | ✅ (proprietary) |
| Decentralized storage | ✅ (klaim) |
| Token gating | ✅ |
| Open source | ❌ |

**Posisi**: Lebih privacy-focused dari Formo. Stack mereka opaque (decentralized "blockchain-based" tanpa detail).

### 2.3 Web3Forms

**Stack**: Form processing service (mirip Formspree tapi Web3).

| Fitur | Ada? |
|---|---|
| API-first form processing | ✅ |
| Decentralized API endpoints | ✅ |
| End-to-end encryption | ✅ |
| Builder UI | ❌ (developer tool) |

**Posisi**: Untuk developer, bukan no-code creator. Berbeda persona.

### 2.4 Deform ([deform.cc](https://deform.cc))

**Stack**: EVM (multi-chain).

**Posisi**: Mirip Formo, fokus airdrop/campaign.

### 2.5 Lain-lain

- **Tabula** — token-gated form, lebih kecil.
- **Daylight Forms** — addresses-targeted, fokus engagement.

## 3. Walrus / Sui ecosystem (status sekarang)

| Tool | Apa | Hubungan dengan catat |
|---|---|---|
| **Walgo** (Session 1 winner) | Static site builder → Walrus Sites | Kita pakai untuk deploy frontend = dogfood signal |
| **Tusky** | Privacy-first file storage di Walrus | Inspirasi pattern encryption |
| **Walrus Sites** | Decentralized hosting | Kita deploy ke sini |
| **Tusk** (Haulout winner) | Hiring platform with Seal | Inspirasi UX private + encrypted |
| **Spectra** (Haulout winner) | Content moderation tanpa expose user data | Inspirasi private analytics |

**Verdict**: Tidak ada form/survey/feedback tool di ecosystem ini. Kosong.

## 4. Differentiation matrix

Skor: ✅ ada, ⚠️ partial, ❌ tidak ada, 💎 unique to us

| Fitur | Tally | Formo | BlockSurvey | **catat** |
|---|---|---|---|---|
| Free tier unlimited | ✅ | ⚠️ | ⚠️ | ✅ |
| No-code form builder | ✅ | ✅ | ✅ | ✅ |
| Drag-drop fields | ✅ | ✅ | ✅ | ✅ |
| Rich text + media + rating | ✅ | ✅ | ✅ | ✅ |
| Wallet auth | ❌ | ✅ EVM/Sol | ✅ EVM | ✅ Sui |
| Token gating | ❌ | ✅ | ✅ | ✅ Sui |
| **Per-field encryption** | ❌ | ❌ | ⚠️ all-or-nothing | 💎 Seal-powered |
| **Verifiable submissions on-chain** | ❌ | ❌ | ⚠️ proprietary | 💎 Sui native + blob_id |
| **Decentralized storage** | ❌ | ❌ | ⚠️ proprietary | 💎 Walrus |
| **Self-host as Walrus Site** | ❌ | ❌ | ❌ | 💎 |
| **Open source (full stack)** | ❌ | ❌ | ❌ | 💎 |
| Embeddable widget | ✅ | ✅ | ✅ | ✅ |
| CSV export | ✅ | ✅ | ✅ | ✅ |
| Public stats / verifiability page | ❌ | ❌ | ❌ | 💎 |
| Cost-optimized batching (Quilt) | N/A | N/A | N/A | 💎 |

**5 hal yang unik di kita** (💎):
1. Per-field encryption (granular privacy, bukan all-or-nothing)
2. Verifiable submissions on-chain (anti tampering, third-party auditable)
3. Native decentralized storage (Walrus, bukan klaim)
4. Self-host sebagai Walrus Site (zero infra, anyone can fork & run)
5. Quilt-batching (jauh lebih murah dari competitors yang naive blob/submission)

## 5. Posisi pasar (positioning statement)

> **"catat is the first feedback platform built natively on Sui & Walrus. For Web3 teams that need verifiable, granularly private feedback — not Tally with a wallet button bolted on."**

### 5.1 Positioning per segmen

| Segmen | Pitch |
|---|---|
| **Walrus core team & RFP grants** | "Pakai catat untuk feedback channel kalian — kami dogfood Walrus, semua data kalian punya, audit-able." |
| **Sui project leads** | "Tally + Sui-wallet auth + on-chain proof, free karena open source." |
| **DAO operators** | "Token-gated survey + private votes + on-chain receipt. Snapshot for everything else, catat untuk yang butuh isi terstruktur." |
| **Hackathon / grant programs** | "Application form yang verifiable: applicant wallet, timestamp, attachment hash — semua tercatat on-chain." |
| **Indie builder Sui** | "Bug report widget di docs kalian, embed dalam 30 detik." |

### 5.2 Anti-positioning (apa yang BUKAN kita)

- ❌ **Bukan Typeform-killer untuk Web2** — kalau user tidak care Web3, Tally lebih simple
- ❌ **Bukan analytics platform** — Formo punya analytics; kita bukan kompetisi di sana
- ❌ **Bukan multi-chain abstraction** — kita Sui-native, tidak coba support EVM/Solana
- ❌ **Bukan voting/governance tool** — Snapshot, Tally (governance), Realms ada untuk itu

## 6. Hal-hal untuk "dicuri" (inspirasi spesifik)

| Dari | Apa yang kita ambil |
|---|---|
| **Tally** | Form builder UX (single-page editor, live preview, slash commands untuk add field) |
| **Typeform** | One-question-at-a-time mode (opsional, P1) |
| **Formo** | Wallet connect modal pattern, token gating UI |
| **Linear** | Admin dashboard density, keyboard shortcut, kanban view untuk triage |
| **Formbricks** | Open-source repo structure, README quality, contribution guide |
| **Walgo (Session 1)** | Walrus Sites deploy flow, AI-assisted template start |
| **Tusky** | Encryption UX (toggle simple, key management invisible) |

## 7. Risiko kompetitif

| Risiko | Likelihood | Mitigasi |
|---|---|---|
| Formo / BlockSurvey expand ke Sui | Medium (12 bulan?) | Move first, build moat di Walrus-native primitives |
| Walrus team bikin form tool sendiri | Low (mereka prefer ecosystem partner) | Engage early, jadi RFP candidate |
| Peserta hackathon lain juga bikin form yang lebih bagus | High (sama hackathon) | Diferensiasi: encryption depth, Quilt usage, OSS quality |
| Tally / Typeform tambah Web3 | Low (ChatGPT moment-lah baru tertarik) | Tidak relevan — segmen beda |

## 8. Strategi pasca-hackathon (hint)

1. **Submit ke RFP Walrus** — kalau menang Session 2, daftar untuk grant lanjutan (mirip Walgo)
2. **Open source dengan kualitas tinggi** — ini multiplier untuk adopsi & "Special Prize"
3. **Tawarkan ke Walrus team** untuk feedback channel resmi mereka (ultimate dogfood)
4. **List di awesome-walrus** — submit PR ke [MystenLabs/awesome-walrus](https://github.com/MystenLabs/awesome-walrus) di kategori "Form/Feedback Tools" (kategori yang belum ada — kita yang buat!)

---

**Sumber riset utama**:
- [Formo Web3 Forms](https://formo.so/forms)
- [BlockSurvey Web3](https://blocksurvey.io/web3)
- [Top Web3 Form Builders Comparison](https://formo.so/blog/top-web3-form-builders-for-crypto-and-defi-projects)
- [9 Best Typeform Alternatives Web2/Web3](https://formo.so/blog/typeform-alternatives-best-web2-and-web3-form-builder)
- [Awesome Walrus](https://github.com/MystenLabs/awesome-walrus)
- [Walrus Quilt announcement](https://blog.walrus.xyz/introducing-quilt/)
