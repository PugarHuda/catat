import type { ReactNode } from 'react';
import { useFormStats } from './useFormStats';
import { BUG_REPORT_FORM_ID, suiscanObject } from '@/lib/contract';
import BrandGlyph from '@/components/BrandGlyph';

interface Props {
  onEnterApp: () => void;
}

export default function LandingPage({ onEnterApp }: Props) {
  return (
    <>
      <Header onEnterApp={onEnterApp} />
      <Hero onEnterApp={onEnterApp} />
      <Band />
      <Features />
      <HowItWorks />
      <CTA onEnterApp={onEnterApp} />
      <Footer />
    </>
  );
}

function Header({ onEnterApp }: Props) {
  return (
    <header className="nav">
      <div className="wrap nav-row">
        <a className="brand" href="#top">
          <BrandGlyph />
          catat
          <small>est. 2026</small>
        </a>
        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <button type="button" onClick={onEnterApp}>Live demo ↗</button>
          <a
            href="https://github.com/PugarHuda/catat#readme"
            target="_blank"
            rel="noopener noreferrer"
          >
            Docs ↗
          </a>
          <a
            href="https://github.com/PugarHuda/catat"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open source ↗
          </a>
        </nav>
        <div className="nav-cta">
          <button type="button" className="btn btn-primary" onClick={onEnterApp}>
            Connect wallet
            <Arrow />
          </button>
        </div>
      </div>
    </header>
  );
}

