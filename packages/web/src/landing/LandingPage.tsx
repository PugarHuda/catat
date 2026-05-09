import {
  ArrowRight,
  Lock,
  Shield,
  Package,
  Code,
  Keyboard,
  Database,
  Users,
  Award,
  Boxes,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onEnterApp: () => void;
}

export default function LandingPage({ onEnterApp }: Props) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header onEnterApp={onEnterApp} />
      <main>
        <Hero onEnterApp={onEnterApp} />
        <Why />
        <HowItWorks />
        <Features />
        <ForWho />
        <CTA onEnterApp={onEnterApp} />
      </main>
      <Footer />
    </div>
  );
}

function Header({ onEnterApp }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-5xl items-center gap-4 px-6 text-sm">
        <span className="font-mono text-foreground">catat</span>
        <span className="hidden text-muted-foreground/60 sm:inline">·</span>
        <span className="hidden text-xs text-muted-foreground sm:inline">forms with proof</span>
        <nav className="ml-auto flex items-center gap-1">
          <a
            href="https://github.com/PugarHuda/catat"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md px-2.5 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            GitHub
          </a>
          <button
            type="button"
            onClick={onEnterApp}
            className="ml-1 inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs text-primary-foreground transition hover:opacity-90"
          >
            Launch app <ArrowRight className="h-3 w-3" />
          </button>
        </nav>
      </div>
    </header>
  );
}

function Hero({ onEnterApp }: Props) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[640px] bg-gradient-to-b from-sky-50 via-sky-50/30 to-transparent" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[640px] [mask-image:radial-gradient(ellipse_at_top,black_0%,transparent_70%)]">
        <div className="h-full w-full bg-[linear-gradient(to_right,#0ea5e911_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e911_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-20 pt-20 text-center md:pt-28">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          testnet preview · v0.1
        </span>

        <h1 className="mt-6 text-5xl font-semibold tracking-tight md:text-6xl">
          Forms with proof.
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          The Walrus-native feedback platform. Forms that live on-chain, attachments stored on Walrus, private fields encrypted by Seal. Owned by you, not by a vendor.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onEnterApp}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Try the demo <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <a
            href="https://github.com/PugarHuda/catat"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-accent"
          >
            View on GitHub
          </a>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 font-mono text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            LIVE
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span>
            <span className="text-foreground">1,247</span> verified submissions
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span>
            blob_id <span className="text-foreground">0xa9f2..3e7b</span>
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span>
            since epoch <span className="text-foreground">124</span>
          </span>
          <span className="text-muted-foreground/50">[demo data]</span>
        </div>
      </div>
    </section>
  );
}

function Why() {
  return (
    <section className="border-t border-border py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Why catat
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Three things existing form tools can't do.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <DiffCard
            number="01"
            title="Submissions you actually own"
            desc="Tally stores in their DB. Formo too. catat stores on Walrus — bytes you can read, fork, or migrate without permission."
          />
          <DiffCard
            number="02"
            title="Per-field encryption"
            desc="Other Web3 form tools: encrypt all-or-nothing. catat: toggle 🔒 per field. Bug title public, email encrypted. Granular via Seal."
          />
          <DiffCard
            number="03"
            title="Verifiable submission count"
            desc="“We got 500 responses” — in Tally, you trust the admin. In catat, count = on-chain Sui array length. Anyone audits."
          />
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="border-t border-border py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            How it works
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            From form idea to verified feedback in three steps.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <StepCard
            step="01"
            title="Build"
            desc="Drag-drop form. Slash command (/) to insert field types. Toggle 🔒 encrypted per field via Seal."
            tagline="Tally-style speed"
          />
          <StepCard
            step="02"
            title="Share"
            desc="Public URL or embed widget. Optional token-gate by NFT/Coin holding. Submission Quilt batched cheaply."
            tagline="Embed everywhere"
          />
          <StepCard
            step="03"
            title="Triage"
            desc="Linear-style admin dashboard. Status workflow, filter chips, J/K keyboard nav, CSV export."
            tagline="Built for power users"
          />
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="border-t border-border py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            What's inside
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Built native on Walrus, Seal, and Sui.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Not a Web2 form with a wallet button bolted on. Every primitive is on-chain composable.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <FeatureCard
            icon={Package}
            title="Walrus Quilt batching"
            desc="One submission + attachments = one Quilt. ~100× cheaper than naive blob-per-file."
            tag="cost"
          />
          <FeatureCard
            icon={Lock}
            title="Seal threshold encryption"
            desc="2-of-3 key servers, identity-based. Per-field toggle, not all-or-nothing."
            tag="privacy"
          />
          <FeatureCard
            icon={Shield}
            title="On-chain verifiability"
            desc="Each submission carries blob_id + tx_hash. Audit count via Sui RPC."
            tag="trust"
          />
          <FeatureCard
            icon={Code}
            title="Open source, MIT"
            desc="Fork it. Self-host as Walrus Site. No vendor lock, no monthly fees."
            tag="freedom"
          />
          <FeatureCard
            icon={Keyboard}
            title="Keyboard-first triage"
            desc="J/K nav, X archive, Y resolve. Vim-style speed for DAO ops."
            tag="speed"
          />
          <FeatureCard
            icon={Boxes}
            title="Embeddable widget"
            desc="Drop the iframe into docs, blog, or dApp. QR generator for events."
            tag="distribution"
          />
        </div>
      </div>
    </section>
  );
}

