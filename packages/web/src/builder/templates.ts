import type { FormSchema } from './types';

/** Empty starting point — what users see when entering Builder fresh.
 *  Picked from TemplatesGallery's "+ Blank canvas" card; lifted into a
 *  reusable constant so App.tsx can use the same shape as the default. */
export const blankCanvasTemplate: FormSchema = {
  id: 'tpl_blank',
  title: 'Untitled form',
  description: '',
  fields: [],
};

export const bugReportTemplate: FormSchema = {
  id: 'tpl_bug_report',
  title: 'Walrus Bug Report',
  description: 'Help us improve Walrus by reporting bugs you encounter. Sensitive fields are encrypted via Seal.',
  fields: [
    {
      id: 'f_title',
      type: 'short_text',
      label: 'Bug title',
      required: true,
      placeholder: 'Short summary of the issue',
    },
    {
      id: 'f_severity',
      type: 'dropdown',
      label: 'Severity',
      required: true,
      options: ['Low', 'Medium', 'High', 'Critical'],
    },
    {
      id: 'f_description',
      type: 'rich_text',
      label: 'Description',
      required: true,
      help: 'What happened? What did you expect?',
    },
    {
      id: 'f_screenshot',
      type: 'image_upload',
      label: 'Screenshots',
      required: false,
    },
    {
      id: 'f_repro_url',
      type: 'url',
      label: 'Reproduction link',
      required: false,
    },
    {
      id: 'f_email',
      type: 'email',
      label: 'Contact email',
      required: false,
      encrypted: true,
    },
    {
      id: 'f_rating',
      type: 'star_rating',
      label: 'How blocking is this?',
      required: false,
      scale: 5,
    },
  ],
};

export const npsSurveyTemplate: FormSchema = {
  id: 'tpl_nps',
  title: 'NPS Survey',
  description: 'Net Promoter Score with a follow-up. Star rating drives the number, the comment field captures the why.',
  fields: [
    {
      id: 'f_score',
      type: 'star_rating',
      label: 'How likely are you to recommend us?',
      required: true,
      scale: 10,
      help: '0 = not at all, 10 = absolutely',
    },
    {
      id: 'f_reason',
      type: 'rich_text',
      label: 'What drove that score?',
      required: true,
      help: 'A sentence or two is plenty.',
    },
    {
      id: 'f_persona',
      type: 'dropdown',
      label: 'You are…',
      required: false,
      options: ['Builder / dev', 'Researcher', 'Investor', 'Curious onlooker'],
    },
    {
      id: 'f_email',
      type: 'email',
      label: 'Email (only if you want a reply)',
      required: false,
      encrypted: true,
    },
  ],
};

export const founderApplicationTemplate: FormSchema = {
  id: 'tpl_founder_apply',
  title: 'Founder Application',
  description: 'Pitch form for founders applying to a program. Wallet + email sealed so screening team sees them only after sign-off.',
  fields: [
    {
      id: 'f_company',
      type: 'short_text',
      label: 'Company / project name',
      required: true,
    },
    {
      id: 'f_one_liner',
      type: 'short_text',
      label: 'One-line pitch',
      required: true,
      placeholder: 'We make X for Y so they can Z.',
    },
    {
      id: 'f_stage',
      type: 'dropdown',
      label: 'Stage',
      required: true,
      options: ['Idea', 'Prototype', 'Launched', 'Revenue', 'Scaling'],
    },
    {
      id: 'f_problem',
      type: 'rich_text',
      label: 'What problem are you solving?',
      required: true,
    },
    {
      id: 'f_traction',
      type: 'rich_text',
      label: 'Traction so far',
      required: false,
      help: 'Numbers, signed LOIs, design partners — anything concrete.',
    },
    {
      id: 'f_deck_url',
      type: 'url',
      label: 'Pitch deck link',
      required: false,
    },
    {
      id: 'f_founder_wallet',
      type: 'wallet_address',
      label: 'Founder wallet address',
      required: true,
      encrypted: true,
      help: 'For grants disbursement; sealed until selection.',
    },
    {
      id: 'f_email',
      type: 'email',
      label: 'Email',
      required: true,
      encrypted: true,
    },
  ],
};

