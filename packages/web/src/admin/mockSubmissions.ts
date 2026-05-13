import type { Submission, Status, Priority } from './types';

interface Sample {
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  repro_url?: string;
  rating?: number;
  submitter: string | null;
  age_minutes: number;
  screenshots: number;
  has_email: boolean;
  status: Status;
  priority: Priority;
}

const SAMPLE: Sample[] = [
  {
    title: 'Cannot upload blob > 100MB to testnet',
    severity: 'High',
    description: 'When uploading a video file via writeBlob, the request hangs indefinitely after ~95MB. No error in console. SDK 0.6.2 on testnet.',
    repro_url: 'https://github.com/example/walrus-large-blob-repro',
    rating: 5,
    submitter: '0xa9f2c4e1d7b3856042f1a8d9c2e5b78f1234567890abcdef0123456789abcdef',
    age_minutes: 2,
    screenshots: 2,
    has_email: true,
    status: 'new',
    priority: 'high',
  },
  {
    title: 'Walrus Sites deploy fails with site-builder 1.2.0',
    severity: 'Critical',
    description: 'site-builder deploy hits "Cannot read property of undefined (reading manifest)". Worked fine on 1.1.0. Tried clean install + cache clear.',
    repro_url: 'https://github.com/example/site-builder-1.2-bug',
    rating: 5,
    submitter: '0x0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
    age_minutes: 12,
    screenshots: 3,
    has_email: true,
    status: 'new',
    priority: 'high',
  },
  {
    title: 'Connect wallet broken on Safari 18.1 mobile',
    severity: 'High',
    description: 'dapp-kit connect modal does not appear on iOS Safari 18.1. Works on Chrome and Firefox. Console shows no errors. Suspected WalletStandard registration timing.',
    repro_url: 'https://github.com/example/dappkit-safari-bug',
    rating: 4,
    submitter: '0xb1c4e2f5a8d3795024b7c6e1a9f2853d47820159defabc012345678901234567',
    age_minutes: 8,
    screenshots: 1,
    has_email: true,
    status: 'new',
    priority: 'high',
  },
  {
    title: 'Quilt write fails with single file',
    severity: 'High',
    description: 'When passing array with single WalrusFile to writeFiles, get error "Quilt requires minimum 2 files". Should support 1 file or auto-pad transparently.',
    rating: 5,
    submitter: '0xc7e2a99fd8b51063e4a1b6c8d2f5e9a3c14b7d8e02f3a456b789c012d3e4f567',
    age_minutes: 23,
    screenshots: 0,
    has_email: false,
    status: 'triaging',
    priority: 'high',
  },
  {
    title: 'Seal SDK: 1-of-1 threshold not supported',
    severity: 'Medium',
    description: 'Documentation mentions threshold encryption, but SDK throws when threshold=1. Need at least 2 servers? Should clarify or support single-server testing flow.',
    rating: 4,
    submitter: '0x1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    age_minutes: 38,
    screenshots: 0,
    has_email: false,
    status: 'triaging',
    priority: 'medium',
  },
  {
    title: 'Form duplication missing tag association',
    severity: 'Medium',
    description: 'When duplicating a form via "Save as", the tag/category association is dropped. Have to re-tag manually after each clone.',
    rating: 3,
    submitter: '0xd9f1c2c3b4a5061728394a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d',
    age_minutes: 67,
    screenshots: 0,
    has_email: true,
    status: 'in_progress',
    priority: 'medium',
  },
  {
    title: 'Suggestion: bulk submission triage view',
    severity: 'Low',
    description: 'Would be great to triage multiple submissions at once with checkbox + bulk action menu (mark all resolved, archive selected, etc).',
    submitter: '0xf2b3c4d5e6f70819203b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f',
    age_minutes: 240,
    screenshots: 0,
    has_email: true,
    status: 'new',
    priority: 'low',
  },
  {
    title: 'Anonymous submission about Walrus pricing',
    severity: 'Low',
    description: 'The storage epoch model is confusing. Why does each epoch have a different price? Better explanation needed in docs, ideally a calculator.',
    submitter: null,
    age_minutes: 720,
    screenshots: 0,
    has_email: false,
    status: 'new',
    priority: 'low',
  },
  {
    title: 'Typo in error message: "blod_id" should be "blob_id"',
    severity: 'Low',
    description: 'In the SDK error toast, "Invalid blod_id format" — should be blob_id. Trivial fix.',
    rating: 2,
    submitter: '0xe1a2b3c4d5e6f7081923b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
    age_minutes: 145,
    screenshots: 1,
    has_email: false,
    status: 'resolved',
    priority: 'low',
  },
  {
    title: 'Reproduces — fixed in PR #42',
    severity: 'Medium',
    description: 'Confirmed bug. Patched and merged. Will close after release.',
    repro_url: 'https://github.com/example/repro-242',
    rating: 4,
    submitter: '0x2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e',
    age_minutes: 1440,
    screenshots: 1,
    has_email: true,
    status: 'resolved',
    priority: 'medium',
  },
  {
    title: 'Old issue from launch week — needs retest',
    severity: 'Medium',
    description: 'Reported during launch, may not still be valid. Need to retest against current testnet.',
    submitter: '0x3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f',
    age_minutes: 4320,
    screenshots: 0,
    has_email: false,
    status: 'archived',
    priority: 'low',
  },
  {
    title: 'Question: behavior with 3-of-5 servers down?',
    severity: 'Low',
    description: 'Asking, not reporting. Curious what happens when 3 of 5 Seal key servers are unreachable but threshold is 3.',
    submitter: '0x4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a',
    age_minutes: 2880,
    screenshots: 0,
    has_email: false,
    status: 'archived',
    priority: 'low',
  },
  // --- new: variety pass — edge cases that show off field types ---
  {
    title: 'Detailed repro with annotated screenshots — 3 attached',
    severity: 'High',
    description:
      'Step 1: connect wallet on testnet → OK.\n' +
      'Step 2: pick "Walrus Bug Report" template → OK.\n' +
      'Step 3: hit Publish → wallet pops sig 1 → I close it accidentally.\n' +
      'Step 4: reopen Publish → wallet pops sig 1 again → tx now fails with "blob already registered".\n\n' +
      'Should idempotency check before re-prompting register, or surface a clear "your previous reservation is still pending" UI.',
    repro_url: 'https://github.com/example/walrus-double-register',
    rating: 4,
    submitter: '0xa9b8c7d6e5f40312b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
    age_minutes: 16,
    screenshots: 3,
    has_email: true,
    status: 'new',
    priority: 'high',
  },
  {
    title: 'Burst — same submitter, third report this week',
    severity: 'Medium',
    description:
      'Reporter has filed two prior issues on similar surface area. Pattern: testnet RPC returning 503 during peak hours (UTC 14:00-16:00). Likely Mysten side, not catat. Linking back: see #4 + #6 in this inbox.',
    submitter: '0xa9f2c4e1d7b3856042f1a8d9c2e5b78f1234567890abcdef0123456789abcdef',
    age_minutes: 32,
    screenshots: 0,
    has_email: true,
    status: 'triaging',
    priority: 'medium',
  },
  {
    title: 'Loom video walkthrough — 2-min repro',
    severity: 'High',
    description:
      'Hard to describe in text — recorded a 2-minute Loom showing the exact flow. URL above. TL;DR: form submit succeeds but Inbox shows nothing for 30+ seconds, then suddenly all submissions appear at once.\n\nLikely useRealSubmissions polling interval issue.',
    repro_url: 'https://www.loom.com/share/example-walrus-bug-walkthrough',
    rating: 5,
    submitter: '0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
    age_minutes: 5,
    screenshots: 0,
    has_email: true,
    status: 'new',
    priority: 'high',
  },
  {
    title: 'Anonymous: Are submissions GDPR-compliant by default?',
    severity: 'Medium',
    description:
      'Asking for a friend in EU. If form has sealed email field, is the encrypted blob still considered PII under GDPR? Where is it stored geographically? Need a compliance one-pager.',
    submitter: null,
    age_minutes: 1080,
    screenshots: 0,
    has_email: false,
    status: 'triaging',
    priority: 'medium',
  },
  {
    title: 'Just shipped — seconds-old test ping',
    severity: 'Low',
    description:
      'Smoke test from automated CI. If you see this, the publish→submit pipeline is healthy as of 30 seconds ago.',
    submitter: '0xf1e2d3c4b5a69788776655443322110099aabbccddeeff00112233445566778899',
    age_minutes: 1,
    screenshots: 0,
    has_email: false,
    status: 'new',
    priority: 'low',
  },
];

const hex = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');

export function generateMockSubmissions(): Submission[] {
  return SAMPLE.map((s, i) => ({
    id: `sub_${String(i).padStart(3, '0')}`,
    blob_id: 'blob_' + hex(32),
    tx_hash: '0x' + hex(64),
    form_id: '0xtest_form_object_id_will_come_from_sui',
    submitted_at_ms: Date.now() - s.age_minutes * 60 * 1000,
    submitter: s.submitter,
    values: {
      f_title: s.title,
      f_severity: s.severity,
      f_description: s.description,
      f_screenshot:
        s.screenshots > 0
          ? Array.from({ length: s.screenshots }, (_, j) => ({
              filename: `screenshot-${j + 1}.png`,
              size_bytes: 50000 + j * 12000,
              content_type: 'image/png',
            }))
          : null,
      f_repro_url: s.repro_url ?? null,
      f_email: s.has_email
        ? {
            encrypted: true,
            scheme: 'seal-ibe-2of3',
            ciphertext_placeholder: '[Seal-encrypted: ~28 bytes]',
          }
        : null,
      f_rating: s.rating ?? null,
    },
    status: s.status,
    priority: s.priority,
    tags: [],
    source: 'mock' as const,
  }));
}
