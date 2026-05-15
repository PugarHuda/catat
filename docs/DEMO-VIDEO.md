# Demo video — catat × Walrus Sessions Session 2

> **Brief constraints**: < 3 minutes, hosted on Walrus, showcase product using own tool.

## What this video must prove

Goal isn't "show every feature" — that fails at 3 min. Goal: **make the judge see proof** that catat's claims are real on-chain.

**4 must-show moments**:
1. **Live counter** on landing — pulled from `Form.submission_blob_ids.length` via Sui RPC
2. **3-sig submit flow** — Walrus reserve → certify → Sui submit — landing on success modal with real blob_id + tx_hash + form_id (each linking to Walruscan/Suiscan)
3. **Decrypt sealed field** — owner clicks decrypt → wallet popup → ciphertext reveals plaintext (Seal IBE in action)
4. **Verify surface** — paste blob_id from another tab/wallet → cross-derives the receipt independently. **This is the cryptographic-proof story** in 15 seconds.

## Pre-recording checklist

- [ ] Wallet (Slush or Suiet) on **Sui Testnet** with ≥ 0.05 SUI + ≥ 0.1 WAL
- [ ] **Two browser profiles** open (or one normal + one incognito) — one wallet for owner, one for respondent
- [ ] Browser maximized, zoom 100%, no sidebar/extension popup visible
- [ ] All other tabs closed, no notifications mid-recording
- [ ] Mic test (if voiceover); ambient noise off
- [ ] Recording tool: **OBS** (best quality) or **Loom** (fastest)
- [ ] Output: 1920×1080 @ 30fps, mp4 (H.264 + AAC)
- [ ] Optional: cursor highlighter (helps viewer track clicks)

## 3-minute script (timestamped)

### 00:00–00:12 — Hook (12s)

**Visual**: Landing page hero at https://catat-walrus.vercel.app

**Voiceover**:
> "Every form tool today asks you to trust them with your data. catat doesn't — every submission is a Walrus blob, every form is a Sui object, every sealed field is encrypted before it leaves the browser. Let me show you."

**Action**:
- Slow pan over hero text "Forms with cryptographic proof"
- Cursor pauses 2s on the live submission counter (pulled from chain)
- Quick scroll to the 3 differentiator cards, no narration

### 00:12–00:25 — Open the docs (13s)

**Visual**: Click "Docs ↗" nav link → in-app DocsView opens

**Voiceover**:
> "Architecture is documented in-app — three Walrus blobs, one Move object, no backend. Hosted on Walrus Sites itself, so the dashboard you're reading IS what we're describing."

**Action**:
- Click Docs in the top nav
- Show the sidebar with 11 pages
- Click "Architecture" → 1s pan over the article
- Quick scroll to show keyList rows
- Click "catat" wordmark to return to landing

### 00:25–00:55 — Build & publish (30s)

**Visual**: "Try the demo" → Builder

**Voiceover**:
> "I'll publish a Bug Report form. Pick the template — eight fields ready, one of them sealed for the contact email. Three wallet signatures: Walrus reserve, Walrus certify, Sui create_form."

**Action**:
- Click "Try the demo →" → Builder loads with Templates gallery auto-open
- Click **Bug Report** card → canvas populates
- Quick pan: title, fields list, the 🔒 badge on contact email
- Click **Publish form** button (bottom)
- 3 wallet popups: approve all (~12s total)
- Land on success modal: green stamp "published!", share URL displayed
- Click **Copy link** → "✓ copied" feedback

### 00:55–01:35 — Submit as respondent (40s) ★ MONEY SHOT 1

**Visual**: Open new incognito window, paste share URL

**Voiceover**:
> "Now I'm a respondent — different wallet, no admin access. Fill the form, submit. Three more signatures: my submission becomes a Quilt blob bundling JSON plus any attachments."

**Action**:
- Switch to second browser profile / incognito
- Paste the share URL → catat loads in embed mode (just the form)
- Connect respondent wallet → wallet popup → approve
- Fill required fields:
  - Title: "Demo: hackathon submission"
  - Severity: High
  - Steps: "1. Open catat 2. Click Publish 3. ✨ done"
  - Contact email (sealed): "respondent@example.com"
- Click **Submit**
- 3 wallet popups (Walrus reserve → certify → Sui submit) (~10s)
- Success screen: blob_id displayed
- Click **🔍 Verify your submission** link

### 01:35–01:55 — Verify independently (20s) ★ MONEY SHOT 2

**Visual**: Verify surface opens with blob_id pre-filled

**Voiceover**:
> "Verify is no-auth — anyone can re-derive the receipt. Walrus blob exists, Sui event indexed, form schema linked. No catat servers needed."

**Action**:
- Verify surface auto-runs the lookup
- Show: ✓ Blob found, ✓ SubmissionAdded event indexed, ✓ Schema linked
- Pause 3s on the receipt
- Click the Walruscan link → external blob view briefly (~3s)
- Switch back to catat tab

### 01:55–02:25 — Owner triages (30s) ★ MONEY SHOT 3

**Visual**: Switch back to first browser → Inbox tab

**Voiceover**:
> "Back as the owner. Inbox lights up within seconds. Click into Admin — the new submission. Update status, set priority, then decrypt the sealed email — Seal threshold key servers verify ownership on-chain before releasing the key share."

