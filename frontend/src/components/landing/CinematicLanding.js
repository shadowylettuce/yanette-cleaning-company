'use client' // tells Next.js this component runs in the browser, not on the server

// CinematicLanding.js — the heart of the landing page scroll story.
// DESKTOP: four interior rooms are cleaned via smoke + sparkle transitions (bedroom → bathroom →
//   kitchen → living room), then the crew walks outside for a sunny Contact finale.
// MOBILE / reduced-motion: calm stacked layout with a sunny exterior hero.

import { useEffect, useRef, useState } from 'react' // React tools: side effects, DOM refs, and remembered values
import gsap from 'gsap'                              // the animation engine
import { ScrollTrigger } from 'gsap/ScrollTrigger'  // GSAP plugin that ties animation progress to scroll position
import RoomScene from './RoomScene'                 // illustrated room backdrops (bedroom through exterior)
import Crew from './Crew'                            // the team of women who do the cleaning
import Sparkles from './Sparkles'                    // twinkle burst after each room is cleaned
import SmokeOverlay from './SmokeOverlay'            // full-screen smoke between cleaning acts
import PopupCard from './PopupCard'                  // the reusable frosted card for each beat
import { clientQuotes } from '@/lib/clientQuotes'    // Yanette's real client reviews (verbatim)

gsap.registerPlugin(ScrollTrigger) // turn the ScrollTrigger plugin on (safe to call more than once)