export const contactFormTemplate: FormSchema = {
  id: 'tpl_contact',
  title: 'Contact Form',
  description: 'Classic contact form, but the email is encrypted client-side so it never sits in plaintext on a server.',
  fields: [
    {
      id: 'f_name',
      type: 'short_text',
      label: 'Your name',
      required: true,
    },
    {
      id: 'f_topic',
      type: 'dropdown',
      label: 'Topic',
      required: true,
      options: ['Sales', 'Support', 'Partnership', 'Other'],
    },
    {
      id: 'f_message',
      type: 'rich_text',
      label: 'Message',
      required: true,
    },
    {
      id: 'f_email',
      type: 'email',
      label: 'Email (for reply)',
      required: true,
      encrypted: true,
    },
  ],
};

export const featureRequestTemplate: FormSchema = {
  id: 'tpl_feature_request',
  title: 'Feature Request',
  description: 'Capture feature ideas with priority + voter wallet address (later: token-gate the form to your community).',
  fields: [
    {
      id: 'f_title',
      type: 'short_text',
      label: 'Feature title',
      required: true,
      placeholder: 'e.g. dark mode for the dashboard',
    },
    {
      id: 'f_priority',
      type: 'dropdown',
      label: 'How important is it to you?',
      required: true,
      options: ['Nice to have', 'Would help a lot', 'Critical to our workflow'],
    },
    {
      id: 'f_use_case',
      type: 'rich_text',
      label: 'Tell us your use case',
      required: true,
      help: 'What are you trying to do?',
    },
    {
      id: 'f_screenshots',
      type: 'image_upload',
      label: 'Mockups or sketches',
      required: false,
    },
    {
      id: 'f_voter',
      type: 'wallet_address',
      label: 'Your wallet (so others can vote your request up)',
      required: false,
    },
  ],
};

export const eventRsvpTemplate: FormSchema = {
  id: 'tpl_event_rsvp',
  title: 'Event RSVP',
  description: 'Headcount + dietary + sealed contact for a real-world meetup. Email stays encrypted until the day-of mailing list export.',
  fields: [
    {
      id: 'f_name',
      type: 'short_text',
      label: 'Your name',
      required: true,
    },
    {
      id: 'f_attending',
      type: 'dropdown',
      label: 'Will you be there?',
      required: true,
      options: ['Yes, definitely', 'Maybe', 'No, but keep me posted'],
    },
    {
      id: 'f_plus_ones',
      type: 'number',
      label: 'Number of guests (you + plus-ones)',
      required: true,
    },
    {
      id: 'f_dietary',
      type: 'checkboxes',
      label: 'Dietary preferences',
      required: false,
      options: ['Vegetarian', 'Vegan', 'Halal', 'Gluten-free', 'No restrictions'],
    },
    {
      id: 'f_date',
      type: 'date',
      label: 'When would you arrive?',
      required: false,
    },
    {
      id: 'f_email',
      type: 'email',
      label: 'Email for confirmation',
      required: true,
      encrypted: true,
    },
  ],
};

export const jobApplicationTemplate: FormSchema = {
  id: 'tpl_job_application',
  title: 'Job Application',
  description: 'Sealed resume + sealed wallet + open work samples. Screening team only unlocks personal info after deciding to interview.',
  fields: [
    {
      id: 'f_full_name',
      type: 'short_text',
      label: 'Full name',
      required: true,
    },
    {
      id: 'f_role',
      type: 'dropdown',
      label: 'Which role are you applying for?',
      required: true,
      options: ['Senior Engineer', 'Mid Engineer', 'Junior Engineer', 'Designer', 'PM', 'Other'],
    },
    {
      id: 'f_portfolio',
      type: 'url',
      label: 'Portfolio / GitHub link',
      required: true,
    },
    {
      id: 'f_pitch',
      type: 'rich_text',
      label: 'Why are you a fit?',
      required: true,
      help: 'Two paragraphs is plenty.',
    },
    {
      id: 'f_resume',
      type: 'image_upload',
      label: 'Resume (PDF preferred — first image used as preview)',
      required: false,
    },
    {
      id: 'f_email',
      type: 'email',
      label: 'Email',
      required: true,
      encrypted: true,
    },
    {
      id: 'f_wallet',
      type: 'wallet_address',
      label: 'Wallet for sign-on bonus / payments',
      required: false,
      encrypted: true,
    },
  ],
};

