import { Edit3, Eye, Inbox, ShieldCheck, type LucideIcon } from 'lucide-react';

export type Surface = 'builder' | 'runner' | 'admin' | 'verify';

export interface SurfaceMeta {
  label: string;
  icon: LucideIcon;
}

export const surfaceMeta: Record<Surface, SurfaceMeta> = {
  builder: { label: 'Build', icon: Edit3 },
  runner: { label: 'Preview', icon: Eye },
  admin: { label: 'Submissions', icon: Inbox },
  verify: { label: 'Verify', icon: ShieldCheck },
};

export const surfaceOrder: Surface[] = ['builder', 'runner', 'admin', 'verify'];
