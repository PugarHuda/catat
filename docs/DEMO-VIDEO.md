# Demo video — catat × Walrus Sessions Session 2

> **Constraint dari brief**: < 3 menit, host on Walrus, showcase product using own tool.

## Goal per shot

Tujuan video bukan "ceritakan semua fitur" — itu fail di 3 menit. Tujuan: **bikin judge melihat bukti** bahwa setiap claim landing page = real on-chain.

3 momen yang HARUS muncul jelas:
1. **Landing live counter** updating dari real Sui RPC
2. **Submit flow** dengan 3 wallet popup → success screen dengan blob_id + tx_hash explorer links
3. **Admin** menampilkan submission yang baru dibuat dengan pulsing emerald dot (read dari chain)

## Pre-recording checklist

- [ ] Wallet (Sui Wallet ext) dengan ≥ 0.05 SUI + 0.1 WAL official testnet
- [ ] Browser di-maximize, zoom 100%, no extension popup di sudut
- [ ] Tab lain di-close (clean tab bar)
- [ ] Suara mic test (kalau pakai voiceover)
- [ ] Recording tool ready: **OBS** (free, best quality) atau **Loom** (faster, web)
- [ ] Resolution: 1920×1080 (1080p)
- [ ] Frame rate: 30fps
- [ ] Output format: mp4 (H.264 codec, AAC audio)
- [ ] (Optional) Cursor highlighter — Loom default ada, OBS perlu plugin

## 3-minute script (timestamped)

### 00:00–00:15 — Hook (15s)

**Visual**: Open https://catat-walrus.vercel.app — landing page hero

**Voiceover** (atau text overlay kalau silent):
> "What if every form submission was verifiable on-chain, with private fields encrypted end-to-end? Tally and Typeform can't do this. Web3 form tools today don't either. catat does."

**Action**:
- Hover slowly over hero text "Forms with proof."
- Cursor moves down to live counter — pause 1s on the count
- Click sui testnet link briefly (shows Suiscan opens with form object)
- Back to catat tab

### 00:15–00:35 — Problem framing (20s)

**Visual**: Scroll to "Why catat" section, briefly show 3 cards

**Voiceover**:
> "Three things existing form tools can't do: own your submissions, encrypt fields granularly, and prove your submission count to anyone. catat solves all three by being native on Walrus and Sui."

**Action**:
- Slow scroll through the 3 differentiator cards
- Brief pause on each (~3s)
- Don't read every word — viewer reads themselves

### 00:35–00:50 — Setup (15s)

**Visual**: Click "Try the demo →" CTA

**Voiceover**:
> "Let's build a bug report form, submit it, and see it stored on-chain in real time."

**Action**:
- Click CTA → Builder loads (lazy load delay ~300ms is fine, looks like loading state)
- Pan over Builder UI: sticky top bar, form title, fields list

### 00:50–01:10 — Builder showcase (20s)

**Visual**: Builder, demonstrate slash menu

**Voiceover**:
> "Slash command for fields. Notice the Web3 group — wallet address and encrypted email — first-class, not hidden in advanced settings."

**Action**:
- Press `/` key → slash menu opens
- Slowly hover through field types
- Linger 2s on "Wallet address" (Web3 group, emerald `catat` badge)
- Linger 2s on "🔒 Encrypted" toggle (in field row)
- Press Esc, close menu

### 01:10–02:10 — Submit flow (60s) ★ THE MONEY SHOT

**Visual**: Click Preview tab → Runner

**Voiceover**:
> "As a respondent, I fill the form. Connect wallet. Submit goes through three signatures: Walrus reserve, Walrus certify, Sui registry."

**Action**:
1. Click **Preview** tab (~3s)
2. Click "Connect wallet" top-right → wallet popup → approve (~5s)
3. Address appears in button (mono, pulse dot) (~2s)
4. Fill in form fields:
   - Title: "Demo: catat real submission" (~3s)
   - Severity: select "High" from dropdown (~2s)
   - Description: type "This is a real on-chain submission via catat for the Walrus Sessions hackathon demo" (~8s)
5. Optional: skip rich fields, just hit minimum required
6. Click "Submit to Walrus" button (~1s)
7. Wallet popup #1 → approve "Walrus storage reservation" (~3s)
8. Wait, button shows "Sign Walrus reserve (1 of 2)" then "Uploading..." (~5s)
9. Wallet popup #2 → approve "Walrus certify" (~3s)
10. Wallet popup #3 → approve "Sui registry record" (~3s)
11. Land on success screen (~5s linger):
    - Green badge "Stored on Walrus testnet ✓"
    - Headline "Your submission is now on-chain."
    - Green box with 4 explorer links: blob_id, registry tx, form object, walrus certify tx

### 02:10–02:35 — Verify on-chain (25s)

**Visual**: Click blob_id link → Walruscan opens in new tab

**Voiceover**:
> "Anyone can verify. Click the blob_id, see it on Walruscan. Click the Form object, see submission_blob_ids vector grew by one. Permissionless audit."

