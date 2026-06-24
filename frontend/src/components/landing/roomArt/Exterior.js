'use client' // tells Next.js this component runs in the browser, not on the server

// Exterior.js — the sunny finale: San Francisco's Painted Ladies seen from Alamo Square,
// with a sidewalk between the row and the park lawn. No messy layer (the job is done).

import { svgProps } from './shared'

// ─── ONE PAINTED LADY (a single Victorian row house) ───
// x = left edge; w = width; top = y of the gable peak; body/roof/trim set this house's palette.
function PaintedLady({ x, w, top, body, roof, trim }) {
  const bodyTop = top + 40        // the flat facade starts just below the gable peak
  const groundY = 556             // every house sits on this lawn line so the row reads level
  const h = groundY - bodyTop     // facade height from cornice down to the grass

  return (
    <g>
      {/* peaked gable roof */}
      <path d={`M${x - 6} ${bodyTop + 6} L${x + w / 2} ${top} L${x + w + 6} ${bodyTop + 6} Z`} fill={roof} />
      {/* facade */}
      <rect x={x} y={bodyTop} width={w} height={h} fill={body} />
      {/* cornice trim band under the gable */}
      <rect x={x - 6} y={bodyTop} width={w + 12} height={12} rx="3" fill={trim} />
      {/* upper-floor windows — two tall panes */}
      <rect x={x + w * 0.16} y={bodyTop + 30} width={w * 0.22} height="48" rx="4" fill="#CDEBF7" stroke={trim} strokeWidth="5" />
      <rect x={x + w * 0.62} y={bodyTop + 30} width={w * 0.22} height="48" rx="4" fill="#CDEBF7" stroke={trim} strokeWidth="5" />
      {/* bay window unit — a trim-framed box holding three panes */}
      <rect x={x + w * 0.12} y={bodyTop + 86} width={w * 0.76} height="62" rx="4" fill={trim} />
      <rect x={x + w * 0.16} y={bodyTop + 94} width={w * 0.2} height="46" rx="3" fill="#CDEBF7" />
      <rect x={x + w * 0.40} y={bodyTop + 94} width={w * 0.2} height="46" rx="3" fill="#CDEBF7" />
      <rect x={x + w * 0.64} y={bodyTop + 94} width={w * 0.2} height="46" rx="3" fill="#CDEBF7" />
      {/* front door at street level, with a little gold knob */}
      <rect x={x + w * 0.38} y={groundY - 64} width={w * 0.24} height="64" rx="4" fill={roof} stroke={trim} strokeWidth="4" />
      <circle cx={x + w * 0.57} cy={groundY - 32} r="3" fill="#FCD34D" />
    </g>
  )
}

// ─── SUNNY EXTERIOR (Painted Ladies finale) ───
export function CleanExterior() {
  return (
    <svg {...svgProps}>
      <defs>
        {/* soft blue-to-white sky */}
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CDEBF7" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>
      {/* sky */}
      <rect x="0" y="0" width="1200" height="760" fill="url(#skyGrad)" />

      {/* sun */}
      <circle cx="150" cy="110" r="60" fill="#FCD34D" opacity="0.85" />
      <circle cx="150" cy="110" r="48" fill="#FFE566" />
      {/* drifting clouds */}
      <ellipse cx="520" cy="110" rx="90" ry="36" fill="#FFFFFF" opacity="0.9" />
      <ellipse cx="600" cy="100" rx="70" ry="30" fill="#FFFFFF" opacity="0.85" />
      <ellipse cx="940" cy="90" rx="100" ry="38" fill="#FFFFFF" opacity="0.8" />
      <ellipse cx="1020" cy="100" rx="60" ry="26" fill="#FFFFFF" opacity="0.75" />

      {/* ── ALAMO SQUARE LAWN (green base — park in front, hill behind the houses) ── */}
      <path d="M0 524 Q300 506 620 524 T1200 518 L1200 760 L0 760 Z" fill="#8BC98A" />

      {/* ── THE PAINTED LADIES (the iconic row, stepped colors) ── */}
      {/* props are numbers (not strings) so the arithmetic inside PaintedLady adds instead of concatenating */}
      {/* x positions: 150px-wide houses with ~30px gaps, centered in the 1200px frame */}
      <PaintedLady x={165} w={150} top={300} body="#FBF6EE" roof="#E7D3B3" trim="#FFFFFF" /> {/* cream */}
      <PaintedLady x={345} w={150} top={290} body="#E8C4C4" roof="#C98A8A" trim="#FBF6EE" /> {/* dusty rose */}
      <PaintedLady x={525} w={150} top={296} body="#B7D5C4" roof="#7FA994" trim="#FBF6EE" /> {/* sage */}
      <PaintedLady x={705} w={150} top={286} body="#CDEBF7" roof="#5BAFD6" trim="#FFFFFF" /> {/* soft blue */}
      <PaintedLady x={885} w={150} top={300} body="#F2D98C" roof="#D9B85A" trim="#FBF6EE" /> {/* butter gold */}

      {/* ── SIDEWALK (concrete strip between the row houses and the park lawn) ── */}
      <path d="M0 556 L1200 556 L1200 604 Q600 600 0 604 Z" fill="#D4D8DE" />
      {/* back curb where the walk meets the house lawn */}
      <path d="M0 556 L1200 556" stroke="#9CA3AF" strokeWidth="4" fill="none" />
      {/* front curb where the walk meets the park grass */}
      <path d="M0 604 L1200 604" stroke="#A8ADB5" strokeWidth="3" fill="none" />
      {/* slab seam lines so the walk reads as poured concrete panels */}
      {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100].map((sx) => (
        <line key={sx} x1={sx} y1="558" x2={sx} y2="602" stroke="#B8BDC5" strokeWidth="1.5" opacity="0.55" />
      ))}

      {/* ── FOREGROUND PARK LAWN (where the crew stands, below the sidewalk) ── */}
      <path d="M0 604 Q300 592 620 604 T1200 598 L1200 760 L0 760 Z" fill="#7AB879" opacity="0.85" />
      {/* mowed-grass sweeps for a little texture */}
      <path d="M0 648 Q400 632 800 648 T1200 642" stroke="#6EAD6C" strokeWidth="4" fill="none" opacity="0.4" />

      {/* a pair of park trees flanking the lawn */}
      <ellipse cx="60" cy="670" rx="46" ry="56" fill="#4CAF82" opacity="0.85" />
      <rect x="52" y="690" width="16" height="40" fill="#9A7B53" />
      <ellipse cx="1150" cy="678" rx="50" ry="60" fill="#4CAF82" opacity="0.8" />
      <rect x="1142" y="698" width="16" height="44" fill="#9A7B53" />
    </svg>
  )
}