function Arrow() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function Hero({ onEnterApp }: Props) {
  const { data: stats, isLoading: statsLoading } = useFormStats();
  const count = stats?.count ?? 0;

  return (
    <section className="hero" id="top">
      <div className="wrap hero-grid">
        <div>
          <div className="eyebrow-row">
            <span className="eyebrow-label">built on</span>
            <span className="chip blue rotate-1">SUI</span>
            <span className="chip green rotate-2">WALRUS</span>
            <span className="chip red rotate-1">SEAL</span>
          </div>

          <h1 className="hero-title">
            Forms with <span className="marker">cryptographic</span><br />
            <span className="underline">proof</span>, not <span className="strike">vendor</span> promises.
          </h1>

          <p className="hero-lede">
            catat is a feedback &amp; survey notebook for the on-chain era. Toggle a 🔒 on any field
            to seal it with <em>Seal</em>, save every reply as a <em>Walrus blob</em>, and let anyone
            verify your numbers straight from <em>Sui</em>.
          </p>

          <div className="cta-row">
            <button type="button" className="btn btn-primary" onClick={onEnterApp}>
              Start a notebook
              <Arrow />
            </button>
            <button type="button" className="btn" onClick={onEnterApp}>See live demo</button>
            <span className="handnote">
              <svg viewBox="0 0 60 30" width={48} height={24} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 22 C 14 5, 30 4, 50 16" />
                <path d="M44 8 L52 16 L44 22" />
              </svg>
              ← free on testnet!
            </span>
          </div>

          <div className="signoff">
            <span><b>2-of-3</b> Seal threshold</span>
            <span className="div">·</span>
            <span><b>~100×</b> cheaper via Quilt</span>
            <span className="div">·</span>
            <span><b>{statsLoading ? '—' : count.toLocaleString()}</b> on-chain replies</span>
          </div>
        </div>

        <div className="stage">
          <article className="notebook">
            <div className="np-head">
              <span>Form #017 / draft</span>
              <span className="date">May 11, 2026</span>
            </div>
            <h3 className="np-title">
              <span className="chk">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l5 5L20 7" />
                </svg>
              </span>
              Walrus bug report
            </h3>
            <p className="np-sub">Help us track issues across the testnet.</p>

            <div className="fld">
              <div className="fld-label">Title <span className="req">*</span></div>
              <div className="np-input">Aggregator timeout on epoch rollover</div>
            </div>

            <div className="fld">
              <div className="fld-label">Severity <span className="req">*</span></div>
              <div className="np-dropdown">
                <span className="pill-sev"><span className="sev-dot" /> high — blocking</span>
                <span style={{ fontSize: 18 }}>▾</span>
              </div>
            </div>

            <div className="fld">
              <div className="fld-label">
                Reporter email
                <span className="lock-tag">
                  <LockIcon />
                  sealed
                </span>
              </div>
              <div className="np-encrypted">
                <span className="ghost">▒▒▒▒-▒▒▒▒-▒▒-▒▒▒▒▒▒▒</span>
                <span className="badge">SEAL · 2-of-3</span>
              </div>
            </div>

            <div className="np-signature">
              <span className="meta">3 fields · 1 sealed · ready to submit</span>
              <span className="submit-stamp">submit ↵</span>
            </div>
          </article>

          <div className="hero-postit hero-postit-tx">
            <b>tx hash</b>
            <code>0x4a2c…b91</code>
            <small>verified on Sui ✓</small>
          </div>
          <div className="hero-postit hero-postit-blob">
            <b>walrus blob</b>
            <code>{statsLoading ? 'bafy…' : `count: ${count}`}</code>
            <small>{statsLoading ? 'loading…' : 'live from Sui RPC'}</small>
          </div>
          <div className="hero-postit hero-postit-seal">
            <b>seal</b>
            <code>2-of-3</code>
            <small>per-field key 🔒</small>
          </div>
        </div>
      </div>
    </section>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function Band() {
  const { data: stats } = useFormStats();
  const count = stats?.count ?? 0;
  return (
    <div className="band">
      <div className="wrap band-row">
        <BandStat value={`${count}`} label="verifiable replies" />
        <BandStat value="2-of-3" label="seal threshold" />
        <BandStat value="~100×" label="cheaper writes" />
        <BandStat value="10" label="storage epochs" />
        <BandStat value="MIT" label="open source" />
      </div>
    </div>
  );
}

function BandStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="band-stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

function Features() {
  return (
    <section className="features" id="features">
      <div className="wrap">
        <span className="section-eyebrow">— what makes catat different —</span>
        <h2 className="section-title">Form software, finally honest about its data.</h2>
        <p className="section-sub">
          Tally and Typeform ask you to <em>trust</em> their dashboards. catat hands you the receipts:
          every submission has a Sui tx hash, every byte lives in Walrus, every secret is sealed with a 2-of-3 key.
        </p>

        <div className="feat-grid">
          <FeatureCard
            num="01"
            tag="Privacy · Seal"
            title="Per-field encryption with Seal."
            wide
            tape
          >
            Toggle 🔒 on any field. Email and screenshots stay sealed end-to-end with threshold encryption — only the form owner&apos;s wallet can decrypt, in the browser, never on a server.
            <span className="feat-note">id = formId · fieldId — granular like nothing else.</span>
          </FeatureCard>

          <FeatureCard num="02" tag="Provable" title="On-chain proof, every time." numColor="red">
            Every submission emits a Sui event &amp; registers a blob ID. Your &ldquo;500 responses&rdquo; is a fact, not a claim.
            <Squiggle />
          </FeatureCard>

          <FeatureCard num="03" tag="Storage · Quilt" title="Walrus storage, Quilt-batched." numColor="blue">
            One submission + all attachments → one Quilt → one write. ~100× cheaper than naive blob-per-file.
            <span className="feat-note">10 epochs default · extendable</span>
          </FeatureCard>

          <FeatureCard num="04" tag="Verifiable" title="Public count, queryable." numColor="ink-yellow">
            <code>Form.submission_blob_ids.length</code> is permissionless. Count proven from Sui RPC, not catat dashboards.
          </FeatureCard>

          <FeatureCard num="05" tag="Self-host · OSS" title="Hosted on Walrus Sites — yours forever." wide numColor="yellow">
            The whole app is a decentralized site. Fork the repo, point at your testnet package ID, deploy. No backend, no database, no monthly bill — just Sui state + Walrus bytes + Seal keys.
            <span className="feat-note">MIT licensed · 100% open source</span>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}

function Squiggle() {
  const heights = [30, 42, 38, 55, 48, 62, 58, 75, 70, 85, 80];
  return (
    <div className="squiggle-chart" aria-hidden="true">
      {heights.map((h, i) => (
        <span key={i} className="bar" style={{ height: `${h}%` }} />
      ))}
      <span className="bar now" style={{ height: '96%' }} />
    </div>
  );
}

interface FeatureCardProps {
  num: string;
  tag: string;
  title: string;
  children: ReactNode;
  wide?: boolean;
  tape?: boolean;
  numColor?: 'red' | 'blue' | 'ink-yellow' | 'yellow';
}

function FeatureCard({ num, tag, title, children, wide, tape, numColor }: FeatureCardProps) {
  const numClass = numColor ? ` ${numColor}` : '';
  return (
    <article className={`feat-card${wide ? ' wide' : ''}`}>
      {tape && <div className="tape" />}
      <div className="card-h">
        <span className={`card-num${numClass}`}>{num}</span>
        <span className="card-tag">{tag}</span>
      </div>
      <h3>{title}</h3>
      <div className="feat-body">{children}</div>
    </article>
  );
}

function HowItWorks() {
  return (
    <section className="how" id="how">
      <div className="wrap">
        <span className="section-eyebrow">— how it works —</span>
        <h2 className="section-title">Three steps. No backend.</h2>

        <div className="how-grid">
          <Step n="01" title="Build">
            <p>Drag-drop fields, toggle 🔒 per field, set a token gate. Schema lands on Walrus, a Sui shared object is minted.</p>
            <StepArt rows={[['title field', 'added'], ['email · sealed', '🔒 on'], ['schema → walrus', 'bafy…2x9']]} />
          </Step>
          <Step n="02" title="Share" bg="postit">
            <p>Drop a link, embed the form in your docs, paste a QR onto a poster. Optionally token-gate.</p>
            <StepArt rows={[['catat.wal.app/f/', '0x4a2c…b91'], ['QR generated', '✓'], ['token gate', 'off']]} />
          </Step>
          <Step n="03" title="Verify" bg="postit-mint">
            <p>Every reply ships with a Sui tx hash + Walrus blob ID. Anyone can recompute your counts straight from chain.</p>
            <StepArt rows={[['SubmissionAdded', '✓'], ['tx', '0x4a2c…b91'], ['count', 'live']]} />
          </Step>
        </div>
      </div>
    </section>
  );
}

function Step({ n, title, children, bg }: { n: string; title: string; children: ReactNode; bg?: 'postit' | 'postit-mint' }) {
  return (
    <div className={`step${bg ? ` bg-${bg}` : ''}`}>
      <div className="step-num">{n}</div>
      <h4>{title}</h4>
      {children}
    </div>
  );
}

function StepArt({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="step-art">
      {rows.map(([k, v], i) => (
        <div key={i} className="tx-line">
          <span>{k}</span>
          <b>{v}</b>
        </div>
      ))}
    </div>
  );
}

function CTA({ onEnterApp }: Props) {
  return (
    <section className="cta-section">
      <div className="wrap">
        <div className="envelope">
          <div>
            <h2>Ship the first form on <span className="marker">Walrus.</span></h2>
            <p>Free on testnet. Connect a Sui wallet, pick a template, and have a verifiable form live in 90 seconds.</p>
            <div className="cta-row" style={{ marginTop: 24 }}>
              <button type="button" className="btn btn-primary" onClick={onEnterApp}>
                Open the notebook
                <Arrow />
              </button>
              <a href="https://github.com/PugarHuda/catat" target="_blank" rel="noopener noreferrer" className="btn">
                View on GitHub
              </a>
            </div>
          </div>
          <div className="cta-receipt">
            <div className="cta-receipt-title">📝 receipt — what you get</div>
            <ReceiptRow k="form runner" v="walrus blob" />
            <ReceiptRow k="schema" v="walrus blob" />
            <ReceiptRow k="registry" v="sui shared obj" />
            <ReceiptRow k="per-field keys" v="seal · 2-of-3" />
            <ReceiptRow k="hosting" v="walrus sites" />
            <div style={{ marginTop: 8, borderTop: '1.5px dashed var(--ink)', paddingTop: 8 }}>
              <ReceiptRow k="price" v={<span style={{ color: 'var(--marker-red)' }}>free.</span>} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReceiptRow({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="cta-receipt-row">
      <span>{k}</span>
      <b>{v}</b>
    </div>
  );
}

function Footer() {
  return (
    <footer>
      <div className="wrap foot">
        <div>
          <div>© 2026 catat · MIT · built on Sui &amp; Walrus</div>
          <div className="signature-line">— sketched on real paper, served from Walrus.</div>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="https://github.com/PugarHuda/catat" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://docs.wal.app" target="_blank" rel="noopener noreferrer">Walrus docs</a>
          <a href="https://docs.sui.io" target="_blank" rel="noopener noreferrer">Sui docs</a>
          <a href={suiscanObject(BUG_REPORT_FORM_ID)} target="_blank" rel="noopener noreferrer">Form on Suiscan</a>
        </div>
      </div>
    </footer>
  );
}
