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
