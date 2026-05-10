# packages/contracts — catat Move package

Minimal on-chain registry for Walrus-stored form submissions.

## Module: `catat::form`

| Function | Caller | Purpose |
|---|---|---|
| `create_form(title, schema_blob_id, ctx)` | anyone | Create new shared Form, caller = owner |
| `submit(form, blob_id, clock, ctx)` | anyone (when accepting) | Append blob_id to form's submission list |
| `set_accept_submissions(form, value, ctx)` | owner only | Open/close form |
| `update_schema(form, new_blob_id, ctx)` | owner only | Replace schema reference |
| `submission_count(form)` | reader | Verifiable count |
| `owner(form)`, `title(form)`, `schema_blob_id(form)`, `accept_submissions(form)` | readers | Pure getters |

## Events

- `FormCreated { form_id, owner, title }` — listen to discover new forms
- `SubmissionAdded { form_id, submitter, blob_id, timestamp_ms }` — listen to index submissions

## Design notes

- **Submissions are NOT stored on-chain** — only their `blob_id` (~44 chars). Actual JSON + attachments live in Walrus blob referenced by that blob_id. Keeps on-chain footprint tiny.
- **Form is `key`-only (shared)**, not `key + store` — so it can never be wrapped or transferred. Permanent registry.
- **`accept_submissions` flag** lets owner pause without deleting (preserves submission history).
- **No Seal access policy yet** — this minimal package focuses on registry. Seal `seal_approve_*` functions for encrypted-field decryption can be added in a follow-up package or extended here.

## Build (locally if you have Sui CLI)

```bash
cd packages/contracts
sui move build
```

## Publish

Use the GitHub Actions workflow `.github/workflows/publish-move.yml`:

```bash
gh workflow run publish-move.yml --repo PugarHuda/catat
```

The workflow installs Sui CLI on the runner, builds, publishes to testnet using
`SUI_BECH32_PRIVATE_KEY` secret, creates an initial `Form` object, and outputs
`package_id` + `form_id` to the run summary.

After publish, hardcode those IDs into `packages/web/src/lib/contract.ts`.
