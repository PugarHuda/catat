import { Callout, P, H2, Lead, Code, KeyList } from '../primitives';

export function TemplatesDoc() {
  return (
    <>
      <Lead>
        Every template is just a pre-filled form schema. They're code, not data — defined in{' '}
        <Code>packages/web/src/builder/templates.ts</Code>. Pick one in Builder and it overwrites the
        current canvas (with a confirm dialog if you have unsaved fields).
      </Lead>

      <H2>Built-in template inventory</H2>
      <KeyList items={[
        ['🐛 Bug Report', '8 fields (title, steps, expected/actual, severity, env, contact). Sealed: contact email. Best for OSS, support intake.'],
        ['📊 NPS Survey', '3 fields (score 0–10, reason, optional contact). Sealed: contact. Best for recurring CSAT.'],
        ['📬 Contact Us', '4 fields (name, email, subject, message). Sealed: name + email. Best for marketing pages.'],
        ['📧 Newsletter Signup', '2 fields (email, interests multi-choice). Sealed: email. Best for email lists.'],
        ['🏆 Hackathon Application', '9 fields (project, team, repo, demo, etc). Sealed: team emails. Best for organizers.'],
        ['💡 Feature Request', '6 fields (title, problem, proposal, severity, willingness-to-pay). Best for roadmap.'],
        ['💼 Job Application', '10 fields (name, email, role, resume file, links). Sealed: name, email, resume. Best for hiring.'],
        ['🎙️ Podcast Pitch', '7 fields (guest, topic, links, headshot). Sealed: contact. Best for shows.'],
        ['📅 Event RSVP', '5 fields (name, attending, plus-one, dietary, notes). Best for meetups.'],
        ['🗳️ DAO Proposal', '6 fields (title, summary, motivation, spec, voting period). Best for governance.'],
        ['👥 User Research', '5 fields (role, frequency, pain points, contact for follow-up). Sealed: contact. Best for discovery.'],
        ['📝 Blank', '0 fields. Best for from scratch.'],
      ]} />

      <H2>Custom templates (your own)</H2>
      <P>
        In Builder, click <b>Save as template</b>. Catat writes the current schema to{' '}
        <Code>localStorage</Code> under <Code>catat:custom-templates:v1</Code>. Custom templates
        appear in the strip with a 💾 badge and survive page reloads (per browser).
      </P>
      <P>
        <b>Versioned shape:</b> custom templates use a <Code>PersistedShape v1</Code> envelope. If we
        change schema in the future, v1 templates won't crash — the loader falls back gracefully and
        warns in console.
      </P>

      <H2>Editing the built-ins</H2>
      <P>
        Don't fork the file to tweak labels. Instead: pick the template, edit on canvas, click{' '}
        <b>Save as template</b> with your modified version. The original built-in stays intact;
        your custom version is yours.
      </P>

      <H2>Sharing templates with teammates</H2>
      <P>
        Today this is unsolved — localStorage is per-browser. Workaround: publish the template as an
        actual form, share the URL. Anyone who opens it can click <b>Save as template</b> to bring it
        into their own Builder.
      </P>

      <Callout tone="note">
        Planned: <b>Template export</b> button → uploads schema as a Walrus blob → produces a
        shareable <Code>catat:tpl:&lt;blob_id&gt;</Code> URL fragment that other Builders can import.
        Tracked in the roadmap.
      </Callout>
    </>
  );
}
