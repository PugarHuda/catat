# catat — Technical Architecture

> **Versi**: 0.1 (draft)
> **Update terakhir**: 2026-05-08

---

## 1. High-level system diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     BROWSER (Frontend SPA)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Form Builder │  │ Form Runner  │  │ Admin Dashboard          │  │
│  │  /b/[draft]  │  │  /f/[formId] │  │  /a/[formId]             │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┬───────────┘  │
│         │                 │                          │              │
│         └─────────────────┼──────────────────────────┘              │
│                           │                                          │
│  ┌────────────────────────▼──────────────────────────────────────┐  │
│  │  SDK Layer: @mysten/sui, @mysten/walrus, @mysten/seal,        │  │
│  │             @mysten/dapp-kit                                   │  │
│  └────────┬─────────────────┬──────────────────┬──────────────────┘  │
└───────────┼─────────────────┼──────────────────┼─────────────────────┘
            │                 │                  │
            ▼                 ▼                  ▼
   ┌───────────────┐  ┌───────────────┐  ┌──────────────────┐
   │  SUI TESTNET  │  │ WALRUS TESTNET│  │ SEAL KEY SERVERS │
   │               │  │               │  │   (testnet, ≥3)  │
   │ Move package  │  │ Storage nodes │  │                  │
   │ - Form object │  │ - Quilt API   │  │ Threshold IBE    │
   │ - Submit fn   │  │ - Blob CRUD   │  │ Identity-based   │
   │ - Seal policy │  │               │  │ encryption       │
   └───────────────┘  └───────────────┘  └──────────────────┘
                              ▲
                              │
                    ┌─────────┴──────────┐
                    │ WALRUS SITES       │
                    │  catat.wal.app │
                    │  (frontend itself) │
                    └────────────────────┘
```

**Inti**: Frontend SPA (deployed sebagai Walrus Site sendiri) berinteraksi langsung ke Sui RPC, Walrus storage nodes, dan Seal key servers. **Tidak ada backend tradisional**. Tidak ada database. Tidak ada server kita yang harus dipelihara.

## 2. Komponen utama

### 2.1 Frontend (Vite + React + TypeScript)

Tiga sub-app utama dalam satu SPA, dipisah by route:

| Route | Sub-app | Auth |
|---|---|---|
| `/` | Landing + form template gallery | None |
| `/b/new` atau `/b/:draftId` | **Form Builder** (creator) | Wallet required |
| `/f/:formId` | **Form Runner** (respondent) | Wallet optional/required (per form) |
| `/a/:formId` | **Admin Dashboard** (creator) | Wallet required, must own form |
| `/embed/:formId` | Embeddable form runner (iframe) | Same as `/f` |
| `/p/:formId` | Public stats (count, distribusi) | None |

### 2.2 Move package (`catat::form`)

Smart contract minimal di Sui. Tujuan:
1. Registry on-chain untuk form (siapa owner, blob_id schema)
2. Daftar submission blob_ids untuk form (verifiable count)
3. Access policy untuk Seal (siapa boleh decrypt)

```move
module catat::form {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::String;
    use std::vector;

    /// Form sebagai shared object — siapa pun bisa baca, hanya owner bisa mutate settings.
    public struct Form has key {
        id: UID,
        owner: address,
        schema_blob_id: String,        // blob_id Walrus untuk schema JSON
        submission_blob_ids: vector<String>,
        // Settings
        is_private: bool,              // true = pakai Seal
        token_gate: Option<address>,   // package address untuk token-gating, None = public
        deadline_epoch: Option<u64>,   // None = forever
        accept_submissions: bool,
    }

    /// Event emit saat submission baru — bagus untuk indexer/webhook.
    public struct SubmissionAdded has copy, drop {
        form_id: address,
        submitter: address,
        blob_id: String,
        timestamp_ms: u64,
    }

    public entry fun create_form(
        schema_blob_id: String,
        is_private: bool,
        ctx: &mut TxContext,
    ) {
        let form = Form {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            schema_blob_id,
            submission_blob_ids: vector::empty(),
            is_private,
            token_gate: option::none(),
            deadline_epoch: option::none(),
            accept_submissions: true,
        };
        transfer::share_object(form);
    }

