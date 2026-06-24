'use client' // tells Next.js this component runs in the browser, not on the server

// Exterior.js — the sunny finale: San Francisco's Painted Ladies seen from Alamo Square,
// with a faint downtown skyline behind, so the ending subtly says "Bay Area".
// No messy layer (the job is done) — the crew stands on the lawn out front.

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

      {/* ── FAINT DOWNTOWN SKYLINE (behind the houses, hazy on purpose) ── */}
      {/* far/back haze layer for depth */}
      <g fill="#CBD8E2" opacity="0.3">
        <rect x="320" y="300" width="80" height="70" />
        <rect x="610" y="296" width="70" height="74" />
        <rect x="960" y="300" width="60" height="70" />
      </g>
      {/* front skyline layer with two recognizable SF towers */}
      <g fill="#B8C9D6" opacity="0.35">
        <rect x="170" y="252" width="70" height="120" />
        <rect x="262" y="278" width="48" height="94" />
        {/* Salesforce Tower — tallest, tapered with a rounded crown */}
        <path d="M430 372 L430 252 Q455 222 480 252 L480 372 Z" />
        <rect x="540" y="270" width="58" height="102" />
        {/* Transamerica Pyramid — the pointed one */}
        <path d="M690 372 L720 244 L750 372 Z" />
        <rect x="820" y="274" width="54" height="98" />
        <rect x="900" y="258" width="62" height="114" />
        <rect x="1000" y="282" width="46" height="90" />
      </g>

      {/* ── ALAMO SQUARE LAWN (the park the crew stands on) ── */}
      <path d="M0 524 Q300 506 620 524 T1200 518 L1200 760 L0 760 Z" fill="#8BC98A" />
      <path d="M0 560 Q300 546 620 560 T1200 556 L1200 760 L0 760 Z" fill="#7AB879" opacity="0.6" />
      {/* mowed-grass sweeps for a little texture */}
      <path d="M0 612 Q400 592 800 612 T1200 606" stroke="#6EAD6C" strokeWidth="4" fill="none" opacity="0.4" />

      {/* ── THE PAINTED LADIES (the iconic row, stepped colors) ── */}
      {/* props are numbers (not strings) so the arithmetic inside PaintedLady adds instead of concatenating */}
      <PaintedLady x={110} w={150} top={300} body="#FBF6EE" roof="#E7D3B3" trim="#FFFFFF" /> {/* cream */}
      <PaintedLady x={320} w={150} top={290} body="#E8C4C4" roof="#C98A8A" trim="#FBF6EE" /> {/* dusty rose */}
      <PaintedLady x={530} w={150} top={296} body="#B7D5C4" roof="#7FA994" trim="#FBF6EE" /> {/* sage */}
      <PaintedLady x={740} w={150} top={286} body="#CDEBF7" roof="#5BAFD6" trim="#FFFFFF" /> {/* soft blue */}
      <PaintedLady x={950} w={150} top={300} body="#F2D98C" roof="#D9B85A" trim="#FBF6EE" /> {/* butter gold */}

      {/* a pair of park trees flanking the lawn */}
      <ellipse cx="60" cy="540" rx="46" ry="56" fill="#4CAF82" opacity="0.85" />
      <rect x="52" y="560" width="16" height="40" fill="#9A7B53" />
      <ellipse cx="1150" cy="548" rx="50" ry="60" fill="#4CAF82" opacity="0.8" />
      <rect x="1142" y="568" width="16" height="44" fill="#9A7B53" />
    </svg>
  )
}
