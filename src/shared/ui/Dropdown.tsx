import { ChevronDown } from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';

import { cn } from '@/shared/lib/cn';

export interface DropdownOption<TValue extends string> {
  value: TValue;
  label: string;
  icon?: ReactNode;
  /** Right-aligned secondary text, e.g. how many rows a filter option would leave. */
  meta?: string;
}

interface DropdownProps<TValue extends string> {
  value: TValue | null;
  options: DropdownOption<TValue>[];
  onChange: (value: TValue) => void;
  /** The accessible name, and the trigger text when nothing is selected. */
  label: string;
  /** Overrides `label` as the trigger text when nothing is selected. */
  placeholder?: string;
  variant?: 'filter' | 'title' | 'field';
  /** `end` keeps a wide panel from overflowing the right edge on a narrow screen. */
  align?: 'start' | 'end';
  className?: string;
}

const PANEL_MAX_HEIGHT = 288;
const MIN_PANEL_HEIGHT = 140;
const EDGE_GAP = 16;

interface Placement {
  dropUp: boolean;
  maxHeight: number;
}

const DEFAULT_PLACEMENT: Placement = { dropUp: false, maxHeight: PANEL_MAX_HEIGHT };

/**
 * The nearest ancestor that actually clips, as a top/bottom pair — the viewport when nothing does.
 * An `absolute` panel cannot escape a scroll container, so the room it has is the room inside that
 * box. Measuring against `window.innerHeight` instead is what let the panel open to its full height
 * inside the edit sheet and get cut off by the sheet's own `overflow-y: auto`.
 */
function clippingBounds(element: HTMLElement): { top: number; bottom: number } {
  let node = element.parentElement;
  while (node !== null) {
    if (getComputedStyle(node).overflowY !== 'visible') {
      const rect = node.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom };
    }
    node = node.parentElement;
  }
  return { top: 0, bottom: window.innerHeight };
}

const TRIGGERS = {
  filter:
    'flex w-full items-center justify-between gap-2 rounded-full bg-surface-raised px-3.5 py-2 text-sm text-text-primary',
  title: 'flex items-center gap-1.5 text-base font-bold sm:text-xl lg:text-2xl',
  field:
    'flex w-full items-center justify-between gap-2 rounded-xl bg-surface-raised px-3.5 py-3 text-base text-text-primary',
} as const;

/**
 * The panel is `absolute`, never `fixed`: relative to its own wrapper it cannot be captured by a
 * transformed ancestor, and the bar that hosts it carries the z-index that lifts the whole group
 * above the cards below.
 *
 * Known, accepted gap: click / Tab / Enter / Esc are supported, arrow-key roving focus is not —
 * a deliberate trade for visual control over a native `<select>`.
 */
export const Dropdown = <TValue extends string>({
  value,
  options,
  onChange,
  label,
  placeholder,
  variant = 'filter',
  align = 'start',
  className,
}: DropdownProps<TValue>) => {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<Placement>(DEFAULT_PLACEMENT);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      // `instanceof` rather than a cast: EventTarget is not necessarily a Node.
      if (event.target instanceof Node && wrapper.current?.contains(event.target) === true) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      trigger.current?.focus();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const selected = options.find((option) => option.value === value) ?? null;

  /**
   * The category field sits near the bottom of the edit sheet, where the panel has to fit inside
   * the sheet rather than the screen — hence `clippingBounds` instead of the viewport. Measured in
   * the click handler rather than an effect: the trigger is already laid out, so there is nothing
   * to wait for.
   */
  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }

    const element = trigger.current;
    if (element !== null) {
      const rect = element.getBoundingClientRect();
      const bounds = clippingBounds(element);
      const below = bounds.bottom - rect.bottom - EDGE_GAP;
      const above = rect.top - bounds.top - EDGE_GAP;
      const dropUp = below < Math.min(PANEL_MAX_HEIGHT, above);
      setPlacement({
        dropUp,
        maxHeight: Math.max(Math.min(PANEL_MAX_HEIGHT, dropUp ? above : below), MIN_PANEL_HEIGHT),
      });
    }

    setOpen(true);
  };

  const select = (next: TValue) => {
    onChange(next);
    setOpen(false);
    trigger.current?.focus();
  };

  return (
    <div ref={wrapper} className={cn('relative', className)}>
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={toggle}
        className={TRIGGERS[variant]}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.icon}
          <span className={cn('truncate', selected === null && 'text-text-secondary')}>
            {selected?.label ?? placeholder ?? label}
          </span>
        </span>
        <ChevronDown
          size={variant === 'title' ? 20 : 16}
          className={cn('shrink-0 transition-transform duration-250', open && 'rotate-180')}
        />
      </button>

      {/* Entrance only, and in CSS. An exit animation needs the panel to stay mounted until it
          reports back, and a panel that never reports is an invisible click trap over the page. */}
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          className={cn(
            'scroll-slim absolute z-40 min-w-full overflow-y-auto rounded-xl bg-surface-raised p-1 shadow-2xl',
            placement.dropUp
              ? 'animate-pop-in-up bottom-full mb-2'
              : 'animate-pop-in-down top-full mt-2',
            align === 'end' ? 'right-0' : 'left-0',
            placement.dropUp
              ? align === 'end'
                ? 'origin-bottom-right'
                : 'origin-bottom-left'
              : align === 'end'
                ? 'origin-top-right'
                : 'origin-top-left',
          )}
          style={{ maxHeight: placement.maxHeight }}
        >
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => select(option.value)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm whitespace-nowrap transition-colors',
                  option.value === value
                    ? 'bg-surface-sunken text-text-primary'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                {option.icon}
                <span className="flex-1">{option.label}</span>
                {option.meta !== undefined && (
                  <span className="text-xs tabular-nums text-text-muted">{option.meta}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
