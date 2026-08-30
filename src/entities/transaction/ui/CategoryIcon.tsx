import { createElement } from 'react';

import { cn } from '@/shared/lib/cn';

import type { Category } from '../model/types';
import { CATEGORY_COLORS, CATEGORY_ICONS } from './categoryTheme';

interface CategoryIconProps {
  category: Category;
  /** 40px everywhere; 32px (STYLEGUIDE §4's h-8 w-8) inside dropdown option rows. */
  size?: 'default' | 'sm';
  className?: string;
}

const SIZE_CLASSES = { default: 'h-10 w-10', sm: 'h-8 w-8' } as const;
const GLYPH_SIZE = { default: 20, sm: 16 } as const;

/**
 * A solid saturated disc with a white glyph, never a tinted low-alpha treatment — that
 * saturation is what keeps a long category list scannable at a glance (STYLEGUIDE §4). The icon
 * is read out of a static map with `createElement`, not a capitalised binding, so this doesn't
 * trip `react-hooks/static-components`.
 */
export function CategoryIcon({ category, size = 'default', className }: CategoryIconProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full text-white',
        SIZE_CLASSES[size],
        className,
      )}
      style={{ backgroundColor: CATEGORY_COLORS[category] }}
    >
      {createElement(CATEGORY_ICONS[category], { size: GLYPH_SIZE[size], strokeWidth: 2 })}
    </span>
  );
}
