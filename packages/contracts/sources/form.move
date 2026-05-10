/// catat::form — minimal on-chain registry for Walrus-stored form submissions.
///
/// Each `Form` is a shared object owned by its creator. Anyone can submit
/// (record a Walrus blob_id against the form), but only the owner can pause
/// the form or change settings.
///
/// Submissions are NOT stored on-chain — only their Walrus blob_id is. The
/// actual JSON payload + attachments live in the Walrus blob/quilt referenced
/// by that blob_id. This keeps on-chain footprint tiny (just strings) while
/// providing tamper-proof, auditable count + provenance.
module catat::form;

use std::string::String;
use sui::clock::Clock;
use sui::event;

// ─── Errors ────────────────────────────────────────────────────────────────

const ENotAcceptingSubmissions: u64 = 1;
const ENotOwner: u64 = 2;

// ─── Structs ───────────────────────────────────────────────────────────────

/// A form, shared on-chain. Anyone can read fields + call submit().
public struct Form has key {
    id: UID,
    /// Wallet address of the form creator. Only this address can change settings.
    owner: address,
    /// Human-readable form title (mirrors Walrus schema for display convenience).
    title: String,
    /// Walrus blob_id of the form's JSON schema (field definitions, settings).
    schema_blob_id: String,
    /// Append-only list of Walrus blob_ids — each one is a submission Quilt.
    /// Length of this vector = verifiable submission count.
    submission_blob_ids: vector<String>,
    /// If false, submit() aborts. Owner can flip to close the form.
    accept_submissions: bool,
}

// ─── Events ────────────────────────────────────────────────────────────────

/// Emitted on every successful submit. Indexers (or webhooks) listen for this.
public struct SubmissionAdded has copy, drop {
    form_id: address,
    submitter: address,
    blob_id: String,
    timestamp_ms: u64,
}

/// Emitted on form creation. Useful for dashboards listing all forms.
public struct FormCreated has copy, drop {
    form_id: address,
    owner: address,
    title: String,
}

// ─── Entry: create form ────────────────────────────────────────────────────

/// Create a new shared Form object. Caller becomes the owner.
public fun create_form(title: String, schema_blob_id: String, ctx: &mut TxContext) {
    let form = Form {
        id: object::new(ctx),
        owner: ctx.sender(),
        title,
        schema_blob_id,
        submission_blob_ids: vector[],
        accept_submissions: true,
    };
    let form_id = form.id.to_address();
    let owner = form.owner;
    let title_copy = form.title;
    transfer::share_object(form);
    event::emit(FormCreated { form_id, owner, title: title_copy });
}

// ─── Entry: submit ─────────────────────────────────────────────────────────

/// Append a Walrus blob_id (submission) to the form. Anyone can call this
/// while accept_submissions is true. Emits SubmissionAdded event.
public fun submit(form: &mut Form, blob_id: String, clock: &Clock, ctx: &TxContext) {
    assert!(form.accept_submissions, ENotAcceptingSubmissions);
    form.submission_blob_ids.push_back(blob_id);
    event::emit(SubmissionAdded {
        form_id: form.id.to_address(),
        submitter: ctx.sender(),
        blob_id,
        timestamp_ms: clock.timestamp_ms(),
    });
}

// ─── Entry: owner-only mutators ────────────────────────────────────────────

/// Toggle whether the form accepts new submissions. Owner only.
public fun set_accept_submissions(form: &mut Form, value: bool, ctx: &TxContext) {
    assert!(ctx.sender() == form.owner, ENotOwner);
    form.accept_submissions = value;
}

/// Update the schema_blob_id (e.g. when republishing form schema). Owner only.
public fun update_schema(form: &mut Form, new_schema_blob_id: String, ctx: &TxContext) {
    assert!(ctx.sender() == form.owner, ENotOwner);
    form.schema_blob_id = new_schema_blob_id;
}

// ─── Public reader functions ───────────────────────────────────────────────

public fun submission_count(form: &Form): u64 {
    form.submission_blob_ids.length()
}

public fun owner(form: &Form): address {
    form.owner
}

public fun title(form: &Form): String {
    form.title
}

public fun schema_blob_id(form: &Form): String {
    form.schema_blob_id
}

public fun accept_submissions(form: &Form): bool {
    form.accept_submissions
}
