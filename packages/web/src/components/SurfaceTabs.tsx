import { surfaceMeta, surfaceOrder, type Surface } from '@/lib/surfaces';

interface Props {
  current: Surface;
  onChange: (s: Surface) => void;
  count?: Partial<Record<Surface, number>>;
}

const ORDS: Record<Surface, string> = {
  builder: '01',
  runner: '02',
  admin: '03',
};

const LABELS: Record<Surface, string> = {
  builder: 'Builder',
  runner: 'Submit',
  admin: 'Inbox',
};

export default function SurfaceTabs({ current, onChange, count }: Props) {
  return (
    <div className="tabs">
      {surfaceOrder.map(id => {
        const isActive = current === id;
        const c = count?.[id];
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`tab${isActive ? ' active' : ''}`}
          >
            <span className="ord">{ORDS[id]}</span>
            {LABELS[id]}
            {c !== undefined && c > 0 && <span className="badge">{c}</span>}
          </button>
        );
      })}
      {/* Hidden: ensure surfaceMeta types stay referenced if surfaceMeta changes */}
      <span style={{ display: 'none' }} aria-hidden>
        {surfaceMeta[current].label}
      </span>
    </div>
  );
}
