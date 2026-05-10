import { cn } from '@/lib/utils';

interface Props {
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * catat brand glyph: rotated dark square with red drop-shadow + paper-color check.
 * Use `size='sm'` (30px) inside thinbars, `size='md'` (38px) in main nav.
 */
export default function BrandGlyph({ size = 'md', className }: Props) {
  const klass = size === 'sm' ? 'brand-mini-glyph' : 'glyph';
  return (
    <span className={cn(klass, className)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 7.5A8 8 0 1 0 19 16.5" />
        <path d="M11 12.2l2.4 2.4 5.6-6" />
      </svg>
    </span>
  );
}
