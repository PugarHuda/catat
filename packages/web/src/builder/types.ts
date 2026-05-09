export type FieldType =
  | 'short_text'
  | 'rich_text'
  | 'dropdown'
  | 'checkboxes'
  | 'star_rating'
  | 'image_upload'
  | 'video_upload'
  | 'url'
  | 'email'
  | 'wallet_address'
  | 'number'
  | 'date';

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  encrypted?: boolean;
  options?: string[];
  scale?: number;
  placeholder?: string;
  help?: string;
}

export interface FormSchema {
  id: string;
  title: string;
  description: string;
  fields: Field[];
}
