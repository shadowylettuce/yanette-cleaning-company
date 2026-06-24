'use client' // tells Next.js this component runs in the browser, not on the server

// Bathroom.js — clean + messy SVG layers for the bathroom act.
// Same stage as the kitchen (wall → floor line at y=426 → two-band floor to y=760), but with a
// cool tile palette so the room reads as a bathroom while matching the rest of the set.

import { svgProps } from './shared'

// ─── CLEAN BATHROOM ───
export function CleanBathroom() {
  return (
    <svg {...svgProps}>
      {/* back wall — cool, fresh tint */}
      <rect x="0" y="0" width="1200" height="560" fill="#F5FAFB" />
      <rect x="0" y="0" width="1200" height="560" fill="#CDEBF7" opacity="0.15" />
      {/* far tile floor band */}
      <rect x="0" y="426" width="1200" height="200" fill="#D4E4E8" />
      {/* near tile floor band at the front where the crew stands */}
      <rect x="0" y="626" width="1200" height="134" fill="#E7ECEF" />
      {/* baseboard highlight + band seam */}
      <rect x="0" y="426" width="1200" height="6" fill="#C2D8DE" opacity="0.7" />
      <rect x="0" y="626" width="1200" height="6" fill="#B8CDD4" />
      {/* tile grout lines on the near floor */}
      <rect x="300" y="632" width="3" height="128" fill="#B8CDD4" opacity="0.6" />
      <rect x="640" y="632" width="3" height="128" fill="#B8CDD4" opacity="0.6" />
      <rect x="980" y="632" width="3" height="128" fill="#B8CDD4" opacity="0.6" />

      {/* bathtub along the floor on the left */}
      <rect x="100" y="410" width="360" height="150" rx="34" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="6" />
      <rect x="120" y="430" width="320" height="110" rx="26" fill="#E7ECEF" />     {/* inner basin */}
      <rect x="430" y="378" width="14" height="62" rx="6" fill="#AEB6BD" />         {/* faucet riser */}
      <path d="M430 384 q26 0 26 24" fill="none" stroke="#AEB6BD" strokeWidth="10" strokeLinecap="round" /> {/* faucet spout */}

      {/* vanity cabinet with a sink, on the floor */}
      <rect x="560" y="440" width="220" height="120" rx="8" fill="#EFE7DA" stroke="#E5E7EB" strokeWidth="4" /> {/* cabinet */}
      <rect x="556" y="428" width="228" height="20" rx="6" fill="#DCE2E6" />        {/* countertop */}
      <ellipse cx="670" cy="440" rx="48" ry="12" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="3" /> {/* basin */}
      <rect x="664" y="404" width="12" height="26" rx="4" fill="#AEB6BD" />         {/* sink faucet */}
      <rect x="600" y="500" width="60" height="6" rx="3" fill="#C7CDD2" />          {/* drawer pulls */}
      <rect x="690" y="500" width="60" height="6" rx="3" fill="#C7CDD2" />
      {/* mirror on the wall above the vanity */}
      <rect x="600" y="180" width="150" height="180" rx="8" fill="#CDEBF7" stroke="#E5E7EB" strokeWidth="5" />
      <rect x="620" y="200" width="56" height="100" rx="4" fill="#FFFFFF" opacity="0.5" /> {/* glass sheen */}

      {/* toilet on the floor at the right */}
      <rect x="900" y="300" width="90" height="124" rx="8" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="4" /> {/* tank against wall */}
      <rect x="908" y="416" width="74" height="40" fill="#FFFFFF" />                 {/* tank-to-bowl join */}
      <ellipse cx="945" cy="470" rx="70" ry="40" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="4" />        {/* bowl base on the floor */}
      <ellipse cx="945" cy="462" rx="48" ry="24" fill="#E7ECEF" />                   {/* bowl opening */}

      {/* towel hanging on the wall */}
      <rect x="1044" y="194" width="102" height="10" rx="5" fill="#AEB6BD" />        {/* towel bar */}
      <rect x="1050" y="200" width="90" height="160" rx="8" fill="#B7D5C4" />        {/* folded towel */}
    </svg>
  )
}

// ─── MESSY BATHROOM OVERLAY ───
// Soap scum, water stains and dropped toiletries; the --dirty clip wipes them away left→right.
export function MessyBathroom() {
  return (
    <svg {...svgProps}>
      {/* dim grime wash over the whole room */}
      <rect x="0" y="0" width="1200" height="760" fill="#6B6457" opacity="0.18" />
      {/* water stains / grime pooling on the floor */}
      <ellipse cx="280" cy="600" rx="80" ry="26" fill="#8A8170" opacity="0.32" />
      <ellipse cx="700" cy="650" rx="60" ry="20" fill="#8A8170" opacity="0.28" />
      {/* soap scum ring around the tub */}
      <ellipse cx="280" cy="500" rx="120" ry="20" fill="#9C947F" opacity="0.3" />
      {/* grime smudge streaking down the mirror */}
      <path d="M620 220 q20 40 -4 90" stroke="#9C947F" strokeWidth="3" fill="none" opacity="0.45" />
      {/* crumpled towel left on the floor */}
      <path d="M460 600 q40 -26 78 -4 q24 16 0 34 q-44 22 -78 -10 Z" fill="#D8CBBE" />
      {/* scattered toiletries */}
      <rect x="800" y="600" width="22" height="40" rx="5" fill="#C98A8A" transform="rotate(14 811 620)" />
      <rect x="850" y="610" width="18" height="34" rx="4" fill="#9DB3C2" transform="rotate(-10 859 627)" />
      {/* grime specks */}
      <g fill="#9C947F" opacity="0.5">
        <circle cx="500" cy="700" r="3.5" />
        <circle cx="980" cy="690" r="3" />
        <circle cx="180" cy="700" r="3" />
      </g>
    </svg>
  )
}