    public entry fun submit(
        form: &mut Form,
        blob_id: String,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(form.accept_submissions, ENotAcceptingSubmissions);
        // (token_gate check di sini kalau ada)
        vector::push_back(&mut form.submission_blob_ids, blob_id);
        event::emit(SubmissionAdded { /* ... */ });
    }

    /// Seal access policy entry — dipanggil oleh key server untuk validasi decrypt request.
    /// Convention Seal: function bernama `seal_approve_*` dengan parameter `id: vector<u8>`.
    public fun seal_approve_owner(
        id: vector<u8>,
        form: &Form,
        ctx: &TxContext,
    ) {
        assert!(tx_context::sender(ctx) == form.owner, ENotOwner);
        // ID validation: id == form.id || id is bytes-encoded form_id
    }

    // Errors
    const ENotAcceptingSubmissions: u64 = 1;
    const ENotOwner: u64 = 2;
}
```

> **Move stays minimal**. Lebih banyak logika = lebih banyak risiko = lebih lambat audit. Cukup registry + access policy.

### 2.3 Walrus storage layer

Tiga jenis blob:

| Tipe blob | Isi | Mutable? | Encryption |
|---|---|---|---|
| **Schema blob** | Form schema (JSON dengan field defs) | Immutable per-version (publish baru = blob baru) | No |
| **Submission Quilt** | Quilt berisi: `submission.json` + attachments (image, video) | Immutable | Optional (Seal) |
| **Asset blob** | Form banner image, custom theme | Immutable | No |

**Quilt usage pattern untuk submission**:

```ts
const submissionFiles = [
  WalrusFile.from({
    contents: encoder.encode(JSON.stringify(submissionData)),
    identifier: 'submission.json',
    tags: { 'content-type': 'application/json' },
  }),
  WalrusFile.from({
    contents: screenshotBytes,
    identifier: 'screenshot-1.png',
    tags: { 'content-type': 'image/png', 'field': 'screenshot' },
  }),
  // ... attachments lain
];

const [result] = await client.walrus.writeFiles({
  files: submissionFiles,
  epochs: 12,           // ~12 hari testnet
  deletable: false,
  signer: keypair,
});

// result.blobId → ini yang dicatat di Sui via submit()
```

**Reading kembali**:

```ts
const [submissionFile, ...attachments] = await client.walrus.getFiles({
  ids: [result.blobId],
});
const data = await submissionFile.json();
```

### 2.4 Seal encryption layer

**Untuk private form/field**:

```ts
import { seal } from '@mysten/seal';

const sealClient = client.$extend(seal({
  serverConfigs: [
    { objectId: '0x...keyserver1', weight: 1 },
    { objectId: '0x...keyserver2', weight: 1 },
    { objectId: '0x...keyserver3', weight: 1 },
  ],
}));

// Encrypt sebelum upload ke Walrus
const { encryptedObject } = await sealClient.seal.encrypt({
  threshold: 2,
  packageId: '0x...catat_package_id',
  id: formObjectId,                    // ID = form_id, akses dicek via seal_approve_owner
  data: encoder.encode(JSON.stringify(submissionData)),
});

// `encryptedObject` ini yang diupload ke Walrus (bukan plaintext)
```

**Decrypt oleh admin**:

```ts
import { SessionKey } from '@mysten/seal';

const sessionKey = await SessionKey.create({
  address: adminAddress,
  packageId: '0x...catat_package_id',
  ttlMin: 30,
  signer: adminWallet,
});

// Untuk tiap submission encrypted
const encryptedBytes = await client.walrus.readBlob({ blobId: submissionBlobId });
const plaintext = await sealClient.seal.decrypt({
  data: encryptedBytes,
  sessionKey,
  txBytes: /* tx yang call seal_approve_owner */,
});
```

### 2.5 Wallet integration (`@mysten/dapp-kit`)

```tsx
// Provider wrapper di App.tsx
<SuiClientProvider networks={networks} defaultNetwork="testnet">
  <WalletProvider autoConnect>
    <App />
  </WalletProvider>
</SuiClientProvider>

