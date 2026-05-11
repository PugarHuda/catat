import type { FormSchema } from './types';

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
    id: founderApplicationTemplate.id,
    name: founderApplicationTemplate.title,
    emoji: '🚀',
    description: 'Pitch form. Founder wallet + email sealed until selection.',
    schema: founderApplicationTemplate,
  },
  {
    id: contactFormTemplate.id,
    name: contactFormTemplate.title,
    emoji: '✉️',
    description: 'Name, topic, message. Email encrypted client-side.',
    schema: contactFormTemplate,
  },
  {
    id: featureRequestTemplate.id,
    name: featureRequestTemplate.title,
    emoji: '💡',
    description: 'Feature voting form with optional voter wallet.',
    schema: featureRequestTemplate,
  },
];
