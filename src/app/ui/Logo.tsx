const WORDMARK = 'zenfi';

/**
 * Adapted from docs/components/zenfi_logo_z_v8_shift_right.html: same three polygon facets,
 * same wordmark cascade, same cubic-bezier curve — restaggered by animation-duration instead of
 * animation-delay (see the --animate-logo-* tokens in index.css). The source staggers with
 * animation-delay, which is exactly the shape ROADMAP §5.3 warns about: an opacity:0 keyframe
 * that a backgrounded tab can leave stranded for as long as the delay lasts. Here everything
 * starts at once and settles in sequence instead, so an unplayed animation still renders the
 * mark correctly.
 *
 * The source's dark wordmark (#0f172a) is swapped for the app's own light text token — it was
 * sized and coloured for a white demo card, not a true-black navbar.
 */
export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden className="block aspect-[400/340] h-7 shrink-0 sm:h-8">
        <svg
          viewBox="0 0 400 340"
          className="h-full w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* The mark's own three brand colours, not reusable tokens — literal hex here is the
              same sanctioned exception as the category series (STYLEGUIDE §2). */}
          <polygon
            points="170,200 370,200 260,310 60,310"
            fill="#5B21D6"
            className="animate-logo-purple"
          />
          <polygon
            points="170,200 300,200 177,235"
            fill="#241259"
            className="animate-logo-shadow"
          />
          <polygon
            points="150,90 350,90 240,200 40,200"
            fill="#0B93F6"
            className="animate-logo-blue"
          />
        </svg>
      </span>
      <span className="font-logo flex overflow-hidden text-sm font-extralight tracking-[0.16em] text-text-primary sm:text-base">
        {WORDMARK.split('').map((letter, index) => (
          <span
            key={letter + index}
            className="animate-logo-letter inline-block"
            style={{ animationDuration: `${350 + index * 90}ms` }}
          >
            {letter}
          </span>
        ))}
      </span>
    </div>
  );
}
