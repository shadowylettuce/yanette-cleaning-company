'use client' // tells Next.js this component runs in the browser, not on the server

// QuotesSection.js — a dedicated band of real client testimonials, shown below the cinematic
// scroll-to-clean experience on the landing page. The quotes vary a lot in length, so we use a
// CSS-columns "masonry" layout: each card sizes to its own text and the columns stay balanced
// instead of every card stretching to match the tallest one. Quote text comes verbatim from
// clientQuotes (never translated); only the heading switches language via the `t` prop.

import { clientQuotes } from '@/lib/clientQuotes' // the real reviews, kept word-for-word

export default function QuotesSection({ t }) {
  // ─── RENDER ───
  return (
    // ── CLIENT QUOTES ──
    // soft layered radial gradients give the band a little depth so it reads as its own section,
    // not just more white page; colors are low-opacity tints of the brand green + blue accent
    <section
      aria-label={t.testimonialsTitle} // screen-reader label for the whole section
      className="relative px-6 py-20 sm:py-24" // generous vertical breathing room, comfortable side padding
      style={{
        background:
          'radial-gradient(60% 50% at 15% 0%, rgba(76,175,130,0.07), transparent 70%), radial-gradient(55% 45% at 90% 100%, rgba(91,175,214,0.07), transparent 70%)', // two faint brand-tinted glows, top-left + bottom-right
      }}
    >
      {/* centered intro: small brand eyebrow, then the translated heading */}
      <div className="mx-auto mb-12 max-w-2xl text-center">
        {/* small uppercase eyebrow tying the section to the brand */}
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Yanette&apos;s Cleaning Service</span>
        {/* the section heading — only this text is translated (EN/ES) */}
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{t.testimonialsTitle}</h2>
        {/* short brand underline under the heading for a finished, intentional look */}
        <span className="mx-auto mt-4 block h-1 w-12 rounded-full bg-brand" />
      </div>

      {/* the masonry grid: 1 column on phones, 2 on tablets, 3 on desktop.
          `gap-6` sets the column gutter; each card adds its own bottom margin for the vertical gap. */}
      <div className="mx-auto max-w-6xl columns-1 gap-6 sm:columns-2 lg:columns-3">
        {clientQuotes.map((r) => ( // one card per real review
          // `break-inside-avoid` keeps a card from being split across two columns; `mb-6` is the row gap.
          // hover lift animates ONLY transform (never transition-all) with spring-style easing.
          <figure
            key={r.name} // names are unique in the source list, so they make a stable key
            className="relative mb-6 break-inside-avoid overflow-hidden rounded-2xl border border-line bg-card p-6 shadow-[0_4px_24px_rgba(76,175,130,0.08)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(76,175,130,0.16)]"
          >
            {/* signature detail: an oversized quotation mark in faint brand green sitting behind the text */}
            <span aria-hidden="true" className="pointer-events-none absolute -top-3 right-3 select-none font-serif text-7xl leading-none text-brand/10">&rdquo;</span>

            {/* five-star rating in the blue accent color, matching the cinematic reviews beat */}
            <div className="text-accent" aria-label="Five out of five stars">★★★★★</div>

            {/* the review itself — shown in full, exactly as the client wrote it */}
            <blockquote className="relative mt-3 text-[15px] italic leading-relaxed text-ink/90">&ldquo;{r.quote}&rdquo;</blockquote>

            {/* the client's name, with a tiny brand tick before it */}
            <figcaption className="mt-4 flex items-center gap-2 text-sm font-semibold text-muted">
              <span className="h-px w-5 bg-brand" /> {/* short brand rule that points to the name */}
              {r.name}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
