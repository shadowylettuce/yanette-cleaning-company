'use client' // tells Next.js this component runs in the browser, not on the server

// PopupCard.js — the reusable frosted card used for every "beat" of the cinematic landing
// (Who We Are, How It Works, How to Pay, Reviews, Contact).
// On desktop GSAP pops each card in with a scale/opacity spring; on mobile they simply stack.
// This component is purely presentational — it just gives every beat the same polished look.

// title   = the heading shown at the top of the card
// children = whatever body content that beat needs (text, steps, payment rows, etc.)
// className = extra positioning classes the parent passes in (e.g. max width)
export default function PopupCard({ title, children, className = '' }) {
  return (
    // frosted white panel: soft blur, rounded corners, light brand border, and a layered green-tinted shadow
    <div
      className={
        'rounded-3xl border border-line bg-white/90 p-7 backdrop-blur-md ' + // surface look
        'shadow-[0_8px_40px_rgba(76,175,130,0.16)] sm:p-9 ' +                  // soft elevated depth
        className
      }
    >
      {/* small brand-green eyebrow line above the title for a crafted, branded feel */}
      <span className="mb-2 block h-1 w-10 rounded-full bg-brand" />
      {/* the beat's heading */}
      <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">{title}</h2>
      {/* the beat's body content */}
      <div className="mt-4 text-muted">{children}</div>
    </div>
  )
}
