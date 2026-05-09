import {
  Type,
  AlignLeft,
  ChevronDown,
  CheckSquare,
  Star,
  Image as ImageIcon,
  Video,
  Link2,
  Mail,
  Wallet,
  Hash,
  Calendar,
  type LucideIcon,
} from 'lucide-react';
import type { FieldType } from './types';

export type FieldGroup = 'basic' | 'rich' | 'web3';

export interface FieldMeta {
  label: string;
  icon: LucideIcon;
  description: string;
  group: FieldGroup;
}

export const fieldMeta: Record<FieldType, FieldMeta> = {
  short_text:     { label: 'Short text',         icon: Type,         description: 'Single line text input',                        group: 'basic' },
  rich_text:      { label: 'Rich text',          icon: AlignLeft,    description: 'Markdown editor for long-form content',         group: 'rich'  },
  dropdown:       { label: 'Dropdown',           icon: ChevronDown,  description: 'Single-select from options',                    group: 'basic' },
  checkboxes:     { label: 'Checkboxes',         icon: CheckSquare,  description: 'Multi-select from options',                     group: 'basic' },
  star_rating:    { label: 'Star rating',        icon: Star,         description: '1–5 or 1–10 scale',                   group: 'rich'  },
  image_upload:   { label: 'Screenshot upload',  icon: ImageIcon,    description: 'Multi-file image input, stored on Walrus',      group: 'rich'  },
  video_upload:   { label: 'Video upload',       icon: Video,        description: 'Single video file, stored on Walrus',           group: 'rich'  },
  url:            { label: 'URL',                icon: Link2,        description: 'Validated link input',                          group: 'basic' },
  email:          { label: 'Email',              icon: Mail,         description: 'Email address; pair with Encrypted toggle',     group: 'basic' },
  wallet_address: { label: 'Wallet address',     icon: Wallet,       description: 'Sui address, autofill from connected wallet',   group: 'web3'  },
  number:         { label: 'Number',             icon: Hash,         description: 'Numeric input',                                 group: 'basic' },
  date:           { label: 'Date',               icon: Calendar,     description: 'Date or datetime picker',                       group: 'basic' },
};

export const groupOrder: FieldGroup[] = ['basic', 'rich', 'web3'];

export const groupLabels: Record<FieldGroup, string> = {
  basic: 'Basic',
  rich: 'Rich',
  web3: 'Web3 — unique to catat',
};
