'use client' // tells Next.js this component runs in the browser, not on the server

// SmokeOverlay.js — full-screen cleaning smoke that GSAP fades in/out between room acts.
// Opacity on the parent .js-smoke wrapper is driven by the scroll timeline; puffs drift via CSS.

// fixed positions for smoke puff ellipses scattered across the scene
const PUFFS = [
  { left: '8%', top: '35%', w: 180, h: 120, delay: '0s' },
  { left: '22%', top: '50%', w: 220, h: 140, delay: '0.4s' },
  { left: '38%', top: '28%', w: 200, h: 130, delay: '0.8s' },
  { left: '52%', top: '45%', w: 240, h: 150, delay: '0.2s' },
  { left: '65%', top: '32%', w: 190, h: 125, delay: '1s' },
  { left: '78%', top: '48%', w: 210, h: 135, delay: '0.6s' },
  { left: '88%', top: '38%', w: 170, h: 110, delay: '1.2s' },
  { left: '30%', top: '62%', w: 230, h: 145, delay: '0.3s' },
  { left: '58%', top: '58%', w: 200, h: 128, delay: '0.9s' },
]

// ─── RENDER ───
export default function SmokeOverlay() {
  return (
    <div className="js-smoke pointer-events-none absolute inset-0 opacity-0">
      <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />
      {PUFFS.map((p, i) => (
        <span
          key={i}
          className="smoke-puff absolute rounded-full bg-white/70"
          style={{
            left: p.left,
            top: p.top,
            width: p.w,
            height: p.h,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  )
}