// room keys in scroll order — bedroom first, sunny exterior last
const ROOM_ORDER = ['bedroom', 'bathroom', 'kitchen', 'livingRoom', 'exterior']

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
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia() // matchMedia runs a branch only while its media query is true, and auto-reverts otherwise

      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const pin = sceneRef.current?.querySelector('.js-pin')   // the full-screen element we pin while scrolling
        const crew = sceneRef.current?.querySelector('.js-crew') // the crew wrapper we slide left→right
        const cards = sceneRef.current?.querySelectorAll('.js-popup') // all five message cards in DOM order

        // ── starting states ──
        gsap.set('.js-room', { opacity: 0, xPercent: 0 })                       // hide + center every room layer
        gsap.set('.js-room[data-room="bedroom"]', { opacity: 1 })              // only the messy bedroom is visible at rest
        gsap.set('.js-messy-bedroom', { '--dirty': '0%' })                     // bedroom starts fully messy
        gsap.set('.js-messy-bathroom', { '--dirty': '0%' })                    // other interior rooms start messy (hidden until crossfade)
        gsap.set('.js-messy-kitchen', { '--dirty': '0%' })
        gsap.set('.js-messy-livingRoom', { '--dirty': '0%' })
        gsap.set('.js-crew', { x: 0 })                                         // crew parked at the left edge
        gsap.set('.js-popup', { opacity: 0, scale: 0.9, y: 24 })               // every card hidden until its act
        gsap.set('.js-sparkles', { opacity: 0 })                               // sparkles hidden until a room is cleaned
        gsap.set('.js-smoke', { opacity: 0 })                                   // smoke hidden until the first scroll act

        // timeline duration tokens — tuned so ~1.0 smoke ≈ ~1 second of scrolling feel
        const D = {
          smoke: 1.0,      // smoke fades in
          smokeOut: 0.4,   // smoke fades out
          clean: 0.2,      // mess vanishes quickly once smoke clears
          sparkle: 0.5,    // sparkle burst after clean
          msgIn: 0.6,      // card spring entrance
          hold: 1.6,       // time to read the card while scrolling (longer = calmer, easier to read)
          msgOut: 0.4,     // card exit
          walk: 1.0,       // duration of the room-to-room camera pan (tracking shot)
        }

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: pin,
            start: 'top top',
            end: '+=10800',           // long scroll distance for five acts — more pixels per beat = slower, calmer feel
            pin: pin,
            scrub: 0.8,               // slightly looser catch-up so the animation eases toward the scroll position
            invalidateOnRefresh: true,
          },
        })

        // helper: spring a card IN at `at`, optionally OUT at `outAt`
        const popCard = (index, at, outAt) => {
          const card = cards[index]
          tl.fromTo(card, { opacity: 0, scale: 0.9, y: 24 }, { opacity: 1, scale: 1, y: 0, duration: D.msgIn, ease: 'back.out(1.7)' }, at)
          if (outAt != null) tl.to(card, { opacity: 0, scale: 0.96, y: -12, duration: D.msgOut, ease: 'power2.in' }, outAt)
        }

        // helper: smoke in → smoke out + clean + sparkles for one interior room
        const cleanRoom = (roomKey, sparkleIndex, at) => {
          tl.to('.js-smoke', { opacity: 1, duration: D.smoke, ease: 'power2.in' }, at)
          const clearAt = at + D.smoke
          tl.to('.js-smoke', { opacity: 0, duration: D.smokeOut, ease: 'power2.out' }, clearAt)
          tl.to(`.js-messy-${roomKey}`, { '--dirty': '100%', duration: D.clean }, clearAt)
          tl.to(`.js-sparkles-${sparkleIndex}`, { opacity: 1, duration: D.sparkle }, clearAt)
          return clearAt + D.smokeOut
        }

        // helper: TRACKING SHOT — the room slides past the crew so it reads as the team walking
        // forward into the next room (no snap-back). Old room exits left, new dirty room enters from the right.
        const walkToRoom = (fromRoom, toRoom, at) => {
          const endAt = at + D.walk                                            // when the pan finishes
          // place the incoming room one full screen to the right, fully drawn and ready to slide in
          tl.set(`.js-room[data-room="${toRoom}"]`, { opacity: 1, xPercent: 100 }, at)
          if (toRoom !== 'exterior') {
            tl.set(`.js-messy-${toRoom}`, { '--dirty': '0%' }, at)             // next interior room starts messy
          }
          // pan the camera: current room slides out to the left while the next room slides to center
          tl.to(`.js-room[data-room="${fromRoom}"]`, { xPercent: -100, duration: D.walk, ease: 'power1.inOut' }, at)
          tl.to(`.js-room[data-room="${toRoom}"]`, { xPercent: 0, duration: D.walk, ease: 'power1.inOut' }, at)
          // park the room that left off-screen (hidden + recentered) so it can be reused cleanly later
          tl.set(`.js-room[data-room="${fromRoom}"]`, { opacity: 0, xPercent: 0 }, endAt)
          // crew takes a gentle step forward and settles — sells the walk without traveling/teleporting
          tl.to('.js-crew', { x: 70, duration: D.walk * 0.5, ease: 'power1.out' }, at)
          tl.to('.js-crew', { x: 0, duration: D.walk * 0.5, ease: 'power1.in' }, at + D.walk * 0.5)
          return endAt
        }

        let t = 0 // cursor tracking our position on the master timeline

        // scroll hint fades as soon as the visitor starts the first act
        tl.to('.js-hint', { opacity: 0, duration: 0.5 }, 0.2)

        // ── ACT 1: BEDROOM → Who We Are ──
        t = cleanRoom('bedroom', 0, t)
        popCard(0, t + 0.1, t + 0.1 + D.msgIn + D.hold)
        tl.to('.js-sparkles-0', { opacity: 0, duration: 0.3 }, t + 0.1 + D.msgIn + D.hold)
        t = walkToRoom('bedroom', 'bathroom', t + 0.1 + D.msgIn + D.hold + D.msgOut)

        // ── ACT 2: BATHROOM → How It Works ──
        t = cleanRoom('bathroom', 1, t)
        popCard(1, t + 0.1, t + 0.1 + D.msgIn + D.hold)
        tl.to('.js-sparkles-1', { opacity: 0, duration: 0.3 }, t + 0.1 + D.msgIn + D.hold)
        t = walkToRoom('bathroom', 'kitchen', t + 0.1 + D.msgIn + D.hold + D.msgOut)

        // ── ACT 3: KITCHEN → How to Pay ──
        t = cleanRoom('kitchen', 2, t)
        popCard(2, t + 0.1, t + 0.1 + D.msgIn + D.hold)
        tl.to('.js-sparkles-2', { opacity: 0, duration: 0.3 }, t + 0.1 + D.msgIn + D.hold)
        t = walkToRoom('kitchen', 'livingRoom', t + 0.1 + D.msgIn + D.hold + D.msgOut)

        // ── ACT 4: LIVING ROOM → Customer Reviews ──
        t = cleanRoom('livingRoom', 3, t)
        popCard(3, t + 0.1, t + 0.1 + D.msgIn + D.hold)
        tl.to('.js-sparkles-3', { opacity: 0, duration: 0.3 }, t + 0.1 + D.msgIn + D.hold)

        // ── ACT 5: EXTERIOR → Contact (crew done, sunny day) ──
        const extStart = t + 0.1 + D.msgIn + D.hold + D.msgOut
        // same tracking-shot pan: living room slides out left, the sunny exterior slides in from the right
        tl.set('.js-room[data-room="exterior"]', { opacity: 1, xPercent: 100 }, extStart)
        tl.to('.js-room[data-room="livingRoom"]', { xPercent: -100, duration: D.walk, ease: 'power1.inOut' }, extStart)
        tl.to('.js-room[data-room="exterior"]', { xPercent: 0, duration: D.walk, ease: 'power1.inOut' }, extStart)
        tl.set('.js-room[data-room="livingRoom"]', { opacity: 0, xPercent: 0 }, extStart + D.walk)
        // the crew strolls out onto the lawn and stays put (smooth tween to ~35% — no snap)
        tl.to('.js-crew', { x: () => (pin.offsetWidth - crew.offsetWidth) * 0.35, duration: D.walk, ease: 'power1.inOut' }, extStart)
        popCard(4, extStart + D.walk + 0.2) // Contact pops in and stays — no exit tween
      })
    }, sceneRef)

    return () => ctx.revert()
  }, [])

  // ─── RENDER HELPERS (beat bodies, reused by BOTH desktop overlay and mobile stack) ───
  const HowItWorksBody = () => (
    <ol className="space-y-3">
      {[
        { n: '1', title: t.step1Title, desc: t.step1Desc },
        { n: '2', title: t.step2Title, desc: t.step2Desc },
        { n: '3', title: t.step3Title, desc: t.step3Desc },
      ].map((s) => (
        <li key={s.n} className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{s.n}</span>
          <span><span className="font-semibold text-ink">{s.title}</span> — {s.desc}</span>
        </li>
      ))}
    </ol>
  )

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

  const ReviewsBody = () => (
    <div className="space-y-3">
      {clientQuotes.slice(0, 3).map((r) => (
        <figure key={r.name} className="rounded-2xl border border-line bg-card px-4 py-3">
          <div className="text-accent">★★★★★</div>
          <blockquote className="mt-1 line-clamp-4 text-sm italic">&ldquo;{r.quote}&rdquo;</blockquote>
          <figcaption className="mt-1 text-xs font-semibold text-muted">{r.name}</figcaption>
        </figure>
      ))}
    </div>
  )

  const ContactBody = () => (
    <div className="space-y-2">
      <p className="text-lg text-ink">📞 (510) 830-8437</p>
      <p className="text-lg text-ink">✉️ yanettecleaningservice@gmail.com</p>
      <p className="text-sm text-muted">{t.serviceArea}</p>
    </div>
  )

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
      <section ref={sceneRef} className={reduced ? 'hidden' : 'hidden md:block'} aria-label={t.sceneAriaLabel}>
        <div className="js-pin relative h-screen w-full overflow-hidden bg-card">
          {/* ── ROOM LAYERS (bedroom → bathroom → kitchen → living room → exterior) ── */}
          {ROOM_ORDER.map((room) => (
            <div key={room} className="js-room absolute inset-0 z-0" data-room={room}>
              <RoomScene room={room} dirty="0%" messyClassName={`js-messy js-messy-${room}`} />
            </div>
          ))}

          {/* ── SPARKLE BURSTS (one per interior room act) ── */}
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`js-sparkles js-sparkles-${i} absolute inset-0 z-10 opacity-0`}>
              <Sparkles />
            </div>
          ))}

          {/* ── SMOKE OVERLAY (between acts) ── */}
          <div className="absolute inset-0 z-[15]">
            <SmokeOverlay />
          </div>

          {/* ── CREW (walks left→right between rooms) ── */}
          <div className="js-crew absolute bottom-[4%] left-0 z-20 h-[34vh] w-[230px]">
            <Crew />
          </div>

          {/* ── MESSAGE CARDS (one visible at a time) ── */}
          {beats.map((b) => (
            <div key={b.key} className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-6">
              <div className="js-popup pointer-events-auto w-full max-w-xl">
                <PopupCard title={b.title}>{b.body}</PopupCard>
              </div>
            </div>
          ))}

          {/* ── SCROLL HINT ── */}
          <div className="js-hint absolute bottom-6 left-1/2 z-30 -translate-x-1/2 text-center text-sm font-semibold text-muted">
            <p>{t.scrollHint}</p>
            <p className="mt-1 animate-bounce text-brand">↓</p>
          </div>
        </div>
      </section>

      {/* ══════════ MOBILE / REDUCED-MOTION FALLBACK ══════════ */}
      <section className={reduced ? 'block' : 'md:hidden'} aria-label={t.sceneAriaLabel}>
        <div className="relative h-[58vh] w-full overflow-hidden bg-card">
          <RoomScene room="exterior" />
          <div className="absolute bottom-[4%] left-1/2 h-[26vh] w-[120px] -translate-x-1/2">
            <Crew />
          </div>
          <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
            <div className="w-full max-w-md">
              <PopupCard title={beats[0].title}>{beats[0].body}</PopupCard>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-5 py-10">
          {beats.slice(1).map((b) => (
            <PopupCard key={b.key} title={b.title}>{b.body}</PopupCard>
          ))}
        </div>
      </section>
    </>
  )
}
