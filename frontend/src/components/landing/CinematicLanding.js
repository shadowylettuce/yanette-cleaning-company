'use client' // tells Next.js this component runs in the browser, not on the server

// CinematicLanding.js — the heart of the new landing page.
// DESKTOP: the kitchen is pinned full-screen and, as the visitor scrolls, a crew of women
//   wipes it clean left→right while info "beats" pop in between cleaning moments, ending in sparkles.
// MOBILE / reduced-motion: the same content is shown as a calm, already-clean stacked layout (no scroll-jacking).

import { useEffect, useRef, useState } from 'react' // React tools: side effects, DOM refs, and remembered values
import gsap from 'gsap'                              // the animation engine
import { ScrollTrigger } from 'gsap/ScrollTrigger'  // GSAP plugin that ties animation progress to scroll position
import KitchenScene from './KitchenScene'           // the messy/clean kitchen illustration
import Crew from './Crew'                            // the team of women who do the cleaning
import Sparkles from './Sparkles'                    // the end-of-scroll twinkle field
import PopupCard from './PopupCard'                  // the reusable frosted card for each beat

gsap.registerPlugin(ScrollTrigger) // turn the ScrollTrigger plugin on (safe to call more than once)

export default function CinematicLanding({ t }) {
  // ─── STATE ───
  const sceneRef = useRef(null)     // points at the desktop cinematic block — scopes all GSAP selectors to it
  const [reduced, setReduced] = useState(false) // true when the visitor asked the OS for reduced motion

  // ─── EFFECTS ───
  useEffect(() => {                                                   // runs once after the component mounts in the browser
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')  // ask the OS whether the user prefers reduced motion
    setReduced(mq.matches)                                            // remember the answer so we can pick the calm layout
    const onChange = (e) => setReduced(e.matches)                     // keep up to date if they change the setting live
    mq.addEventListener('change', onChange)                           // listen for that change
    return () => mq.removeEventListener('change', onChange)           // clean up the listener when we unmount
  }, [])

  useEffect(() => {                                  // builds (and later tears down) the whole desktop scroll animation
    // gsap.context scopes every '.js-*' selector below to inside the desktop block and gives us one-call cleanup
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia() // matchMedia runs a branch only while its media query is true, and auto-reverts otherwise

      // DESKTOP + real motion only: wide screens where the user has NOT asked for reduced motion
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const pin = sceneRef.current?.querySelector('.js-pin') // the full-screen element we pin in place while scrolling
        const crew = sceneRef.current?.querySelector('.js-crew') // the crew wrapper we slide left→right

        // starting states: mess fully present, crew at far left, every card + the sparkles hidden
        gsap.set('.js-messy', { '--dirty': '0%' })                       // 0% cleaned = whole kitchen is messy
        gsap.set('.js-crew', { x: 0 })                                   // crew parked at the left edge
        gsap.set('.js-popup', { opacity: 0, scale: 0.9, y: 24 })         // cards start invisible + slightly small/low
        gsap.set(sceneRef.current.querySelector('.js-popup'), { opacity: 1, scale: 1, y: 0 }) // ...except Who We Are: visible the moment you land
        gsap.set('.js-sparkles', { opacity: 0 })                         // no sparkles until the very end

        // master timeline: its progress (0→1) is driven directly by scroll thanks to scrollTrigger.scrub
        const tl = gsap.timeline({
          defaults: { ease: 'none' }, // most tweens move linearly with the scroll wheel
          scrollTrigger: {
            trigger: pin,             // watch the pinned element
            start: 'top top',         // begin when its top reaches the top of the viewport
            end: '+=4500',            // run the whole story over 4500px of scrolling
            pin: pin,                 // freeze the kitchen on screen for that whole distance
            scrub: 0.6,               // tie animation to scroll with a touch of smoothing
            invalidateOnRefresh: true, // recompute pixel distances (like the crew's travel) on resize
          },
        })

        // CONTINUOUS over the whole scroll: wipe the mess away AND walk the crew to the right edge
        tl.to('.js-messy', { '--dirty': '100%', duration: 10 }, 0)                           // mess clears left→right
          .to('.js-crew', { x: () => pin.offsetWidth - crew.offsetWidth, duration: 10 }, 0)  // crew travels to the far right

        // helper: pop a card IN at `inAt`, and (optionally) pop it back OUT at `outAt`
        const beat = (index, inAt, outAt) => {
          const card = sceneRef.current.querySelectorAll('.js-popup')[index] // the card for this beat, in DOM order
          // spring-style entrance using only transform + opacity (back.out ≈ our brand spring easing)
          tl.fromTo(card, { opacity: 0, scale: 0.9, y: 24 }, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.7)' }, inAt)
          if (outAt != null) tl.to(card, { opacity: 0, scale: 0.96, y: -12, duration: 0.4, ease: 'power2.in' }, outAt) // quicker exit
        }

        // the five beats, spaced apart so the crew's cleaning animation shows in the GAPS between cards
        // Who We Are is already visible at rest (set above), so it only needs an EXIT as cleaning begins
        tl.to(sceneRef.current.querySelector('.js-popup'), { opacity: 0, scale: 0.96, y: -12, duration: 0.5, ease: 'power2.in' }, 1.4)
        beat(1, 2.4, 3.8)   // How It Works
        beat(2, 4.6, 6.0)   // How to Pay
        beat(3, 6.8, 8.2)   // Customer Reviews
        beat(4, 8.8)        // Contact — pops in last and STAYS to the end

        // the little "scroll to clean" hint fades away as soon as cleaning starts
        tl.to('.js-hint', { opacity: 0, duration: 0.5 }, 0.4)

        // SPARKLES: only fade in during the final stretch, after the whole kitchen is clean
        tl.to('.js-sparkles', { opacity: 1, duration: 0.8 }, 9.2)
      })
    }, sceneRef) // ← scope

    return () => ctx.revert() // undo every animation, pin, and inline style this effect created
  }, [])

  // ─── RENDER HELPERS (beat bodies, reused by BOTH desktop overlay and mobile stack) ───
  // How It Works — the three numbered steps
  const HowItWorksBody = () => (
    <ol className="space-y-3">
      {[
        { n: '1', title: t.step1Title, desc: t.step1Desc },
        { n: '2', title: t.step2Title, desc: t.step2Desc },
        { n: '3', title: t.step3Title, desc: t.step3Desc },
      ].map((s) => (
        <li key={s.n} className="flex gap-3">
          {/* small green step number */}
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{s.n}</span>
          <span><span className="font-semibold text-ink">{s.title}</span> — {s.desc}</span>
        </li>
      ))}
    </ol>
  )

  // How to Pay — the three accepted methods plus the "card payments coming soon" note
  const HowToPayBody = () => (
    <div className="space-y-3">
      {[
        { label: t.payCash, desc: t.payCashDesc },
        { label: t.payZelle, desc: t.payZelleDesc },
        { label: t.payVenmo, desc: t.payVenmoDesc },
      ].map((p) => (
        <div key={p.label} className="rounded-2xl border border-line bg-card px-4 py-3">
          <span className="font-semibold text-ink">{p.label}</span>
          <span className="block text-sm">{p.desc}</span>
        </div>
      ))}
      <p className="text-sm italic text-accent">{t.payCardSoon}</p>
    </div>
  )

  // Customer Reviews — show the first three quotes from the translation list
  const ReviewsBody = () => (
    <div className="space-y-3">
      {t.testimonialsList.slice(0, 3).map((r) => (
        <figure key={r.name} className="rounded-2xl border border-line bg-card px-4 py-3">
          <div className="text-accent">★★★★★</div>
          <blockquote className="mt-1 text-sm italic">&ldquo;{r.quote}&rdquo;</blockquote>
          <figcaption className="mt-1 text-xs font-semibold text-muted">{r.name}</figcaption>
        </figure>
      ))}
    </div>
  )

  // Contact — phone, email, service area, and the booking call-to-action
  const ContactBody = () => (
    <div className="space-y-2">
      <p className="text-lg text-ink">📞 (555) 555-5555</p>
      <p className="text-lg text-ink">✉️ hello@yanettescleaning.com</p>
      <p className="text-sm text-muted">{t.serviceArea}</p>
      {/* booking CTA — placeholder tel link until Yanette confirms her real number */}
      <a
        href="tel:+15555555555"
        className="mt-3 inline-block rounded-full bg-brand px-7 py-3 font-semibold text-white transition-transform duration-200 ease-out hover:scale-[1.03] focus-visible:scale-[1.03] focus-visible:outline-none active:scale-95"
      >
        {t.bookCleaning}
      </a>
    </div>
  )

  // the five beats in order — title + body — so desktop and mobile stay perfectly in sync
  const beats = [
    { key: 'who', title: t.whoWeAreTitle, body: <p className="text-base leading-relaxed">{t.whoWeAreDesc}</p> },
    { key: 'how', title: t.howItWorksTitle, body: <HowItWorksBody /> },
    { key: 'pay', title: t.howToPayTitle, body: <HowToPayBody /> },
    { key: 'reviews', title: t.testimonialsTitle, body: <ReviewsBody /> },
    { key: 'contact', title: t.contactTitle, body: <ContactBody /> },
  ]

  // ─── RENDER ───
  return (
    <>
      {/* ══════════ DESKTOP CINEMATIC (wide screens, motion allowed) ══════════ */}
      {/* hidden on mobile; also hidden when the user prefers reduced motion (they get the calm layout below) */}
      <section ref={sceneRef} className={reduced ? 'hidden' : 'hidden md:block'} aria-label={t.sceneAriaLabel}>
        {/* this element is what GSAP pins on screen for the whole 4500px of scrolling */}
        <div className="js-pin relative h-screen w-full overflow-hidden bg-card">
          {/* layer 0 — the kitchen, starting fully messy (--dirty 0%) */}
          <KitchenScene dirty="0%" />

          {/* layer 10 — sparkles, hidden until the end */}
          <div className="js-sparkles absolute inset-0 z-10">
            <Sparkles />
          </div>

          {/* layer 20 — the crew, parked at the left, walks right as you scroll */}
          <div className="js-crew absolute bottom-[4%] left-0 z-20 h-[34vh] w-[230px]">
            <Crew />
          </div>

          {/* layer 30 — the five beats, each centered and stacked; only one is visible at a time */}
          {beats.map((b) => (
            <div key={b.key} className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-6">
              <div className="js-popup pointer-events-auto w-full max-w-xl">
                <PopupCard title={b.title}>{b.body}</PopupCard>
              </div>
            </div>
          ))}

          {/* the gentle scroll hint at the bottom — fades out the moment cleaning begins */}
          <div className="js-hint absolute bottom-6 left-1/2 z-30 -translate-x-1/2 text-center text-sm font-semibold text-muted">
            <p>{t.scrollHint}</p>
            <p className="mt-1 animate-bounce text-brand">↓</p>
          </div>
        </div>
      </section>

      {/* ══════════ MOBILE / REDUCED-MOTION FALLBACK (calm, already-clean, stacked) ══════════ */}
      <section className={reduced ? 'block' : 'md:hidden'} aria-label={t.sceneAriaLabel}>
        {/* a clean kitchen hero with the team finished and a few sparkles */}
        <div className="relative h-[58vh] w-full overflow-hidden bg-card">
          {/* dirty="100%" means the mess is fully clipped away — the kitchen is spotless */}
          <KitchenScene dirty="100%" />
          <Sparkles />
          {/* crew standing finished on the right, ready to leave */}
          <div className="absolute bottom-[4%] right-3 h-[26vh] w-[120px]">
            <Crew />
          </div>
          {/* Who We Are intro sits over the hero */}
          <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
            <div className="w-full max-w-md">
              <PopupCard title={beats[0].title}>{beats[0].body}</PopupCard>
            </div>
          </div>
        </div>

        {/* the remaining beats stacked normally for easy reading on a phone */}
        <div className="space-y-6 px-5 py-10">
          {beats.slice(1).map((b) => (
            <PopupCard key={b.key} title={b.title}>{b.body}</PopupCard>
          ))}
        </div>
      </section>
    </>
  )
}
