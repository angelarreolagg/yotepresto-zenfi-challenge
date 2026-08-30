import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

/**
 * A card whose border lights up in a cone: it follows the pointer on hover, and runs one scripted
 * sweep whenever `animated` flips to true.
 *
 * Four changes from the source, all forced and none cosmetic:
 *  - `animateValue` returns a cancel function and the effect cancels on cleanup. Without it a
 *    re-trigger leaves the previous sweep's frame loops running, and two chains fight over the
 *    same angle — which is exactly what re-running the analysis does here.
 *  - That cleanup also returns the border to rest, because a sweep cancelled part-way otherwise
 *    parks a lit arc on the card until the next one finishes.
 *  - The two `setState` calls that opened the sweep moved into a frame callback. Called straight
 *    from the effect body they cascade a render on mount and the hook lint rejects them.
 *  - Index reads are guarded, because this project compiles with `noUncheckedIndexedAccess`.
 */

interface BorderGlowProps {
  children?: ReactNode;
  className?: string;
  edgeSensitivity?: number;
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  /** Flipping this to true runs one sweep. Flipping it back and forth runs it again. */
  animated?: boolean;
  colors?: string[];
  fillOpacity?: number;
}

const FALLBACK_COLOR = '#c084fc';

function parseHSL(hslStr: string): { h: number; s: number; l: number } {
  const [, h, s, l] = /([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/.exec(hslStr) ?? [];
  if (h === undefined || s === undefined || l === undefined) return { h: 40, s: 80, l: 80 };
  return { h: parseFloat(h), s: parseFloat(s), l: parseFloat(l) };
}

function buildBoxShadow(glowColor: string, intensity: number): string {
  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  const layers: [number, number, number, number, number, boolean][] = [
    [0, 0, 0, 1, 100, true],
    [0, 0, 1, 0, 60, true],
    [0, 0, 3, 0, 50, true],
    [0, 0, 6, 0, 40, true],
    [0, 0, 15, 0, 30, true],
    [0, 0, 25, 2, 20, true],
    [0, 0, 50, 2, 10, true],
    [0, 0, 1, 0, 60, false],
    [0, 0, 3, 0, 50, false],
    [0, 0, 6, 0, 40, false],
    [0, 0, 15, 0, 30, false],
    [0, 0, 25, 2, 20, false],
    [0, 0, 50, 2, 10, false],
  ];
  return layers
    .map(([x, y, blur, spread, alpha, inset]) => {
      const a = Math.min(alpha * intensity, 100);
      return `${inset ? 'inset ' : ''}${x}px ${y}px ${blur}px ${spread}px hsl(${base} / ${a}%)`;
    })
    .join(', ');
}

function easeOutCubic(x: number) {
  return 1 - (1 - x) ** 3;
}

function easeInCubic(x: number) {
  return x * x * x;
}

interface AnimateOpts {
  start?: number;
  end?: number;
  duration?: number;
  delay?: number;
  ease?: (t: number) => number;
  onUpdate: (v: number) => void;
  onEnd?: () => void;
}

/** Returns its own cancel. Every frame loop in this file has to be stoppable. */
function animateValue({
  start = 0,
  end = 100,
  duration = 1000,
  delay = 0,
  ease = easeOutCubic,
  onUpdate,
  onEnd,
}: AnimateOpts): () => void {
  let frame = 0;
  let cancelled = false;

  const timer = window.setTimeout(() => {
    const t0 = performance.now();
    const tick = () => {
      if (cancelled) return;
      const t = Math.min((performance.now() - t0) / duration, 1);
      onUpdate(start + (end - start) * ease(t));
      if (t < 1) frame = requestAnimationFrame(tick);
      else onEnd?.();
    };
    frame = requestAnimationFrame(tick);
  }, delay);

  return () => {
    cancelled = true;
    window.clearTimeout(timer);
    cancelAnimationFrame(frame);
  };
}

const GRADIENT_POSITIONS = [
  '80% 55%',
  '69% 34%',
  '8% 6%',
  '41% 38%',
  '86% 85%',
  '82% 18%',
  '51% 4%',
];
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

function buildMeshGradients(colors: string[]): string[] {
  const gradients = GRADIENT_POSITIONS.map((position, index) => {
    const slot = Math.min(COLOR_MAP[index] ?? 0, colors.length - 1);
    const color = colors[slot] ?? FALLBACK_COLOR;
    return `radial-gradient(at ${position}, ${color} 0px, transparent 50%)`;
  });
  gradients.push(`linear-gradient(${colors[0] ?? FALLBACK_COLOR} 0 100%)`);
  return gradients;
}

function isLightColor(color: string): boolean {
  const value = color.trim().replace('#', '');
  if (!/^[\da-f]{3}([\da-f]{3})?$/i.test(value)) return false;

  const hex =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value;
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  return red * 0.2126 + green * 0.7152 + blue * 0.0722 > 180;
}

const BorderGlow = ({
  children,
  className = '',
  edgeSensitivity = 30,
  glowColor = '40 80 80',
  backgroundColor = '#120F17',
  borderRadius = 28,
  glowRadius = 40,
  glowIntensity = 1.0,
  coneSpread = 25,
  animated = false,
  colors = ['#c084fc', '#f472b6', '#38bdf8'],
  fillOpacity = 0.5,
}: BorderGlowProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [cursorAngle, setCursorAngle] = useState(45);
  const [edgeProximity, setEdgeProximity] = useState(0);
  const [sweepActive, setSweepActive] = useState(false);

  const getCenterOfElement = useCallback((el: HTMLElement) => {
    const { width, height } = el.getBoundingClientRect();
    return [width / 2, height / 2];
  }, []);

  const getEdgeProximity = useCallback(
    (el: HTMLElement, x: number, y: number) => {
      const [cx = 0, cy = 0] = getCenterOfElement(el);
      const dx = x - cx;
      const dy = y - cy;
      let kx = Infinity;
      let ky = Infinity;
      if (dx !== 0) kx = cx / Math.abs(dx);
      if (dy !== 0) ky = cy / Math.abs(dy);
      return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
    },
    [getCenterOfElement],
  );

  const getCursorAngle = useCallback(
    (el: HTMLElement, x: number, y: number) => {
      const [cx = 0, cy = 0] = getCenterOfElement(el);
      const dx = x - cx;
      const dy = y - cy;
      if (dx === 0 && dy === 0) return 0;

      let degrees = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (degrees < 0) degrees += 360;
      return degrees;
    },
    [getCenterOfElement],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setEdgeProximity(getEdgeProximity(card, x, y));
      setCursorAngle(getCursorAngle(card, x, y));
    },
    [getEdgeProximity, getCursorAngle],
  );

  useEffect(() => {
    if (!animated) return;

    const angleStart = 110;
    const angleEnd = 465;
    const at = (v: number) => (angleEnd - angleStart) * (v / 100) + angleStart;

    // Opening the sweep from a frame callback rather than the effect body: called synchronously
    // there it costs a render on every mount and the hook lint rejects it.
    const open = requestAnimationFrame(() => {
      setSweepActive(true);
      setCursorAngle(angleStart);
    });

    const cancels = [
      animateValue({ duration: 500, onUpdate: (v) => setEdgeProximity(v / 100) }),
      animateValue({
        ease: easeInCubic,
        duration: 1500,
        end: 50,
        onUpdate: (v) => setCursorAngle(at(v)),
      }),
      animateValue({
        ease: easeOutCubic,
        delay: 1500,
        duration: 2250,
        start: 50,
        end: 100,
        onUpdate: (v) => setCursorAngle(at(v)),
      }),
      animateValue({
        ease: easeInCubic,
        delay: 2500,
        duration: 1500,
        start: 100,
        end: 0,
        onUpdate: (v) => setEdgeProximity(v / 100),
        onEnd: () => setSweepActive(false),
      }),
    ];

    return () => {
      cancelAnimationFrame(open);
      for (const cancel of cancels) cancel();
      // A sweep cancelled part-way would otherwise keep `sweepActive` true and leave
      // `edgeProximity` wherever it stopped: a bright arc parked on the border for the whole of
      // the next analysis. Re-running is a first-class action here, so it has to land at rest.
      setSweepActive(false);
      setEdgeProximity(0);
    };
  }, [animated]);

  const colorSensitivity = edgeSensitivity + 20;
  const isVisible = isHovered || sweepActive;
  const borderOpacity = isVisible
    ? Math.max(0, (edgeProximity * 100 - colorSensitivity) / (100 - colorSensitivity))
    : 0;
  const glowOpacity = isVisible
    ? Math.max(0, (edgeProximity * 100 - edgeSensitivity) / (100 - edgeSensitivity))
    : 0;

  const meshGradients = buildMeshGradients(colors);
  const borderBg = meshGradients.map((g) => `${g} border-box`);
  const fillBg = meshGradients.map((g) => `${g} padding-box`);
  const angleDeg = `${cursorAngle.toFixed(3)}deg`;
  const lightSurface = isLightColor(backgroundColor);

  const fillMask = [
    'linear-gradient(to bottom, black, black)',
    'radial-gradient(ellipse at 50% 50%, black 40%, transparent 65%)',
    'radial-gradient(ellipse at 66% 66%, black 5%, transparent 40%)',
    'radial-gradient(ellipse at 33% 33%, black 5%, transparent 40%)',
    'radial-gradient(ellipse at 66% 33%, black 5%, transparent 40%)',
    'radial-gradient(ellipse at 33% 66%, black 5%, transparent 40%)',
    `conic-gradient(from ${angleDeg} at center, transparent 5%, black 15%, black 85%, transparent 95%)`,
  ].join(', ');
  const glowMask = `conic-gradient(from ${angleDeg} at center, black 2.5%, transparent 10%, transparent 90%, black 97.5%)`;

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      className={`relative isolate grid border ${className}`}
      style={{
        background: backgroundColor,
        borderColor: lightSurface ? 'rgb(24 24 27 / 12%)' : 'rgb(255 255 255 / 15%)',
        borderRadius: `${borderRadius}px`,
        transform: 'translate3d(0, 0, 0.01px)',
        boxShadow: lightSurface
          ? 'rgb(24 24 27 / 4%) 0 1px 2px, rgb(24 24 27 / 5%) 0 8px 24px'
          : 'rgba(0,0,0,0.1) 0 1px 2px, rgba(0,0,0,0.1) 0 2px 4px, rgba(0,0,0,0.1) 0 4px 8px, rgba(0,0,0,0.1) 0 8px 16px, rgba(0,0,0,0.1) 0 16px 32px, rgba(0,0,0,0.1) 0 32px 64px',
      }}
    >
      {/* mesh gradient border */}
      <div
        className="absolute inset-0 -z-[1] rounded-[inherit]"
        style={
          {
            border: '1px solid transparent',
            background: [
              `linear-gradient(${backgroundColor} 0 100%) padding-box`,
              'linear-gradient(rgb(255 255 255 / 0%) 0% 100%) border-box',
              ...borderBg,
            ].join(', '),
            opacity: borderOpacity,
            maskImage: `conic-gradient(from ${angleDeg} at center, black ${coneSpread}%, transparent ${coneSpread + 15}%, transparent ${100 - coneSpread - 15}%, black ${100 - coneSpread}%)`,
            WebkitMaskImage: `conic-gradient(from ${angleDeg} at center, black ${coneSpread}%, transparent ${coneSpread + 15}%, transparent ${100 - coneSpread - 15}%, black ${100 - coneSpread}%)`,
            transition: isVisible ? 'opacity 0.25s ease-out' : 'opacity 0.75s ease-in-out',
          } as CSSProperties
        }
      />

      {/* mesh gradient fill near edges */}
      <div
        className="absolute inset-0 -z-[1] rounded-[inherit]"
        style={
          {
            border: '1px solid transparent',
            background: fillBg.join(', '),
            maskImage: fillMask,
            WebkitMaskImage: fillMask,
            maskComposite: 'subtract, add, add, add, add, add',
            WebkitMaskComposite:
              'source-out, source-over, source-over, source-over, source-over, source-over',
            opacity: borderOpacity * fillOpacity,
            mixBlendMode: lightSurface ? 'normal' : 'soft-light',
            transition: isVisible ? 'opacity 0.25s ease-out' : 'opacity 0.75s ease-in-out',
          } as CSSProperties
        }
      />

      {/* outer glow */}
      <span
        className="pointer-events-none absolute z-[1] rounded-[inherit]"
        style={
          {
            inset: `${-glowRadius}px`,
            maskImage: glowMask,
            WebkitMaskImage: glowMask,
            opacity: glowOpacity,
            mixBlendMode: lightSurface ? 'normal' : 'plus-lighter',
            transition: isVisible ? 'opacity 0.25s ease-out' : 'opacity 0.75s ease-in-out',
          } as CSSProperties
        }
      >
        <span
          className="absolute rounded-[inherit]"
          style={{ inset: `${glowRadius}px`, boxShadow: buildBoxShadow(glowColor, glowIntensity) }}
        />
      </span>

      <div className="relative z-[1] flex flex-col">{children}</div>
    </div>
  );
};

export default BorderGlow;
