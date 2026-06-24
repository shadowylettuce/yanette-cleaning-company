'use client' // tells Next.js this component runs in the browser, not on the server

// Sparkles.js — twinkle field that bursts in after each interior room is cleaned.
// The parent CinematicLanding keeps each .js-sparkles-N layer hidden until smoke clears,
// then fades it in for that room act. Each sparkle twinkles on its own timing via
// the .sparkle-twinkle class (keyframes live in globals.css).

// fixed scatter of sparkle positions across the scene (percentages of width/height),
// each with its own size and animation delay so they don't all flash at once
const SPARKLES = [
  { left: '12%', top: '22%', size: 26, delay: '0s' },
  { left: '28%', top: '54%', size: 18, delay: '0.6s' },
  { left: '41%', top: '18%', size: 22, delay: '1.1s' },
  { left: '52%', top: '40%', size: 16, delay: '0.3s' },
  { left: '63%', top: '24%', size: 24, delay: '0.9s' },
  { left: '74%', top: '52%', size: 18, delay: '1.4s' },
  { left: '86%', top: '30%', size: 22, delay: '0.5s' },
  { left: '20%', top: '70%', size: 16, delay: '1.2s' },
  { left: '47%', top: '66%', size: 20, delay: '0.2s' },
  { left: '69%', top: '70%', size: 16, delay: '0.8s' },
  { left: '92%', top: '60%', size: 18, delay: '1.5s' },
  { left: '35%', top: '34%', size: 14, delay: '0.7s' },
]

// ─── ONE SPARKLE ───
// a four-point star (the classic "shine" mark) in warm brand yellow
function Sparkle({ size }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="overflow-visible">
      {/* the star body */}
      <path d="M12 0 C13 7, 17 11, 24 12 C17 13, 13 17, 12 24 C11 17, 7 13, 0 12 C7 11, 11 7, 12 0 Z" fill="#FCD34D" />
      {/* a tiny white core so each sparkle reads as a bright glint */}
      <circle cx="12" cy="12" r="3" fill="#FFFFFF" opacity="0.9" />
    </svg>
  )
}

// ─── SPARKLE FIELD ───
export default function Sparkles() {
  return (
    // pointer-events-none so the sparkles never block clicks on the pop-up cards beneath/over them
    <div className="pointer-events-none absolute inset-0">
      {SPARKLES.map((s, i) => (
        // each sparkle is absolutely placed and twinkles with its own delay
        <span
          key={i}
          className="sparkle-twinkle absolute"
          style={{ left: s.left, top: s.top, animationDelay: s.delay }}
        >
          <Sparkle size={s.size} />
        </span>
      ))}
    </div>
  )
}
