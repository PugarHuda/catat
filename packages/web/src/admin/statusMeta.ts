import { Circle, Eye, Loader, CheckCircle2, Archive, type LucideIcon } from 'lucide-react';
import type { Status } from './types';

export interface StatusMeta {
  label: string;
  icon: LucideIcon;
  color: string;
}

export const statusMeta: Record<Status, StatusMeta> = {
  new:         { label: 'New',         icon: Circle,       color: 'text-blue-500'        },
  triaging:    { label: 'Triaging',    icon: Eye,          color: 'text-purple-500'      },
  in_progress: { label: 'In progress', icon: Loader,       color: 'text-amber-500'       },
  resolved:    { label: 'Resolved',    icon: CheckCircle2, color: 'text-emerald-600'     },
  archived:    { label: 'Archived',    icon: Archive,      color: 'text-muted-foreground'},
};

export const statusOrder: Status[] = ['new', 'triaging', 'in_progress', 'resolved', 'archived'];
