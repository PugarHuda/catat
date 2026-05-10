# Handoff: Catat — Walrus-native feedback & form platform

## Overview
**Catat** is a feedback/form platform built for Walrus Sessions 2 ($1,500 prize pool). It lets anyone create custom forms (bug reports, feature requests, surveys, NPS, airdrop signups), share via a link, and have every submission stored on **Walrus**, indexed via a **Sui** event, and (optionally) encrypted with **Seal** before it leaves the respondent's browser. A private admin dashboard handles review, filtering, decryption, notes, priority, status, and export.

The aesthetic is **paper & sketch** — a hand-drawn notebook style (cream paper, ruled lines, red margin, Caveat handwriting, Special Elite typewriter labels, post-it callouts, washi-tape strips, hand-drawn underlines and strikes). The system reads as warm and human even though the backend is hard-crypto.

## About the Design Files
The files in this bundle are **design references created in HTML** — clickable prototypes that show intended look, copy, and interaction. They are **not production code to copy directly**. The task is to **recreate these HTML designs in the target codebase's existing environment** (React, Next.js, SwiftUI, etc.) using its established patterns and libraries. If no environment exists yet, pick the most appropriate framework (a Next.js + Tailwind + shadcn/ui stack with `@mysten/sui` + `@mysten/walrus` + `@mysten/seal` is a strong default for a Sui dApp) and implement the designs there.

The HTML uses inline event handlers, ad-hoc DOM scripts, and a `tweaks-global.js` localStorage palette switcher — none of these patterns should ship. They exist purely so each prototype can demo state changes inside a single static file.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, and interactions are settled. Recreate pixel-perfectly using the codebase's component library; use the design tokens and component recipes below as the source of truth.

## Screens / Views

All screens share the global chrome from `paper.css`:

- **Sticky nav** (`.nav` + `.nav-row`) — brand glyph (rotated dark square w/ red drop-shadow + check icon), brand wordmark in `Caveat`, link list (`Home / Templates / Demo / Docs / Verify`), CTAs (`Sign in / Start free`).
- **Body background** — cream `#f4ecd6` with two SVG noise filters and two radial-gradient stains, plus a subtle linear-gradient from `#f6eed8` to `#e2d6b1`. This gives the paper texture; keep it as a single shared CSS layer.
- **Footer** (`.foot`) — dashed top border, copyright + signature line "sketched on real paper, served from Walrus."
- **Floating Tweaks panel** (palette switcher, 6 swatches) — *demo-only*, do not ship.

### 1. `catat.html` — Landing
**Purpose:** marketing front page; convert to sign-up or demo.
**Layout:** 1240px wrap, hero grid `1.05fr .95fr`, then features grid, then how-it-works strip, then closing CTA card.
**Key components:**
- Eyebrow chip row (rotated post-its: "feedback platform", "🔒 sealed by default", "≡ on walrus").
- `<h1 class="title">` — `Caveat 700`, clamp(44–132px), with `.underline` (yellow highlighter blob via pseudo-element + irregular border-radius), `.marker` (red italic), and `.strike` (pencil-grey 0.7em with a hand-drawn strikethrough).
- Hero illustration: a stack of three rotated paper cards (form preview + sealed field row + proof receipt), drawn entirely in HTML/CSS — recreate as React components.
- Features 3-column grid (5 cards): each is a notepad block with a sketched icon (use Lucide icons styled with `stroke-width: 2.4` to match).
- "How it works" — 4 numbered tabs across one strip, dashed connectors.
- CTA card: large rotated post-it with "Start free →" button.

### 2. `f.html` — Public respondent form
**Purpose:** the link-shareable form. Renders all 10 supported field types.
**Layout:** thin top bar (no full nav), 780px sheet, full-bleed paper texture with red margin line and tape strip at top.
**Field types (in order):** short text, dropdown, single-choice radio chips, multi-select chips, rich-text textarea (with B/I/U/list/quote/code toolbar), star rating (1–5), NPS slider 0–10, URL with `https://` prefix, file/screenshot drop zone (sealed), text contact (sealed).
**Behavior:** progress bar updates as fields are answered. Submit redirects to `receipt.html`. Sealed fields show a dashed red left border + "🔒 sealed" pill.

### 3. `receipt.html` — Submission receipt
**Purpose:** thank-you / proof page after submit.
**Layout:** 760px centered, big rotated check seal, headline, then receipt sheet with key/value rows (tx hash, blob ID, quilt children, epochs, gas, signature, sha-256, status), sealed-field summary callout, timeline, QR proof tile (CSS grid 8×8 squares, deterministic from the tx hash), action row (View public proof / Print / Download proof JSON / Copy verify URL / Submit another), "What happens next" rotated card.

