import type { FormSchema } from '@/builder/types';
import type { Submission } from './types';
import { walruscanBlob, suiscanTx } from '@/lib/contract';

/**
 * Multi-format submission export. All exporters take the same inputs and
 * return a `{ filename, mimeType, content }` triple — `triggerDownload()`
 * handles the browser download dance once.
 *
 * Currently supported formats:
 *   - `csv`      — Excel-friendly with UTF-8 BOM, attachments as walruscan URLs
 *   - `json`     — structured raw data, ideal for further programmatic processing
 *   - `markdown` — presentation-ready report (one section per submission)
 *
 * Sealed values render as `[encrypted]` unless decrypted by Admin's
 * decrypt cache and the resolved plaintext is supplied via `decryptedValues`.
 */

export type ExportFormat = 'csv' | 'json' | 'markdown';

export interface ExportArgs {
  schema: FormSchema;
  submissions: Submission[];
  /**
   * Optional map of `${submission.id}::${field.id}` → decrypted plaintext.
   * Allows the Admin caller to fold its session decrypt cache into the
   * export so users get plaintext for fields they've already unlocked.
   */
  decryptedValues?: Map<string, string>;
}

export interface ExportResult {
  filename: string;
  mimeType: string;
  content: string;
}

/** Public entry — picks the right serializer for `format`. */
export function exportSubmissions(format: ExportFormat, args: ExportArgs): ExportResult {
  const tsSlug = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  // Slugify the schema id — chain/user-derived ids can contain chars
  // illegal in filenames (`/`, `:`, `0x...`), which break the download
  // on some browsers. Collapse anything non-alphanumeric to a dash.
  const idSlug = (args.schema.id || 'form').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40);
  const baseName = `catat-${idSlug}-${tsSlug}`;
  switch (format) {
    case 'csv':
      return { filename: `${baseName}.csv`, mimeType: 'text/csv;charset=utf-8', content: toCsv(args) };
    case 'json':
      return { filename: `${baseName}.json`, mimeType: 'application/json;charset=utf-8', content: toJson(args) };
    case 'markdown':
      return { filename: `${baseName}.md`, mimeType: 'text/markdown;charset=utf-8', content: toMarkdown(args) };
  }
}

