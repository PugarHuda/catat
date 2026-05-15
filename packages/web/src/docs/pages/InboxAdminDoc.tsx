import { Callout, P, H2, Lead, Code, KeyList } from '../primitives';

export function InboxAdminDoc() {
  return (
    <>
      <Lead>
        Catat splits triage into two surfaces to keep cognitive load low. <b>Inbox</b> is the
        notification feed: "what got new across all my forms?" <b>Admin</b> is the workbench: filter,
        prioritize, decrypt, export — scoped to one form at a time.
      </Lead>

      <H2>Inbox — pure notification feed</H2>
      <P>
        Inbox is read-only by design. No edits happen here; it's the "what should I look at next"
        surface. It shows:
      </P>
      <KeyList items={[
        ['Aggregate counters', 'Total submissions, forms active, recent (last 100 events), last 24h'],
        ['📥 Recent submissions', 'Top 12 entries with a headline extracted from the first meaningful field'],
        ['📋 By form', 'Per-form summary: latest activity timestamp, count, latest submitter address'],
      ]} />

      <P>
        Clicking any row jumps to Admin scoped to that form. Recent-row headlines fall back across
        common field shapes (<Code>f_title</Code> → <Code>f_project_name</Code> →{' '}
        <Code>f_full_name</Code> → <Code>f_one_liner</Code> → etc.) so most templates show something
        meaningful without per-template config.
      </P>

      <H2>Admin — the triage workbench</H2>
      <P>
        Active form switcher at the top defaults to most-recent. Below the switcher:
      </P>
      <ul>
        <li>
          <b>Charts row</b> — sparkline (submissions over last 14 days, today marker highlighted),
          status breakdown bars, severity bars (only if schema has <Code>f_severity</Code>)
        </li>
        <li>
          <b>Table</b> with TanStack — every column from the schema, paginated 50/page, per-column
          filter input, sort by clicking header
        </li>
        <li>
          <b>Inline triage badges</b> — Status pill, Priority pill (always visible — even default
          values, after a UX iteration), Notes preview pill (first ~40 chars)
        </li>
        <li>
          <b>Row expand</b> — click → drawer opens with full submission, decrypt buttons for Sealed
          fields, attachment thumbnails, walruscan link
        </li>
        <li>
          <b>Bulk actions</b> — checkbox-select rows → batch update status / batch export CSV
        </li>
      </ul>

      <H2>Status, priority, notes — where do they live?</H2>
      <P>
        These are <b>client-side annotations</b> stored in <Code>localStorage</Code> (per form) keyed
        by submission blob_id. Why not on-chain?
      </P>
      <ul>
        <li><b>Cost</b> — every status flip would cost gas. For high-volume forms, that's prohibitive.</li>
        <li><b>Privacy</b> — your internal triage shouldn't leak. "We're treating this report as P0" is owner-private intel.</li>
        <li><b>Speed</b> — UI feels instant when state is local; an on-chain round-trip per click would feel laggy.</li>
      </ul>
      <P>
        Practical implication: triage on laptop A doesn't show on laptop B. Planned: optional sync
        via a private Walrus blob owned by the form admin.
      </P>

      <H2>Exporting</H2>
      <P>
        <b>Export CSV</b> button (top of Admin) uses <Code>papaparse</Code> to flatten every field
        across every submission. Sealed columns export as <Code>(sealed)</Code> unless you've
        decrypted them in the current session. Attachments export as walruscan URLs (re-downloadable
        anytime from there).
      </P>

      <Callout tone="tip">
        Inbox counters used to render <Code>0</Code> even when a feed query failed silently. Now:
        counters hide whenever any feed query errors, replaced by an explicit error banner. No more
        misleading "you have 0 submissions" when the truth is "the query crashed."
      </Callout>
    </>
  );
}