**Action**:
- Click blob_id link → Walruscan opens, shows blob exists with content (~5s)
- Switch back to catat tab
- Click "form object" link → Suiscan opens, scroll to fields, show `submission_blob_ids` array with newest entry highlighted (~10s)
- Switch back to catat tab

### 02:35–02:55 — Admin closes the loop (20s)

**Visual**: Click Submissions tab

**Voiceover**:
> "Switch to admin. Your submission appears at top with the live emerald dot — read straight from chain. Mock entries below show the triage UX. Filter, status workflow, CSV export, all there."

**Action**:
- Click **Submissions** tab (~2s)
- Submission appears at top with pulsing emerald dot (~5s linger)
- Quick demo: click a status pill, change to "Triaging" (~3s)
- Click "Export CSV" — file downloads (~2s)
- Briefly show the 12 demo entries scrolling (~5s)

### 02:55–03:00 — Outro (5s)

**Visual**: Cursor goes to top-left "catat" wordmark, click → back to landing

**Voiceover**:
> "Open source. MIT licensed. Live on github.com/PugarHuda/catat."

**Action**:
- Cursor on wordmark → click → landing returns
- Brief view of landing counter (now 1 higher than at start)
- Fade or hard cut

---

## Recording tips

- **Don't pre-record voiceover separately** unless you're polished — recording with live narration captures natural pacing
- **Practice the click sequence 2-3× without recording** to memorize, then record clean take
- **Wallet popups are unpredictable timing** — be patient, don't try to rush them
- **Cursor movement matters**: smooth, not jittery. Pause ~0.5s before clicks so viewer's eye catches up
- **Audio**: mic close, ambient noise off (close window/AC). No background music — let action speak
- **If you fluff a line, don't restart** — keep going, edit later. Single-take usually feels more authentic
- **Screen capture region**: just the browser viewport, not the whole desktop. Cleaner output, smaller file

## Upload to Walrus

After recording + editing, you have `demo.mp4` (~30-50 MB target).

### Option 1: Walrus CLI (if installed)

```bash
walrus --context=testnet store demo.mp4 --epochs 26
# returns blob_id like: 5o0wfhld... 
```

Output blob_id → use in submission.

### Option 2: Upload via catat itself (meta-dogfood) ⭐

This is THE move for "Best Feedback" prize narrative — upload your demo via your own tool.

1. Open catat builder, add a `video_upload` field via slash menu (or modify Bug Report template to include it)
2. Open Preview tab, fill form with video attached (also fill required fields)
3. Click Submit → 3 wallet sigs → real Walrus blob
4. Capture the blob_id from success screen
5. Cite this blob_id in your submission as proof

The Walruscan link from this submission **is** your demo video link.

### Option 3: Use Walrus testnet web upload

If neither above works:
- https://walruscan.com/testnet/blob/upload (if available)
- Or any third-party Walrus upload UI

## Compression hint (if file too big)

```bash
ffmpeg -i raw.mp4 -vcodec h264 -crf 28 -preset medium -acodec aac -b:a 96k demo.mp4
```

`-crf 28` = balanced quality (lower = better quality, bigger file). For screen recording with mostly-static UI, even `-crf 30` looks fine.

## Submission checklist

After demo video uploaded to Walrus:

- [ ] App live URL: https://catat-walrus.vercel.app
- [ ] Repo: https://github.com/PugarHuda/catat
- [ ] Demo video Walrus blob_id (from upload above)
- [ ] Walruscan link to video blob: `https://walruscan.com/testnet/blob/<blob_id>`
- [ ] Short description (≤ 200 words):

> *catat is a Walrus-native feedback platform. Build forms with a slash command, submit with wallet sig — submission JSON stored on Walrus, blob_id recorded on Sui via the catat::form Move package. Per-field encryption via Seal coming next iteration. Admin dashboard reads real submissions back from chain. Landing counter is live from `Form.submission_blob_ids.length`. Stack: Vite + React 19 + dapp-kit + @mysten/walrus + Move 2024. Deployed on both Vercel (devx) and Walrus Sites testnet (full decentralization story).*

- [ ] At least 1 real submission via own tool ✅ (the demo recording produces this)
- [ ] Register via [Airtable](https://airtable.com/appoDAKpC74UOqoDa/shrN8UbJRdbkd5Lso)
- [ ] (Best Feedback prize) Submit feedback about Walrus dev experience via catat itself, link in submission

## Bonus: scoring framework for self-review before submit

Watch your own video, score 1-5 on:

| Criterion | What to check |
|---|---|
| First 5s hook | Did viewer want to keep watching? |
| Pace | Any dead air > 2s? Any rushed sections? |
| On-chain proof | Did you SHOW Walruscan/Suiscan, or just claim? |
| Tool actually works | Did submit succeed end-to-end without retake? |
| Open-source signal | Mention MIT + GitHub in outro? |
| Audio quality | Voiceover clear? No background noise? |
| Cuts feel natural | Or jarring? |

Re-record if any score is 1-2.