function ForWho() {
  return (
    <section className="border-t border-border bg-muted/30 py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Who is this for
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Built for teams that need accountable feedback.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <PersonaCard
            icon={Database}
            title="Walrus team & RFP grants"
            desc="Bug reports, feature requests with verifiable proof. Dogfood your own ecosystem with the right primitive."
          />
          <PersonaCard
            icon={Users}
            title="DAO operators"
            desc="Token-gated surveys, NPS with verifiable count. Snapshot for governance votes — catat for everything in between."
          />
          <PersonaCard
            icon={Award}
            title="Grant program organizers"
            desc="Application forms where wallet identity, timestamp, and attachment hash all live on-chain. Fair, audit-able, anti-tampering."
          />
          <PersonaCard
            icon={Code}
            title="Indie builders"
            desc="Embed the feedback widget in your docs or dApp. 30-second setup. Zero infrastructure to maintain."
          />
        </div>
      </div>
    </section>
  );
}

function CTA({ onEnterApp }: Props) {
  return (
    <section className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Get started in 5 minutes.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Free, open source, no signup. Build a form, fill it as a respondent, then triage the submissions in admin mode — all in one click.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onEnterApp}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Open the demo <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <a
            href="https://github.com/PugarHuda/catat"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-5 py-3 text-sm font-medium transition hover:bg-accent"
          >
            Star on GitHub
          </a>
        </div>
        <p className="mt-6 font-mono text-[11px] text-muted-foreground">
          built for Walrus Sessions Session 2 · May 5–18, 2026
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="font-mono text-sm text-foreground">catat</p>
            <p className="mt-0.5 text-xs text-muted-foreground">forms with proof · MIT licensed</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <a
              href="https://github.com/PugarHuda/catat"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-foreground"
            >
              GitHub
            </a>
            <span className="text-muted-foreground/40">·</span>
            <a
              href="https://docs.wal.app"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-foreground"
            >
              Walrus docs
            </a>
            <span className="text-muted-foreground/40">·</span>
            <a
              href="https://docs.sui.io"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-foreground"
            >
              Sui docs
            </a>
          </div>
        </div>
        <p className="mt-4 font-mono text-[10px] text-muted-foreground/60">
          Built with @mysten/walrus · @mysten/seal · @mysten/sui · Deployed on Walrus testnet · Frontend on Vercel
        </p>
      </div>
    </footer>
  );
}

interface DiffCardProps {
  number: string;
  title: string;
  desc: string;
}

function DiffCard({ number, title, desc }: DiffCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 transition hover:border-foreground/20">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{number}</div>
      <h3 className="mt-2 text-base font-semibold leading-snug">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

interface StepCardProps {
  step: string;
  title: string;
  desc: string;
  tagline: string;
}

function StepCard({ step, title, desc, tagline }: StepCardProps) {
  return (
    <div className="relative rounded-lg border border-border bg-card p-6 transition hover:border-foreground/20">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">step {step}</div>
      <h3 className="mt-2 text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
      <p className="mt-3 inline-flex rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {tagline}
      </p>
    </div>
  );
}

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  tag: string;
}

function FeatureCard({ icon: Icon, title, desc, tag }: FeatureCardProps) {
  return (
    <div
      className={cn(
        'group relative rounded-lg border border-border bg-card p-5 transition',
        'hover:border-foreground/20 hover:shadow-sm',
      )}
    >
      <div className="flex items-start justify-between">
        <Icon className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">{tag}</span>
      </div>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

interface PersonaCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
}

function PersonaCard({ icon: Icon, title, desc }: PersonaCardProps) {
  return (
    <div className="flex gap-4 rounded-lg border border-border bg-background p-5 transition hover:border-foreground/20">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