### 4. `demo.html` — In-app demo (Builder · Submit · Admin · Public)
4 tabs in one page; each tab maps to a real route in production:
- **Builder** → `/forms/new` and `/forms/:id/edit`. Three-column: field palette (left), canvas with question cards (center), per-field settings (right). Drag-drop ordering, per-field "🔒 seal" toggle.
- **Submit** → identical UX to `f.html` but with builder context shown (preview mode).
- **Admin** → `/forms/:id/inbox`. Filter row (status, priority, tags, search), table with status pills, priority chips, sealed indicator, click row → `submission.html`.
- **Public** → `/forms/:id`. Public stats page: italic 517 hero number, sparkline chart, 4 stat tiles, recent submissions feed.

### 5. `submission.html` — Admin submission detail
**Purpose:** review one submission.
**Layout:** 2-col `1.4fr 1fr`. Main column: header with title/severity/status pills, prev/next/pin/copy actions, Answers block (each Q rendered with type-appropriate chip/box/url/stars/body/sealed-card), Activity timeline with dashed vertical line and red/green/blue colored bullets. Sidebar: Review card (priority chips, status set, tags with `+ add`, assignee with avatar, link-out buttons, Save w/ wallet), Notes card (3 sample threaded notes + new note input), Proof card (key/value lines + Sui/Walrus link buttons), small "privacy" post-it.
**Behavior:** clicking a sealed-card's `🔓 decrypt` flips it to revealed state (green border, plaintext shown, attachment unfolds an inline video card if applicable).

### 6. `export.html` — Export builder
**Purpose:** build a download.
**Layout:** main column has 7 numbered sections — Source (form picker), Format (CSV/JSON Lines/Parquet/Walrus blob — radio cards), Date range (preset chips + custom from/to), Filters (priority/status/tags/verified/submitter chip groups, AND-between rows, OR-within), Columns (3-col checkbox grid with `always` lock chip on required ones), Sealed handling (4 radio rows: keep ciphertext / hash+len / decrypt to plaintext / omit), Recent exports table. Sticky right sidebar: live row count (red Caveat 64px), file size, sha-256, format, sealed mode, terminal-style preview (dark `#211b14` bg, JetBrains Mono, syntax-tinted), big red "Sign & download" button + schedule weekly button.

### 7. `templates.html` — Template gallery
**Purpose:** library of pre-wired form recipes.
**Layout:** search bar + category chips (`forms / feedback / dev / event / hr–nps / airdrop / bug report`), then 12-column grid of template cards (`grid-column: span 4`, slight rotation per card). Each card: emoji icon, tag chips, title (Caveat 28px), description, starter chipline (which fields are sealed/public), footer with usage count + "use →" CTA.

### 8. `pricing.html` — Pricing
3 tier cards (Free, Pro, Studio) styled as stacked notepad sheets, slight rotation alternation; tape strip at top of featured card; checklist with hand-drawn red checkmarks; FAQ accordion below.

### 9. `docs.html` — Documentation
2-col: ToC (left) + article (right). Article uses notebook ruled background, in-line code in `JetBrains Mono` chips with paper-edge bg, callout boxes (`.postit`, `.postit-pink`, `.postit-mint`).

### 10. `verify.html` — Public proof verifier
**Purpose:** anyone pastes a tx hash or blob id, the page recomputes the receipt without trusting catat. Big input row at top, then 4-step verification stepper (each step has its own paper card showing the on-chain check passing), final green "Receipt valid ✓" stamp.

### 11. `analytics.html` — Analytics
Form metrics page: KPI tiles (total / 7d / completion / NPS), squiggle line chart (SVG path, `stroke-dasharray` for sketch effect, hand-drawn dots), bar chart of severity distribution, table of top tags. All charts hand-drawn — no chart library.

### 12. `signin.html` — Wallet connect
Single centered card. Connect-wallet primary button (Sui logo + "Continue with Sui Wallet"), secondary email + magic-link option, footnote about Seal keys being derived from wallet.

### 13. `account.html` — Account settings
Tabbed settings: Profile / Seal keys / Webhooks / Storage / Billing. Seal keys panel shows the 2-of-3 threshold setup, key fingerprints in monospace, "Rotate" button.

## Interactions & Behavior

