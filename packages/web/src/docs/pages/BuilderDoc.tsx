import { Callout, P, H2, Lead, Code, Step } from '../primitives';

export function BuilderDoc() {
  return (
    <>
      <Lead>
        The Builder is where forms come to life. Drag fields onto the canvas, edit titles,
        toggle Seal encryption, and publish. Once published, you can iterate by re-publishing
        a new schema version that <b>preserves the same Form object and submission history</b>.
      </Lead>

      <H2>Layout</H2>
      <ul>
        <li><b>Left palette</b> — 14 field types + templates gallery</li>
        <li><b>Center canvas</b> — paper-aesthetic preview that doubles as the editor</li>
        <li><b>Right panel</b> (when a field is selected) — label, help text, required flag, Seal toggle, options for select/radio/checkbox</li>
      </ul>

      <H2>Field types</H2>
      <ul>
        <li><b>Short text</b> · <b>Long text</b> · <b>Email</b> · <b>URL</b> · <b>Number</b></li>
        <li><b>Select</b> · <b>Radio</b> · <b>Checkbox</b> (multi-select)</li>
        <li><b>Rating 1–5</b> · <b>NPS 0–10</b> · <b>Yes/No</b></li>
        <li><b>Date</b> · <b>Time</b> · <b>File upload</b> (images, PDF; batched into Quilt)</li>
      </ul>

      <Callout tone="tip">
        Field IDs are auto-derived from labels via <Code>slugify(label)</Code>. Don't rename
        field IDs after publishing — submissions reference them by ID. Renaming the visible
        label is safe.
      </Callout>

      <H2>Sealed fields</H2>
      <P>
        Click the 🔒 toggle on any field to mark it Sealed. At submit-time the SPA encrypts
        the value with the form-specific Seal identity before adding it to the Quilt. The
        encrypted bytes look like base64 ciphertext in the raw blob; the Admin view auto-decrypts
        them if you're the form owner.
      </P>
      <P>
        Good Seal candidates: emails, phone numbers, PoC details, addresses. Bad candidates:
        anything you want public (titles, status, free-form feedback).
      </P>

      <H2>Templates</H2>
      <P>
        12 built-in templates ship with sensible defaults. Open <b>📚 templates</b> in the
        palette to browse. You can also save your own forms as templates — they persist in{' '}
        <Code>localStorage</Code> under a versioned schema and are restored on next page load.
      </P>

      <H2>Publish flow</H2>
      <P>The 3-sig flow runs in this order:</P>
      <Step n={1} title="Walrus reserve">
        <P>
          A Sui transaction reserves the blob slot on Walrus for one storage epoch. This gets
          the blob_id (deterministic from the schema bytes) and pays the storage tip.
        </P>
      </Step>
      <Step n={2} title="Walrus upload (no signature)">
        <P>
          The schema bytes are HTTP-POSTed to the Walrus publisher. No wallet signature — the
          reservation in step 1 already authorized it.
        </P>
      </Step>
      <Step n={3} title="Sui Move call">
        <P>
          Either <Code>create_form(blob_id, title)</Code> (new form) or{' '}
          <Code>update_schema(form, blob_id)</Code> (updating existing). Move emits the
          corresponding event.
        </P>
      </Step>

      <H2>Updating a published form</H2>
      <P>
        If you publish from a wallet that already owns the Form, the publish bar shows a green{' '}
        <b>↻ Update this form</b> primary button + <b>Publish as new copy</b> secondary. The
        update path uses <Code>update_schema</Code> which keeps the same Form object ID — your
        share URL stays valid, your submission history stays intact, only the schema_blob_id
        pointer changes.
      </P>

      <Callout tone="warn">
        Don't update a published form to <i>add a required field</i> if you already have
        submissions — old submissions won't have that field and will display "—" in the admin
        table. Either: (a) make new fields optional, or (b) publish a new copy with a new share URL.
      </Callout>

      <H2>Drafts & autosave</H2>
      <P>
        Builder autosaves draft schemas to <Code>localStorage</Code> every keystroke. Reload
        the page and your draft is restored. Drafts are not on-chain until you publish — they
        live only in this browser.
      </P>
    </>
  );
}
