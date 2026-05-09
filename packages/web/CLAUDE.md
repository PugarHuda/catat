# packages/web — catat frontend

Vite 6 + React 19 + TS strict + Tailwind v4 + shadcn-ready.

## Status

Prototype phase — Form Builder surface saja, hardcoded "Bug Report" template. Tidak ada Walrus / Sui / wallet integration. Pure UI untuk validasi feel.

## What's here

```
src/
├── App.tsx                    # bootstrap, render BuilderSurface
├── main.tsx                   # ReactDOM root
├── index.css                  # Tailwind v4 import + theme tokens
├── lib/
│   └── utils.ts               # cn() helper
└── builder/                   # Form Builder feature
    ├── BuilderSurface.tsx     # state owner, top bar, canvas
    ├── FieldRow.tsx           # one editable field row + preview
    ├── SlashMenu.tsx          # /-triggered field type picker
    ├── fieldMeta.ts           # field type registry (icon, label, group)
    ├── templates.ts           # starter form templates
    └── types.ts               # Field, FormSchema types
```

## UX manifesto

| Aturan | Praktik konkret |
|---|---|
| **Keyboard-first** | `/` opens slash menu, `↑↓` nav, `↵` confirm, `esc` close |
| **Inline edit** | Labels & descriptions edit in place — no modal |
| **Web3 fields = first-class** | `🔒 Encrypted` toggle dan `Wallet address` muncul di slash menu yang sama dengan field standar, bukan di "advanced settings" |
| **Optimistic UI** | State berubah instant; sync ke chain di background (nanti) |
| **Mono untuk technical strings** | `blob_id`, `0x...`, hash — selalu font-mono dengan opacity-70 |
| **Motion budget** | 150–200ms ease-out untuk entrance; tidak ada parallax/spring berat |
| **Density** | Linear-style: padat tapi disiplin tipografi tinggi |

## Path aliases

- `@/` → `./src/`

## Run

```bash
# dari root
npm install
npm run web:dev

# atau dari packages/web
npm install
npm run dev
```

Default port Vite: `http://localhost:5173`.

## Stack decisions

| Pilihan | Alasan |
|---|---|
| **Vite 6** | Static SPA, build cepat, kompatibel Walrus Sites deploy |
| **React 19** | Latest stable, default action API kalau perlu nanti |
| **Tailwind v4** | No config file, theme via `@theme inline` di CSS, plugin Vite native |
| **shadcn baseColor: zinc** | Modern slightly-cool gray, kompatibel dengan accent arctic blue nanti |
| **Lucide icons** | shadcn default, konsisten weight, tree-shakeable |
| **No Radix yet** | Slash menu cukup pakai custom popover untuk prototype; add Radix saat butuh a11y produksi |

## Roadmap surface

- [x] **Builder** (slash menu, field types, inline edit, reorder, encrypt toggle)
- [x] **Form Runner** — render schema sebagai input form, kumpulkan values, generate submission JSON
- [x] **Submission Preview** — tampilkan JSON yang akan di-upload, dengan ciphertext placeholder untuk encrypted field
- [ ] Admin Dashboard (`/a/:id`) — Linear-style tabel triage
- [ ] Public stats (`/p/:id`) — verifiable count + distribution
- [ ] Embeddable form (`/embed/:id`)
- [ ] Wallet integration (`@mysten/dapp-kit`)
- [ ] Walrus integration (`@mysten/walrus` + Quilt) — replace ciphertext placeholder dengan real upload
- [ ] Seal integration (`@mysten/seal`) untuk encrypted field
- [ ] React Router 7 untuk multi-route
- [ ] Landing page (`/`)

## Deploy

### Vercel (cepat, untuk preview saat dev)

```bash
cd packages/web
npx vercel              # deploy preview, prompts for login
npx vercel --prod       # promote ke production URL
```

`vercel.json` di package ini sudah set:
- Framework: vite (auto-detect)
- SPA fallback: semua path → `/index.html` (untuk client-side routing)

Vercel akan deploy dari `packages/web/` (root subdirectory). `npm install` runs di package ini, build via `npm run build`.

### Walrus Sites (untuk hackathon submission)

Untuk full-on-Walrus deploy (cerita "frontend itself di-host di Walrus"):

```bash
cd packages/web
npm run build
site-builder --context=testnet deploy ./dist --epochs 26
```

Prereq: Sui CLI + walrus + site-builder CLI installed, ada WAL token (~1 WAL).
`public/ws-resources.json` sudah set route fallback `/f/*`, `/a/*`, dll → `/index.html`.

## Adding shadcn components (saat butuh)

```bash
cd packages/web
npx shadcn@latest add button input dialog popover sheet table command
```

`components.json` sudah dikonfigurasi: `style: new-york`, `baseColor: zinc`, alias `@/components/ui`.