// Di komponen:
const account = useCurrentAccount();
const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
```

Wallet support: Sui Wallet, Suiet, Surf, Phantom (Sui mode).

### 2.6 Hosting: Walrus Sites

Build:
```bash
npm run build              # Vite static output ke ./dist
site-builder --context=testnet deploy ./dist --epochs 12
```

Map ke SuiNS domain:
- Beli `catat.sui` di [testnet.suins.io](https://testnet.suins.io)
- Map ke site object_id
- Akses via `catat.wal.app`

**Catatan dynamic routing**: Walrus Sites adalah static hosting. Untuk route `/f/:formId`, kita pakai client-side routing (React Router) + fallback semua path ke `index.html` (Walrus Sites support 404 fallback ke index).

## 3. Data model

### 3.1 Form schema (JSON)

Disimpan sebagai Walrus blob, divalidasi dengan zod.

```json
{
  "version": "1.0",
  "id": "draft_abc123",
  "title": "Walrus Bug Report",
  "description": "Help us improve Walrus by reporting bugs you encounter.",
  "banner_blob_id": "blob_xyz...",
  "settings": {
    "is_private": false,
    "submit_button_label": "Submit Bug",
    "success_message": "Thanks! We'll triage within 48 hours.",
    "max_submissions_per_wallet": 1,
    "deadline_epoch": null
  },
  "fields": [
    {
      "id": "f_title",
      "type": "short_text",
      "label": "Bug title",
      "required": true,
      "placeholder": "Short summary"
    },
    {
      "id": "f_severity",
      "type": "dropdown",
      "label": "Severity",
      "required": true,
      "options": ["Low", "Medium", "High", "Critical"]
    },
    {
      "id": "f_description",
      "type": "rich_text",
      "label": "Description",
      "required": true
    },
    {
      "id": "f_screenshot",
      "type": "image_upload",
      "label": "Screenshots",
      "required": false,
      "max_files": 5
    },
    {
      "id": "f_email",
      "type": "email",
      "label": "Contact email (optional)",
      "required": false,
      "encrypted": true   // ← per-field encryption via Seal
    },
    {
      "id": "f_repro_url",
      "type": "url",
      "label": "Repro link",
      "required": false
    },
    {
      "id": "f_rating",
      "type": "star_rating",
      "label": "How blocking is this?",
      "required": false,
      "scale": 5
    }
  ]
}
```

### 3.2 Submission JSON

```json
{
  "version": "1.0",
  "form_id": "0x...form_object_id",
  "form_schema_blob_id": "blob_...",
  "submitted_at_ms": 1715000000000,
  "submitter": "0x...wallet_address_or_anonymous",
  "values": {
    "f_title": "Cannot upload blob > 100MB",
    "f_severity": "High",
    "f_description": "<p>When I try to...</p>",
    "f_screenshot": ["screenshot-1.png", "screenshot-2.png"],
    "f_email": { "encrypted": true, "ciphertext": "..." },
    "f_repro_url": "https://...",
    "f_rating": 4
  }
}
```

Attachment (`screenshot-1.png` dst) ada di Quilt yang sama, identifier-nya cocok dengan reference di `values`.

### 3.3 On-chain Form object (Sui)

```
Form {
  id: 0xabc...
  owner: 0xdef...
  schema_blob_id: "blob_..."
  submission_blob_ids: ["blob_1", "blob_2", ...]
  is_private: false
  token_gate: None
  deadline_epoch: None
  accept_submissions: true
}
```

## 4. User flows

### Flow A: Create form

```
1. User connect Sui wallet
2. Pilih template (Bug Report / Feature Request / blank)
3. Edit di Form Builder UI
4. Click "Publish":
   a. Validate schema (zod)
   b. Upload schema JSON ke Walrus (writeBlob, deletable: false, epochs: 26 ≈ 1 bulan)
   c. Sign Sui tx: create_form(schema_blob_id, is_private)
   d. Tx confirmed → form_object_id ditampilkan
5. Tampilkan share link: catat.wal.app/f/<form_object_id>
```

### Flow B: Submit form (public)

```
1. Respondent buka /f/<form_id>
2. Frontend baca Form object dari Sui RPC
3. Frontend baca schema blob dari Walrus
4. Render form runner
5. User isi & click Submit:
   a. (Opsional) Connect wallet untuk attribution
   b. Compose submission JSON
   c. Upload semua attachments + submission JSON sebagai 1 Quilt (writeFiles)
   d. Sign Sui tx: submit(form, blob_id)
   e. Show success