export const newsletterSignupTemplate: FormSchema = {
  id: 'tpl_newsletter',
  title: 'Newsletter Signup',
  description: 'Email-collection form done right: address never sits in plaintext on a backend, only the form owner decrypts on send-day.',
  fields: [
    {
      id: 'f_email',
      type: 'email',
      label: 'Your email',
      required: true,
      encrypted: true,
      help: 'Sealed with Seal — only the publisher’s wallet can decrypt.',
    },
    {
      id: 'f_topics',
      type: 'checkboxes',
      label: 'What do you want updates on?',
      required: false,
      options: ['Product changelog', 'Engineering deep-dives', 'Hiring announcements', 'Community events'],
    },
    {
      id: 'f_frequency',
      type: 'dropdown',
      label: 'How often?',
      required: true,
      options: ['Weekly', 'Bi-weekly', 'Monthly'],
    },
  ],
};

export const userResearchTemplate: FormSchema = {
  id: 'tpl_user_research',
  title: 'User Research Screener',
  description: 'Screener for a 30-min user interview. Sealed contact + open demographic answers so screeners can sort without seeing PII.',
  fields: [
    {
      id: 'f_persona',
      type: 'dropdown',
      label: 'You describe yourself as…',
      required: true,
      options: ['Builder / dev', 'Designer', 'PM / ops', 'Curious user', 'Researcher / academic'],
    },
    {
      id: 'f_usage',
      type: 'star_rating',
      label: 'How often do you use products in our category?',
      required: true,
      scale: 5,
      help: '1 = never, 5 = daily',
    },
    {
      id: 'f_pain',
      type: 'rich_text',
      label: 'What’s your biggest pain point right now?',
      required: true,
    },
    {
      id: 'f_availability',
      type: 'checkboxes',
      label: 'When are you free for a 30-min call?',
      required: true,
      options: ['Mon-Fri morning', 'Mon-Fri afternoon', 'Weekday evening', 'Weekend'],
    },
    {
      id: 'f_email',
      type: 'email',
      label: 'Email to schedule',
      required: true,
      encrypted: true,
    },
  ],
};

export const hackathonSubmissionTemplate: FormSchema = {
  id: 'tpl_hackathon_submission',
  title: 'Hackathon Submission',
  description: 'Team intake for a hackathon — project pitch, demo URL, team wallets (kept sealed until selection).',
  fields: [
    {
      id: 'f_project_name',
      type: 'short_text',
      label: 'Project name',
      required: true,
    },
    {
      id: 'f_track',
      type: 'dropdown',
      label: 'Track',
      required: true,
      options: ['DeFi', 'Infra / Tooling', 'Consumer / Social', 'AI x Crypto', 'Other'],
    },
    {
      id: 'f_one_liner',
      type: 'short_text',
      label: 'One-line pitch',
      required: true,
    },
    {
      id: 'f_description',
      type: 'rich_text',
      label: 'What did you build?',
      required: true,
    },
    {
      id: 'f_demo_url',
      type: 'url',
      label: 'Demo URL',
      required: true,
    },
    {
      id: 'f_video',
      type: 'video_upload',
      label: 'Demo video (optional, will Walrus-Quilt with submission)',
      required: false,
    },
    {
      id: 'f_team_wallet',
      type: 'wallet_address',
      label: 'Team wallet for prize payout',
      required: true,
      encrypted: true,
    },
  ],
};

export const daoVoteTemplate: FormSchema = {
  id: 'tpl_dao_vote',
  title: 'DAO Vote',
  description: 'Off-chain governance vote with on-chain receipts. Each ballot is a verifiable Walrus blob, voter wallet stays sealed.',
  fields: [
    {
      id: 'f_proposal',
      type: 'short_text',
      label: 'Which proposal are you voting on?',
      required: true,
      placeholder: 'CIP-001: …',
    },
    {
      id: 'f_choice',
      type: 'dropdown',
      label: 'Your vote',
      required: true,
      options: ['For', 'Against', 'Abstain'],
    },
    {
      id: 'f_rationale',
      type: 'rich_text',
      label: 'Why did you vote this way? (public — recorded on chain)',
      required: false,
    },
    {
      id: 'f_wallet',
      type: 'wallet_address',
      label: 'Your voter wallet',
      required: true,
      encrypted: true,
      help: 'Sealed for ballot privacy until reveal period.',
    },
  ],
};