| Surface | Interaction |
|---|---|
| Builder canvas | drag-and-drop field reorder; click field → settings open in right panel; toggle "🔒 seal" persists per-field flag |
| Public form | progress bar live-updates as fields are answered (count / total) |
| Submit | client-side encrypts sealed fields with Seal *before* `submit_form` move call; shows 4-step pipeline (Seal → Quilt → Walrus write → Sui event) with each step animating to ✓ |
| Receipt | QR tile encodes `verify.html?tx={tx}` — re-derive deterministically from tx hash so anyone can recompute |
| Admin inbox | filter chips toggle; row click → submission detail; bulk-select via checkboxes |
| Submission detail | `🔓 decrypt` opens wallet for signature, then reveals plaintext (sealed card flips green); decryption is logged to the Activity timeline; notes post immediately (private, not on-chain); priority/status/tags Save signs the change with the wallet |
| Export | format selection updates preview pane and file size estimate; sealed handling option changes how sealed columns appear in the preview |
| Verify | paste tx hash → fetches Sui event + Walrus blob → recomputes sha-256 → shows pass/fail per step |

**Animations / transitions:** transform on hover (`translate(-1px,-1px)` + drop shadow growing) on every interactive card/button; `.18s ease-out` pop-in on the Tweaks panel; `transform: rotate()` on most cards (small angles, ±0.5–3°) for the hand-placed feel. Don't over-rotate — too much rotation reads as gimmicky.

**Loading states:** sketch-style spinner — a hand-drawn dashed ring rotating at 1.4s linear infinite. Skeletons use `repeating-linear-gradient` of paper-edge color.

**Error states:** red marker font, red dashed left border on the affected control, "✗" hand-drawn icon, post-it style toast in `--postit-pink`.

**Form validation:** inline below field, `Caveat 18px` in `--marker-red`, with a small ✗ glyph.

**Responsive:** hero grid collapses below 1020px; Builder/Submission detail collapse to single column below 1020px; nav links hide below 880px (replace with hamburger → drawer).

## State Management
For a Next.js + zustand sketch:
- **`useFormBuilder`** — current form draft (questions[], fieldSettings, sealConfig). Persist to Walrus on save.
- **`useSubmissions`** — paginated list per form id. Filter/sort state lives here.
- **`useDecryptedCache`** — per-submission, per-field decrypted plaintexts (in-memory only, never persisted).
- **`useWallet`** — wraps `@mysten/dapp-kit`'s `ConnectButton` + signing helpers. Required for submit, decrypt, save, export.
- **`useToasts`** — small post-it toast queue.

**Data fetching:** every list view reads from a Sui index of `SubmissionAdded` events; bodies hydrate lazily by Walrus blob id on row expand. SWR/React Query both fine.

**On-chain layer:** Move modules `forms::form` (object), `forms::submission` (object) — fields are content-addressed (Walrus blob id) + small metadata (timestamp, submitter, sealed-key index). One Move call per submission write.

**Walrus layer:** every submission body + each attachment is a Quilt child of one Walrus blob; one atomic write per submission. 12 epochs default lifetime.

**Seal layer:** per-form Seal policy (2-of-3 threshold by default). Plaintext never leaves the browser; ciphertexts are part of the Walrus body. Decryption requires wallet signature against the form's policy object.

## Design Tokens

All defined in `paper.css` `:root`. Use these verbatim.

**Paper / ink**
```
--paper:        #f4ecd6   /* page background */
--paper-2:      #fbf5dc   /* card background */
--paper-edge:   #e9dfc1
--paper-dark:   #e2d6b1
--ink:          #211b14   /* main text + borders */
--ink-soft:     #3a3128
--pencil:       #6b665e   /* meta text, captions */
--pencil-soft:  #9c958a
--line:         #cdbf94   /* dashed dividers */
--line-soft:    #dccfa8
--rule:         #a3c4d4   /* notebook ruled lines (blue) */
--margin:       #d68a8a   /* red left margin line */
```

**Markers / accents**
```
--marker-red:    #c0392b  /* primary CTA + headline marker */
--marker-blue:   #2c5282
--marker-green:  #2f7a5b
--marker-purple: #6b3a8c
--highlight:     #ffea7a  /* yellow underline blob */
```

**Post-its**
```
--postit:        #fff3a6  /* yellow */
--postit-pink:   #ffd1d9
--postit-mint:   #c7e9d0
--postit-blue:   #cfe2f7
--postit-purple: #e3d4f0
--tape:          rgba(255,230,140,.65)
```

**Typography**
```
--hand:  "Caveat", "Patrick Hand", cursive   /* headlines, big numbers */
--hand2: "Kalam", "Patrick Hand", cursive    /* secondary headings */
--type:  "Special Elite", "Courier New", monospace  /* labels, eyebrows, ALL-CAPS meta */
--body:  "Patrick Hand", "Kalam", system-ui, sans-serif  /* paragraph, form body */
/* + JetBrains Mono for code/hex/hashes */
```
**Type scale (rough):**
- H1 hero: clamp(44, 7.4vw, 132)px / line 1.02 / Caveat 700
- H2 section: 42–54px / Caveat 700
- H3 card: 24–30px / Caveat 700
- Body: 18px / Patrick Hand / line 1.55
- Eyebrow / labels: 10–11px / Special Elite / letter-spacing .1em / uppercase
- Mono: 11–14px / JetBrains Mono / used for hex, blob ids, JSON