```

### Flow C: Submit form (private/encrypted)

```
1. (sama 1–4)
5. User isi & click Submit:
   a. Compose submission JSON
   b. seal.encrypt({ id: form_id, data: submissionJson, threshold: 2 })
   c. Upload encrypted ciphertext + (attachment juga di-encrypt secara terpisah ATAU dimasukkan dalam ciphertext yang sama jika kecil)
   d. Sign Sui tx: submit(form, blob_id)
   e. Show success
```

### Flow D: Admin review

```
1. Admin buka /a/<form_id> dan connect wallet
2. Verifikasi: account == form.owner (kalau bukan, redirect)
3. Frontend baca submission_blob_ids dari Form object
4. Untuk tiap blob_id:
   a. Fetch blob dari Walrus (parallel, batched)
   b. Kalau encrypted: decrypt via SessionKey + seal_approve_owner tx
   c. Parse JSON → tampilkan di tabel
5. Admin filter/sort/tag/export CSV
```

### Flow E: Public stats

```
1. User buka /p/<form_id>
2. Frontend baca Form object → ada `submission_blob_ids.length`
3. Tampilkan: total submission, last submitted at, deadline
4. (Opsional, butuh public summary blob): aggregate stats per-field
```

### Flow F: Token-gated submit

```
1. Form creator set token_gate = 0x...PackageOrCoinAddress
2. Saat respondent submit, frontend cek:
   - Apakah wallet hold Coin/Object dari address itu?
