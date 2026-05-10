import type { Field } from '../builder/types';

export type Values = Record<string, unknown>;

interface Props {
  field: Field;
  index: number;
  value: unknown;
  onChange: (v: unknown) => void;
}

export default function RunnerField({ field, index, value, onChange }: Props) {
  return (
    <div className={`q${field.encrypted ? ' sealed' : ''}`}>
      <div className="qhead">
        <span className="num">Q{index} · {field.type.replace('_', ' ')}</span>
        <h3>{field.label}</h3>
        {field.required && <span className="req">*</span>}
        {field.encrypted && (
          <span className="seal">
            <LockIcon />
            sealed
          </span>
        )}
      </div>
      {field.help && <p className="qhint">{field.help}</p>}
      <RunnerInput field={field} value={value} onChange={onChange} />
      {field.encrypted && (
        <small style={{ display: 'block', marginTop: 6, fontFamily: 'var(--type)', fontSize: 11, color: 'var(--marker-red)', letterSpacing: '.06em' }}>
          Encrypted in your browser before it leaves. Only the form owner can read it.
        </small>
      )}
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function RunnerInput({ field, value, onChange }: Pick<Props, 'field' | 'value' | 'onChange'>) {
  switch (field.type) {
    case 'short_text':
      return (
        <input
          className="in-text"
          type="text"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
        />
      );

    case 'wallet_address':
      return (
        <input
          className="in-text"
          type="text"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder="0x… (autofill from wallet on submit)"
          style={{ fontFamily: 'var(--mono)', fontSize: 16 }}
        />
      );

    case 'email':
      return (
        <input
          className="in-text"
          type="email"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder="you@where.xyz"
        />
      );

    case 'url':
      return (
        <div className="in-url">
          <span className="pfx">https://</span>
          <input
            type="url"
            value={((value as string) ?? '').replace(/^https?:\/\//, '')}
            onChange={e => onChange(e.target.value ? `https://${e.target.value.replace(/^https?:\/\//, '')}` : '')}
            placeholder="suiscan.xyz/testnet/tx/0x…"
          />
        </div>
      );

    case 'rich_text':
      return (
        <textarea
          className="in-rich"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder="Steps to reproduce, expected vs actual… markdown welcome."
        />
      );

    case 'number':
      return (
        <input
          className="in-text"
          type="number"
          value={value == null ? '' : String(value)}
          onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
          placeholder="0"
        />
      );

    case 'date':
      return (
        <input
          className="in-text"
          type="date"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
        />
      );

    case 'dropdown': {
      const options = field.options ?? [];
      return (
        <div className="opts row" role="radiogroup">
          {options.map(o => {
            const on = value === o;
            return (
              <button
                key={o}
                type="button"
                className={`opt${on ? ' on' : ''}`}
                onClick={() => onChange(o)}
                role="radio"
                aria-checked={on}
              >
                <span className="box round" />
                {o}
              </button>
            );
          })}
        </div>
      );
    }

    case 'checkboxes': {
      const arr = (value as string[]) ?? [];
      const options = field.options ?? [];
      return (
        <div className="opts">
          {options.map(o => {
            const on = arr.includes(o);
            return (
              <button
                key={o}
                type="button"
                className={`opt${on ? ' on' : ''}`}
                onClick={() =>
                  onChange(on ? arr.filter(x => x !== o) : [...arr, o])
                }
              >
                <span className="box" />
                {o}
              </button>
            );
          })}
        </div>
      );
    }

    case 'star_rating': {
      const num = (value as number) ?? 0;
      const scale = field.scale ?? 5;
      const labels = ['', 'terrible', 'meh', 'fine', 'good', 'chef’s kiss'];
      return (
        <div className="stars">
          {Array.from({ length: scale }).map((_, i) => {
            const n = i + 1;
            const on = n <= num;
            return (
              <button
                key={i}
                type="button"
                className={`star${on ? ' on' : ''}`}
                onClick={() => onChange(num === n ? 0 : n)}
                aria-label={`${n} of ${scale}`}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M12 2.5l3 6.6 7.2.7-5.4 4.9 1.6 7.1L12 17.9l-6.4 3.9 1.6-7.1L1.8 9.8 9 9.1z" />
                </svg>
              </button>
            );
          })}
          {num > 0 && (
            <span className="lbl">
              {num} / {scale} — {labels[Math.min(num, labels.length - 1)] ?? ''}
            </span>
          )}
        </div>
      );
    }

    case 'image_upload':
    case 'video_upload': {
      const files = (value as File[]) ?? [];
      const accept = field.type === 'image_upload' ? 'image/*' : 'video/*';
      const multiple = field.type === 'image_upload';
      return (
        <>
          <label className="drop">
            <span className="pic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                <rect x="3" y="4" width="18" height="14" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="M21 16l-5-5-9 9" />
              </svg>
            </span>
            <span className="meta">
              <b>drop {field.type === 'video_upload' ? 'video / mp4' : 'image / png / jpg'}</b>
              <small>
                up to 50 MB · we sign + Quilt-batch with your other answers
                {field.encrypted && <em> · seal threshold 2-of-3</em>}
              </small>
            </span>
            <input
              type="file"
              accept={accept}
              multiple={multiple}
              hidden
              onChange={e => onChange(Array.from(e.target.files ?? []))}
            />
          </label>
          {files.length > 0 && (
            <ul className="uploaded-files" style={{ listStyle: 'none', padding: 0 }}>
              {files.map((f, i) => (
                <li key={i}>
                  · {f.name} ({(f.size / 1024).toFixed(1)} KB)
                </li>
              ))}
            </ul>
          )}
        </>
      );
    }
  }
}