**Spacing scale:** 4 / 6 / 8 / 10 / 12 / 14 / 18 / 22 / 26 / 30 / 36 / 48 / 60 / 80 / 100 (px).

**Radius:** 4 (chip), 6 (small), 8 (card), 10 (large card), 12 (sheet), 99 (pill).

**Shadows:** the signature shadow is a flat offset, not a blur — `4–8px 4–8px 0 var(--ink)`. Hover increments to `5px 5px` or `7px 7px`. The soft shadow `--shadow` exists for the body but rarely used on chrome.

**Borders:** `1.5–2.5px solid var(--ink)` for everything; dashed `1px var(--line)` for dividers; `2px dashed` for emphatic dashed boxes.

**Rotations:** ±0.5° on most cards, ±1–3° on stronger feature elements, ±4° max on stamps and tape. Never rotate body text.

## Assets

- **Fonts:** Google Fonts — `Caveat`, `Kalam`, `Patrick Hand`, `Special Elite`, `JetBrains Mono`. Import once globally.
- **Icons:** all icons in the prototypes are inline SVG, hand-stroke style at `stroke-width: 2.4` and `stroke-linecap: round`. Prefer **Lucide** in production with the same stroke weight. Keep them monochrome inheriting `currentColor`.
- **Logos / marks:** the catat brand glyph is a rotated dark square (`8px 8px 0` red shadow, ink fill, paper-color outlined check icon). Recreate as a single React `<BrandGlyph />` component; ~30/38px sizes.
- **Imagery:** none. The aesthetic is illustrative — paper textures, post-its, tape are all CSS. No external imagery is required to ship.

## Files
The `paper.css` file is the source of truth for the design system. Each `.html` file is a standalone screen using that stylesheet plus per-screen `<style>` blocks for layout-specific rules.

```
catat.html       — landing
f.html           — public respondent form (all field types)
receipt.html     — post-submit proof receipt
demo.html        — in-app demo (Builder · Submit · Admin · Public)
submission.html  — admin submission detail (notes, decrypt, activity)
templates.html   — template gallery
pricing.html     — pricing tiers
docs.html        — documentation
verify.html      — public proof verifier
analytics.html   — form analytics dashboard
signin.html      — wallet connect
account.html     — account settings (profile · seal keys · webhooks · billing)
export.html      — export builder
paper.css        — shared design system + base layout
tweaks-global.js — demo-only palette switcher (DO NOT SHIP)
```

## Walrus Sessions 2 — judging-criteria mapping

| Criterion | Where it lives |
|---|---|
| **Functionality (end-to-end)** | `f.html` (submit) → `receipt.html` (proof) → `submission.html` (review) → `export.html` (export). Plus `demo.html` builder for creation. |
| **Walrus integration** | Receipt + submission detail show explicit blob ids, Quilt children count, epoch lifetime, and a deterministic `verify.html` page that re-fetches blobs without trusting catat. |
| **UX/UI** | Hand-drawn paper aesthetic; every state (idle / hover / active / sealed / decrypted / error) has a distinct visual treatment. |
| **Bonus — admin dashboard** | `demo.html` Admin tab + `submission.html` (notes, priority, status, tags, assignee, activity timeline) + `export.html` (filters, columns, sealed handling, recent exports). |
| **Extra credit — Seal** | Sealed field marker (🔒) on the form builder, public form, receipt, admin detail; client-side decrypt flow on submission detail; Seal-handling section in export builder; per-form 2-of-3 threshold setup in `account.html`. |

## Implementation hints

1. **Don't fight the rotation system.** Apply rotations on the outer wrapper, not on inner content — tilted text inside a tilted card double-rotates and looks broken.
2. **Flat shadows beat blurred shadows.** The whole identity hinges on `0 0 0 var(--ink)` style offsets. Don't let the design system's default elevation tokens bleed in.
3. **Type the borders.** Mixing 1px and 2px borders kills the hand-drawn feel — pick a single weight per scale (chip 1.5, card 2, hero card 2.5) and stick to it.
4. **Sealed fields are a UX primitive, not a flag.** They get their own dashed red left border, a 🔒 pill, and the contents are physically masked until decryption. Build a `<SealedField>` component once and reuse.
5. **Verify-first.** Every public-facing page that shows a tx or blob should link to the public `verify.html?tx=…` so the trust story is always one click away.
6. **Treat `tweaks-global.js` as throwaway.** It exists to demo palette swaps. Production should expose a single `data-palette="paper|walrus|ocean|ink|forest|sunset"` attr on `<html>` and switch CSS custom-property layers.