3. Sui RPC query → enforce client-side
4. Move package juga validasi server-side di submit() kalau perlu
```

## 5. Tech stack rationale (decisions log)

| Pilihan | Alternatif yang ditolak | Alasan |
|---|---|---|
| **Vite + React** (bukan Next.js) | Next.js App Router | Walrus Sites = static hosting; SSR/Server Actions tidak diperlukan; Vite lebih ringan & cepat HMR |
| **Tailwind + shadcn/ui** | Material UI, Mantine | Cepat dibuat, taste lebih premium, copy-paste model bukan dependency hell |
| **Custom form runtime** | SurveyJS Form Library (MIT) | SurveyJS punya overhead 200KB+ dan UX-nya generik; custom runtime kecil & Walrus-native |
| **react-hook-form + zod** | Formik | Lebih ringan, performa lebih baik, dan zod bisa share schema antara runtime & validation |
| **Single Move package** | Multi-module dari awal | YAGNI; mulai 1 modul `form`, split kalau perlu |
| **Quilt mandatory** | Per-submission blob terpisah | 100× lebih murah untuk small file; juga group attachment + JSON dalam 1 unit |
| **Upload Relay opsional** | Wajibkan respondent punya WAL | Mass adoption butuh form creator yang bayar; Relay mengaktifkan ini |
| **Threshold 2-of-3 Seal** | 1-of-1 (no threshold) | Threshold = recovery jika 1 server down; testnet lebih reliable |

## 6. Cost model (rough estimate)

> Akan divalidasi setelah spike awal. Semua angka di sini estimasi.

### Per form (creator-side, one-time)

| Item | Estimasi |
|---|---|
| Schema blob (~5 KB, 26 epochs) | < 0.001 WAL |
| Sui gas `create_form` | ~0.01 SUI |
| **Total per form publish** | **< 0.02 SUI + < 0.001 WAL** |

### Per submission (respondent-side OR creator via Relay)

| Item | Estimasi (no attachment) | Estimasi (with 2 screenshots ~500KB total) |
|---|---|---|
| Quilt blob (12 epochs) | ~0.0001 WAL | ~0.005 WAL |
| Sui gas `submit` | ~0.005 SUI | ~0.005 SUI |
| **Total per submission** | **< 0.01 SUI + minim WAL** | **< 0.01 SUI + < 0.01 WAL** |

### Hosting (frontend Walrus Site)

| Item | Estimasi |
|---|---|
| Build artifact ~2-5 MB, 26 epochs (~1 bulan) | < 0.05 WAL |
| Update site (per deploy) | < 0.05 WAL |

**Order of magnitude**: untuk demo dengan 1 form + 100 submission + frontend hosting = **< $1 USD ekuivalen**.

## 7. Security model

| Asset | Threat | Mitigasi |
|---|---|---|
| Form ownership | Pihak lain klaim form-nya | Sui object ownership (cryptographic) |
| Submission integrity | Submission diubah/dihapus | Walrus blob immutable; on-chain blob_id tidak bisa diganti |
| Submission privacy (private form) | Pihak lain baca isi private form | Seal threshold encryption; key server tidak punya plaintext |
| Submission privacy (private field) | Field email di-leak | Seal per-field encryption |
| Spam | Bot massal submit | Wallet signature required; rate-limit per-wallet via on-chain check |
| DoS form runner | Submission palsu spam | Token-gate atau wallet signature |
| Admin private key compromise | Attacker decrypt semua submission | Cannot mitigate — same as Web2 admin password compromise; user education |
| Walrus storage node censoring | Storage node refuse store/serve | Walrus replicates ke banyak node; retry ke node lain |
| Frontend tampered | Site di-MITM | Walrus Sites pakai object_id yang content-addressed; user bisa verify build hash |

**Threat NOT addressed (acknowledged)**:
- Sybil attack (1 user pakai banyak wallet) — sebagian bisa dikurangi via token-gating
- Side-channel via tx pattern (analyze submission timing) — di luar scope
- Quantum break Seal IBE — di luar scope, sama dengan banyak crypto

## 8. Performance & scalability

| Metric | Target | Strategy |
|---|---|---|
| Time-to-first-form-render | < 2s | Vite code-splitting, prefetch schema blob |
| Submission flow (no attachment) | < 10s end-to-end | Pre-encode in background, Quilt, Upload Relay |
| Submission flow (with 5 screenshots) | < 30s | Parallel encode/upload, progress UI |
| Admin load 100 submissions | < 5s initial, lazy detail | Parallel blob fetch, virtual table |
| Concurrent submissions | Limited by Sui throughput (~1000 TPS testnet) | Aggregator can batch, but YAGNI |

## 9. Project structure (planned)

```
catat/
├── CLAUDE.md
├── README.md                    # public-facing
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md          (this file)
│   └── COMPETITIVE-LANDSCAPE.md
├── packages/
│   ├── web/                     # Vite + React frontend
│   │   ├── CLAUDE.md
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── routes/          # /, /b, /f, /a, /embed, /p
│   │   │   ├── builder/         # form builder UI
│   │   │   ├── runner/          # form renderer
│   │   │   ├── admin/           # dashboard
│   │   │   ├── lib/
│   │   │   │   ├── walrus.ts    # SDK wrapper
│   │   │   │   ├── seal.ts      # encryption helpers
│   │   │   │   ├── sui.ts       # contract calls
│   │   │   │   └── schema.ts    # zod schemas for form definition
│   │   │   ├── components/      # shadcn-based UI primitives
│   │   │   └── hooks/
│   │   ├── public/
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   └── contracts/               # Move package
│       ├── CLAUDE.md
│       ├── Move.toml
│       ├── sources/
│       │   └── form.move
│       └── tests/
│           └── form_tests.move
├── scripts/
│   ├── deploy-contract.sh
│   ├── deploy-site.sh           # walrus site-builder wrapper
│   └── seed-submission.ts       # for testing
└── package.json                 # workspace root
```

Monorepo via `npm workspaces` (no Turbo for simplicity).

## 10. Open questions (to validate during spike)

1. **Quilt minimum size** — bisakah Quilt menyimpan 1 file saja? (Kalau tidak, butuh batching strategy)
2. ✅ **Walrus Sites SPA fallback** — RESOLVED: pakai `ws-resources.json` dengan `routes: { "/f/*": "/index.html", "/a/*": "/index.html", "/b/*": "/index.html", "/embed/*": "/index.html", "/p/*": "/index.html" }`. Constraint: wildcard `*` hanya boleh di akhir path. Lihat `spike/notes/walrus-sites-spa.md` untuk detail.
3. **Seal SDK browser-friendly** — apakah ada WASM dependency seperti Walrus SDK? (perhatikan vite config)
4. **SessionKey TTL** — berapa lama sebelum admin harus re-sign? (UX implication)
5. **Sui testnet faucet WAL** — masih jalan? Berapa rate limit?
6. **Move version** — Move 2024 atau 2026 syntax? (cek `Move.toml` examples terbaru)
7. **Form draft persistence** — local storage cukup atau perlu sync ke Walrus juga? (MVP: local cukup)

---

**Next**: lihat [`COMPETITIVE-LANDSCAPE.md`](COMPETITIVE-LANDSCAPE.md) untuk analisis kompetitor & posisi kita.
