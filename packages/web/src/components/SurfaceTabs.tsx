import { surfaceMeta, surfaceOrder, type Surface } from '@/lib/surfaces';
import { cn } from '@/lib/utils';

interface Props {
  current: Surface;
  onChange: (s: Surface) => void;
  count?: Partial<Record<Surface, number>>;
}

export default function SurfaceTabs({ current, onChange, count }: Props) {
  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border bg-muted/30 p-0.5">
      {surfaceOrder.map(id => {
        const meta = surfaceMeta[id];
        const Icon = meta.icon;
        const isActive = current === id;
        const c = count?.[id];
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'flex items-center gap-1.5 rounded px-2 py-1 text-xs transition',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3 w-3" />
            <span>{meta.label}</span>
            {c !== undefined && c > 0 && (
              <span
                className={cn(
                  'ml-0.5 font-mono text-[10px]',
                  isActive ? 'text-muted-foreground' : 'text-muted-foreground/60',
                )}
              >
                {c}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
