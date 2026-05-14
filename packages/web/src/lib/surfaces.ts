import { Edit3, Eye, Inbox, LayoutDashboard, ShieldCheck, type LucideIcon } from 'lucide-react';

export type Surface = 'builder' | 'runner' | 'inbox' | 'admin' | 'verify';

export interface SurfaceMeta {
  label: string;
  icon: LucideIcon;
}

export const surfaceMeta: Record<Surface, SurfaceMeta> = {
  builder: { label: 'Build',   icon: Edit3 },
  runner:  { label: 'Preview', icon: Eye },
  inbox:   { label: 'Inbox',   icon: Inbox },
  admin:   { label: 'Admin',   icon: LayoutDashboard },
  verify:  { label: 'Verify',  icon: ShieldCheck },
};

export const surfaceOrder: Surface[] = ['builder', 'runner', 'inbox', 'admin', 'verify'];