export const refundRequestTemplate: FormSchema = {
  id: 'tpl_refund_request',
  title: 'Refund Request',
  description: 'Support intake with sealed contact info and severity routing. Keeps PII off-server while still letting team triage by urgency.',
  fields: [
    {
      id: 'f_order_id',
      type: 'short_text',
      label: 'Order ID',
      required: true,
      placeholder: 'e.g. ORD-12345',
    },
    {
      id: 'f_reason',
      type: 'dropdown',
      label: 'Reason for refund',
      required: true,
      options: ['Item not received', 'Item damaged', 'Wrong item', 'Changed mind', 'Other'],
    },
    {
      id: 'f_severity',
      type: 'dropdown',
      label: 'Severity',
      required: true,
      options: ['Low', 'Medium', 'High', 'Critical'],
    },
    {
      id: 'f_explanation',
      type: 'rich_text',
      label: 'What happened?',
      required: true,
    },
    {
      id: 'f_evidence',
      type: 'image_upload',
      label: 'Photos / screenshots (optional)',
      required: false,
    },
    {
      id: 'f_email',
      type: 'email',
      label: 'Reply-to email',
      required: true,
      encrypted: true,
    },
  ],
};

/** Registry consumed by TemplatesGallery. Order = display order in the picker. */
export interface TemplateMeta {
  id: string;
  name: string;
  emoji: string;
  description: string;
  schema: FormSchema;
}

export const templateRegistry: TemplateMeta[] = [
  {
    id: bugReportTemplate.id,
    name: bugReportTemplate.title,
    emoji: '🐞',
    description: 'Bug intake with severity, screenshots, sealed reporter email.',
    schema: bugReportTemplate,
  },
  {
    id: npsSurveyTemplate.id,
    name: npsSurveyTemplate.title,
    emoji: '⭐',
    description: '10-point NPS + reason + persona. Sealed email opt-in.',
    schema: npsSurveyTemplate,
  },
  {
    id: contactFormTemplate.id,
    name: contactFormTemplate.title,
    emoji: '✉️',
    description: 'Name, topic, message. Email encrypted client-side.',
    schema: contactFormTemplate,
  },
  {
    id: newsletterSignupTemplate.id,
    name: newsletterSignupTemplate.title,
    emoji: '📬',
    description: 'Email + topic prefs. Address sealed end-to-end.',
    schema: newsletterSignupTemplate,
  },
  {
    id: eventRsvpTemplate.id,
    name: eventRsvpTemplate.title,
    emoji: '🎟️',
    description: 'Headcount + dietary + sealed contact for a meetup.',
    schema: eventRsvpTemplate,
  },
  {
    id: featureRequestTemplate.id,
    name: featureRequestTemplate.title,
    emoji: '💡',
    description: 'Feature voting form with optional voter wallet.',
    schema: featureRequestTemplate,
  },
  {
    id: founderApplicationTemplate.id,
    name: founderApplicationTemplate.title,
    emoji: '🚀',
    description: 'Pitch form. Founder wallet + email sealed until selection.',
    schema: founderApplicationTemplate,
  },
  {
    id: jobApplicationTemplate.id,
    name: jobApplicationTemplate.title,
    emoji: '💼',
    description: 'Sealed PII, open work samples, screener flow.',
    schema: jobApplicationTemplate,
  },
  {
    id: userResearchTemplate.id,
    name: userResearchTemplate.title,
    emoji: '🔍',
    description: 'Screener for 30-min user interviews. Sealed contact.',
    schema: userResearchTemplate,
  },
  {
    id: hackathonSubmissionTemplate.id,
    name: hackathonSubmissionTemplate.title,
    emoji: '🏆',
    description: 'Project intake — pitch, demo URL, sealed team wallet.',
    schema: hackathonSubmissionTemplate,
  },
  {
    id: daoVoteTemplate.id,
    name: daoVoteTemplate.title,
    emoji: '🗳️',
    description: 'Off-chain ballot with sealed voter wallet, on-chain receipt.',
    schema: daoVoteTemplate,
  },
  {
    id: refundRequestTemplate.id,
    name: refundRequestTemplate.title,
    emoji: '↩️',
    description: 'Refund triage with severity routing + sealed reply-to.',
    schema: refundRequestTemplate,
  },
];