**Action**:
- Switch to owner browser → Inbox tab
- Recent feed shows the new submission with headline "Demo: hackathon submission"
- Click row → Admin opens with the new submission focused
- Update Status pill: "Triaging" (~3s)
- Set Priority: "High" (~2s)
- Click **🔒 Decrypt** on contact email field
- Wallet popup (Seal session key sig) → approve
- Plaintext reveals: "respondent@example.com" (~5s linger)

### 02:25–02:45 — Multi-format export (20s)

**Visual**: Click ⬇ export dropdown

**Voiceover**:
> "Export the data — three formats, always. Markdown for reports, JSON for data scientists, CSV for spreadsheets with proper UTF-8 and CSV-injection mitigation."

**Action**:
- Click **⬇ export ▾** button → dropdown opens
- Hover over each format showing hint text (~5s)
- Click **Markdown** → file downloads
- Quick switch to file system / OS → open the .md
- Pan over the formatted report (triage table at top, per-submission sections)

### 02:45–03:00 — Outro (15s)

**Visual**: Cursor returns to catat brand mark, click → landing

**Voiceover**:
> "Open source. MIT licensed. Built on Walrus, Sui, and Seal — the stack that makes 'forms with proof' actually mean something. github.com/PugarHuda/catat."

**Action**:
- Cursor on catat wordmark → click → landing returns
- Live counter is now +1 (~2s linger)
- Cut

---

## Recording tips

- **Don't pre-record voiceover separately** unless you're polished — live narration captures natural pacing
- **Practice the click sequence 2-3× without recording** to memorize, then record clean take
- **Wallet popups are unpredictable** — be patient, don't rush them
- **Cursor smoothness matters**: pause ~0.5s before clicks so viewer's eye catches up
- **Audio**: mic close, no AC/window noise. Skip background music — let the action speak
- **If you fluff a line, keep going** — single-take usually feels more authentic
- **Capture browser viewport only**, not the whole desktop — cleaner output, smaller file

## Upload to Walrus

After editing, target ~30–50 MB demo.mp4.

### Option 1: Walrus CLI

```bash
walrus --context=testnet store demo.mp4 --epochs 26
# Returns blob_id like 5o0wfhld...
```

Use that blob_id in the submission form.

### Option 2: Upload via catat itself ⭐ (Best Feedback prize move)

This is THE narrative move — upload your demo via your own tool to dogfood publicly:

1. Open catat Builder, add a `video_upload` field (or use Bug Report's attachment field)
2. Switch to Preview, fill the form with the .mp4 attached
3. Submit → 3 wallet sigs → real Walrus blob
4. Capture the blob_id from success modal
5. Cite this blob_id in the Airtable submission

The Walruscan link from this submission **is** your demo video link.

### Option 3: walruscan.com web upload

Last-resort fallback if CLI/catat aren't an option.

## Compression hint (if file too big)

```bash
ffmpeg -i raw.mp4 -vcodec h264 -crf 28 -preset medium -acodec aac -b:a 96k demo.mp4
```

`-crf 28` = balanced. For screen recording with mostly-static UI, `-crf 30` looks fine and shrinks more.

## Submission checklist

- [ ] App live URL: https://catat-walrus.vercel.app
- [ ] Repo: https://github.com/PugarHuda/catat
- [ ] Demo video Walrus blob_id
- [ ] Walruscan link to video blob: `https://walruscan.com/testnet/blob/<blob_id>`
- [ ] Short description (≤ 200 words):

> *catat is a Walrus-native form & feedback platform. Submissions are Walrus Quilt blobs; the form schema, ownership, and access policy live in the catat::form Move package on Sui; sealed fields are encrypted via Seal IBE 2-of-3 threshold with on-chain seal_approve_owner verification. The Builder publishes forms in 3 wallet sigs (Walrus reserve → certify → Sui create_form), the Runner submits in 3 more, and the Inbox + Admin surfaces query Sui events to surface activity in real time. Multi-format export (CSV / JSON / Markdown), in-app gitbook docs (11 pages), and a public Verify surface that re-derives the receipt without trusting catat itself. Stack: Vite 6 + React 19 + TS strict + Tailwind v4 + dapp-kit + @mysten/walrus + @mysten/seal + Move 2024. Deployed on Vercel (devx, auto-deploy via GitHub Actions) and Walrus Sites testnet (full decentralization story). Open source, MIT licensed, fork-friendly.*

- [ ] At least 1 real submission via own tool ✅ (the demo recording produces this)
- [ ] Register via [Airtable](https://airtable.com/appoDAKpC74UOqoDa/shrN8UbJRdbkd5Lso)
- [ ] (Best Feedback prize) Submit feedback about Walrus dev experience via catat itself, cite the blob_id in submission

## Self-review scorecard

Watch your own video, score 1–5 on each:

| Criterion | What to check |
|---|---|
| First 5s hook | Did viewer want to keep watching? |
| Pace | Any dead air > 2s? Any rushed section? |
| On-chain proof shown | Did you SHOW Walruscan/Suiscan/Verify, or just claim? |
| Tool actually works | Did all 6 sigs land cleanly? Decrypt revealed? |
| Multi-format export visible | Markdown report shown clearly? |
| Open-source signal | MIT + GitHub mentioned in outro? |
| Audio quality | Voiceover clear? No background noise? |
| Cuts feel natural | Or jarring? |

Re-record any section scoring 1–2.