/** Trigger a browser download for the given export result. */
export function triggerDownload(result: ExportResult): void {
  const blob = new Blob([result.content], { type: result.mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke so Safari has time to start the download. 2s is generous;
  // any sane browser will have picked up the URL by then.
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ─── CSV ───────────────────────────────────────────────────────────────────

function toCsv({ schema, submissions, decryptedValues }: ExportArgs): string {
  const fieldHeaders = schema.fields.map(f => (f.encrypted ? `${f.label} [sealed]` : f.label));
  const headers = [
    'id',
    'status',
    'priority',
    'submitted_at_iso',
    'submitter',
    'blob_id',
    'tx_hash',
    'walruscan_url',
    'suiscan_url',
    'source',
    'notes',
    ...fieldHeaders,
  ];

  const rows = submissions.map(s => {
    const meta = [
      s.id,
      s.status,
      s.priority,
      new Date(s.submitted_at_ms).toISOString(),
      s.submitter ?? '',
      s.blob_id,
      s.tx_hash,
      s.blob_id ? walruscanBlob(s.blob_id) : '',
      s.tx_hash ? suiscanTx(s.tx_hash) : '',
      s.source ?? 'unknown',
      s.notes ?? '',
    ];
    const fieldValues = schema.fields.map(f => stringifyFieldValue(s, f.id, !!f.encrypted, decryptedValues));
    return [...meta, ...fieldValues];
  });

  // UTF-8 BOM so Excel opens accented characters correctly. Without it,
  // "café" displays as "cafÃ©" — ugly + breaks search.
  return '﻿' + [headers, ...rows].map(row => row.map(escapeCsvCell).join(',')).join('\r\n');
}

function escapeCsvCell(cell: unknown): string {
  if (cell == null) return '';
  let s = String(cell);
  // CSV-injection mitigation: Excel/LibreOffice treat cells starting with
  // `=`, `+`, `-`, `@`, or `\t` as formulas — a label like `=cmd|'/c calc'!A1`
  // can run shell commands when the file is opened. Prefix with a single
  // quote so the spreadsheet treats the value as literal text instead of a
  // formula. The leading quote is stripped by Excel on display so users
  // never see it.
  if (/^[=+\-@\t]/.test(s)) s = "'" + s;
  // Escape if value contains delimiter, quote, or any line-break char
  // (Excel will misinterpret unescaped CR/LF as a row break).
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ─── JSON ──────────────────────────────────────────────────────────────────

function toJson({ schema, submissions, decryptedValues }: ExportArgs): string {
  const payload = {
    exported_at_iso: new Date().toISOString(),
    exporter: 'catat-walrus v1',
    form: {
      id: schema.id,
      title: schema.title,
      description: schema.description ?? '',
      field_count: schema.fields.length,
      sealed_field_count: schema.fields.filter(f => f.encrypted).length,
      fields: schema.fields.map(f => ({
        id: f.id,
        label: f.label,
        type: f.type,
        required: !!f.required,
        sealed: !!f.encrypted,
      })),
    },
    submission_count: submissions.length,
    submissions: submissions.map(s => ({
      id: s.id,
      blob_id: s.blob_id,
      tx_hash: s.tx_hash,
      form_id: s.form_id,
      submitted_at_iso: new Date(s.submitted_at_ms).toISOString(),
      submitted_at_ms: s.submitted_at_ms,
      submitter: s.submitter,
      walruscan_url: s.blob_id ? walruscanBlob(s.blob_id) : null,
      suiscan_url: s.tx_hash ? suiscanTx(s.tx_hash) : null,
      triage: {
        status: s.status,
        priority: s.priority,
        tags: s.tags,
        notes: s.notes ?? null,
      },
      source: s.source ?? 'unknown',
      values: schema.fields.reduce<Record<string, unknown>>((acc, f) => {
        acc[f.id] = readableFieldValue(s, f.id, !!f.encrypted, decryptedValues);
        return acc;
      }, {}),
    })),
  };
  return JSON.stringify(payload, null, 2);
}

// ─── Markdown ──────────────────────────────────────────────────────────────

function toMarkdown({ schema, submissions, decryptedValues }: ExportArgs): string {
  const now = new Date();
  const tsHuman = now.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
  const lines: string[] = [];

  lines.push(`# ${schema.title || 'Untitled form'} — submissions export`);
  lines.push('');
  lines.push(`Generated **${tsHuman}**.`);
  lines.push(`**${submissions.length}** submission${submissions.length === 1 ? '' : 's'} · **${schema.fields.length}** field${schema.fields.length === 1 ? '' : 's'} · **${schema.fields.filter(f => f.encrypted).length}** sealed.`);
  lines.push('');
  lines.push(`> Exported via catat — Walrus-native form platform. Original on-chain data is the source of truth.`);
  lines.push('');

  if (submissions.length > 0) {
    // Status summary table — quick at-a-glance triage state.
    const statusCounts = submissions.reduce<Record<string, number>>((acc, s) => {
      acc[s.status] = (acc[s.status] ?? 0) + 1;
      return acc;
    }, {});
    const priorityCounts = submissions.reduce<Record<string, number>>((acc, s) => {
      acc[s.priority] = (acc[s.priority] ?? 0) + 1;
      return acc;
    }, {});

    lines.push('## Triage summary');
    lines.push('');
    lines.push('| Status | Count | Priority | Count |');
    lines.push('|--------|------:|----------|------:|');
    const statusKeys = Object.keys(statusCounts);
    const priorityKeys = Object.keys(priorityCounts);
    const maxRows = Math.max(statusKeys.length, priorityKeys.length);
    for (let i = 0; i < maxRows; i++) {
      const sk = statusKeys[i] ?? '';
      const pk = priorityKeys[i] ?? '';
      lines.push(`| ${sk || ''} | ${sk ? statusCounts[sk] : ''} | ${pk || ''} | ${pk ? priorityCounts[pk] : ''} |`);
    }
    lines.push('');
  }

  lines.push('## Submissions');
  lines.push('');

  if (submissions.length === 0) {
    lines.push('_No submissions to export._');
    return lines.join('\n');
  }

  // Newest first — matches the default sort in Admin.
  const ordered = [...submissions].sort((a, b) => b.submitted_at_ms - a.submitted_at_ms);

  for (let i = 0; i < ordered.length; i++) {
    const s = ordered[i]!;
    const headline = guessHeadline(s, schema);
    lines.push(`### ${i + 1}. ${headline}`);
    lines.push('');
    lines.push(`- **Submitted**: ${new Date(s.submitted_at_ms).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} _(${new Date(s.submitted_at_ms).toISOString()})_`);
    lines.push(`- **Submitter**: ${s.submitter ? `\`${s.submitter}\`` : '_anonymous_'}`);
    lines.push(`- **Status**: ${s.status} · **Priority**: ${s.priority}`);
    if (s.tags && s.tags.length > 0) lines.push(`- **Tags**: ${s.tags.map(t => `\`${t}\``).join(', ')}`);
    if (s.notes) lines.push(`- **Notes**: ${escapeMd(s.notes)}`);
    if (s.blob_id) lines.push(`- **Walruscan**: [${s.blob_id.slice(0, 14)}…](${walruscanBlob(s.blob_id)})`);
    if (s.tx_hash) lines.push(`- **Suiscan tx**: [${s.tx_hash.slice(0, 14)}…](${suiscanTx(s.tx_hash)})`);
    lines.push('');
    lines.push('| Field | Value |');
    lines.push('|-------|-------|');
    for (const f of schema.fields) {
      const value = stringifyFieldValue(s, f.id, !!f.encrypted, decryptedValues);
      const renderedValue = value === '' ? '_(empty)_' : escapeMdCell(value);
      const fieldLabel = f.encrypted ? `🔒 ${f.label}` : f.label;
      lines.push(`| ${escapeMdCell(fieldLabel)} | ${renderedValue} |`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Field value helpers (shared) ──────────────────────────────────────────

/**
 * Returns a string representation of a field value, suitable for tabular
 * formats (CSV, Markdown). Encrypted fields show their ciphertext or the
 * literal "[sealed]" placeholder unless a decryption is available.
 */
function stringifyFieldValue(
  s: Submission,
  fieldId: string,
  isEncrypted: boolean,
  decrypted?: Map<string, string>,
): string {
  if (isEncrypted) {
    const decryptedValue = decrypted?.get(`${s.id}::${fieldId}`);
    if (decryptedValue != null) return decryptedValue;
    return '[sealed]';
  }
  const v = s.values[fieldId];
  if (v == null) return '';
  if (Array.isArray(v)) {
    return v
      .map(item =>
        typeof item === 'object' && item !== null && 'filename' in item
          ? (item as { filename: string }).filename
          : String(item),
      )
      .join('; ');
  }
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/** Like `stringifyFieldValue` but preserves arrays/objects for JSON output. */
function readableFieldValue(
  s: Submission,
  fieldId: string,
  isEncrypted: boolean,
  decrypted?: Map<string, string>,
): unknown {
  if (isEncrypted) {
    const decryptedValue = decrypted?.get(`${s.id}::${fieldId}`);
    if (decryptedValue != null) return decryptedValue;
    return '[sealed]';
  }
  return s.values[fieldId] ?? null;
}

/** Pick the best human headline for a submission — first non-empty plain-text field. */
function guessHeadline(s: Submission, schema: FormSchema): string {
  // Prefer common fields first (matches recent-feed extractHeadline).
  const PREFERRED = ['f_title', 'f_project_name', 'f_full_name', 'f_one_liner', 'f_subject', 'f_summary'];
  for (const key of PREFERRED) {
    const value = s.values[key];
    if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 80);
  }
  // Fallback: first non-empty plain-text field in schema order.
  for (const f of schema.fields) {
    if (f.encrypted) continue;
    const v = s.values[f.id];
    if (typeof v === 'string' && v.trim()) return v.trim().slice(0, 80);
  }
  return `Submission ${s.id.slice(0, 8)}`;
}

/** Markdown-safe inline text. Escapes the few chars that can break tables / formatting. */
function escapeMd(s: string): string {
  // Inside a character class, `[` `]` `(` `)` `+` `-` etc. don't need
  // escaping — keep them literal to satisfy no-useless-escape.
  return s.replace(/([\\`*_{}[\]()#+\-!|])/g, '\\$1');
}

/** Markdown table cell: escape pipes + collapse newlines so rows stay one-line. */
function escapeMdCell(s: string): string {
  return escapeMd(s).replace(/\r?\n+/g, ' ↵ ');
}
