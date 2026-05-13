import { cn } from '@/lib/utils';

interface Props {
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * catat brand glyph: handwritten "c" monogram with a Walrus Blue
 * highlighter swipe and a marker-dot completion tick. The container
 * (.glyph / .brand-mini-glyph) provides the dark square card + ink
 * shadow; the SVG below uses currentColor for the c-stroke so it
 * renders in --paper against the dark card.
 *
 *   ┌──────┐
 *   │ ▔▔c ●│  ← highlighter strip, then "c", then marker dot
 *   └──────┘
 */
export default function BrandGlyph({ size = 'md', className }: Props) {
  const klass = size === 'sm' ? 'brand-mini-glyph' : 'glyph';
  return (
    <span className={cn(klass, className)}>
      <svg viewBox="0 0 24 24" fill="none">
        {/* Walrus Blue highlighter behind the letter */}
        <rect x="3.5" y="13" width="17" height="5" rx="1" fill="#9bd2ff" />
        {/* handwritten c — single open arc, currentColor so .glyph
            ink/paper inversion picks it up */}
        <path
          d="M18.5 9.5 C 16 6.5, 9.5 6.5, 7.5 11 C 6 14.5, 9 19, 14.5 19 C 16.5 19, 18.5 18, 19.5 16.5"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* marker dot — completion tick */}
        <circle cx="20" cy="17" r="1.6" fill="#1f6fb2" />
      </svg>
    </span>
  );
}
