'use client' // tells Next.js this component runs in the browser, not on the server

// Bedroom.js — clean + messy SVG layers for the bedroom act.
// Built on the same "stage" as the kitchen: a back wall, a floor line at y=426, and a
// continuous two-band floor down to y=760 so the crew stands on a real surface (no seam gap).

import { svgProps } from './shared'

// ─── CLEAN BEDROOM ───
export function CleanBedroom() {
  return (
    <svg {...svgProps}>
      {/* back wall — warm cream, fills everything above the floor line */}
      <rect x="0" y="0" width="1200" height="560" fill="#FBF6EE" />
      {/* far wood floor band (from the wall line back) */}
      <rect x="0" y="426" width="1200" height="200" fill="#D9BD93" />
      {/* near wood floor band (lighter) at the very front where the crew stands */}
      <rect x="0" y="626" width="1200" height="134" fill="#E7D3B3" />
      {/* baseboard highlight where wall meets floor */}
      <rect x="0" y="426" width="1200" height="6" fill="#E7D2A8" opacity="0.7" />
      {/* seam between the two floor bands */}
      <rect x="0" y="626" width="1200" height="6" fill="#D8C09A" />
      {/* subtle vertical plank seams on the near floor */}
      <rect x="300" y="632" width="3" height="128" fill="#D8C09A" opacity="0.6" />
      <rect x="640" y="632" width="3" height="128" fill="#D8C09A" opacity="0.6" />
      <rect x="980" y="632" width="3" height="128" fill="#D8C09A" opacity="0.6" />

      {/* window on the wall — blue pane with a white frame cross */}
      <rect x="650" y="120" width="230" height="190" rx="10" fill="#CDEBF7" stroke="#E5E7EB" strokeWidth="8" />
      <rect x="760" y="120" width="10" height="190" fill="#FBF6EE" />
      <rect x="650" y="208" width="230" height="10" fill="#FBF6EE" />

      {/* framed art on the wall (sage print in a cream frame) */}
      <rect x="930" y="130" width="150" height="120" rx="6" fill="#EFE7DA" stroke="#E5E7EB" strokeWidth="4" />
      <rect x="948" y="148" width="114" height="84" rx="4" fill="#B7D5C4" />

      {/* bed — headboard, frame, mattress, duvet and pillows, all resting on the floor */}
      <rect x="110" y="330" width="46" height="210" rx="8" fill="#C9A981" />        {/* tall headboard against the wall */}
      <rect x="120" y="470" width="470" height="70" rx="10" fill="#C9A981" />       {/* wooden bed frame base on the floor */}
      <rect x="120" y="428" width="470" height="52" rx="10" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="4" /> {/* mattress */}
      <rect x="220" y="424" width="370" height="58" rx="12" fill="#B7D5C4" />       {/* sage duvet folded over the mattress */}
      <rect x="140" y="410" width="80" height="46" rx="12" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="3" /> {/* pillow */}
      <rect x="150" y="400" width="68" height="40" rx="12" fill="#F5FAFB" stroke="#E5E7EB" strokeWidth="2" /> {/* second pillow */}

      {/* nightstand beside the bed, with a warm lamp */}
      <rect x="620" y="450" width="100" height="90" rx="6" fill="#EFE7DA" stroke="#E5E7EB" strokeWidth="4" /> {/* nightstand on the floor */}
      <rect x="640" y="498" width="60" height="6" rx="3" fill="#C9A981" />          {/* drawer pull line */}
      <rect x="658" y="396" width="24" height="54" fill="#C9A981" />                 {/* lamp stem */}
      <path d="M648 398 q22 -36 44 0 Z" fill="#FCD34D" />                            {/* lamp shade glowing warm */}
    </svg>
  )
}

// ─── MESSY BEDROOM OVERLAY ───
// Grime + clutter sit on the floor and bed; the --dirty clip wipes them away left→right.
export function MessyBedroom() {
  return (
    <svg {...svgProps}>
      {/* dim grime wash over the whole room */}
      <rect x="0" y="0" width="1200" height="760" fill="#6B6457" opacity="0.2" />
      {/* dusty smudge high on the wall */}
      <ellipse cx="980" cy="360" rx="70" ry="34" fill="#8A8170" opacity="0.28" />
      {/* rumpled blanket spilling off the bed onto the floor */}
      <path d="M150 540 q40 40 110 24 q60 -12 40 40 q-90 30 -190 -10 Z" fill="#D8CBBE" opacity="0.9" />
      {/* clothes dropped on the floor */}
      <rect x="430" y="560" width="120" height="50" rx="10" fill="#B7A98C" transform="rotate(-10 490 585)" />
      <rect x="760" y="600" width="90" height="44" rx="8" fill="#C98A8A" transform="rotate(8 805 622)" />
      {/* a stray sock */}
      <path d="M900 640 q20 -8 30 6 l-6 22 q-18 6 -28 -8 Z" fill="#9DB3C2" />
      {/* dust bunnies along the floor */}
      <g fill="#8A7250" opacity="0.6">
        <circle cx="320" cy="690" r="4" />
        <circle cx="560" cy="700" r="3.5" />
        <circle cx="1020" cy="688" r="4" />
      </g>
      {/* cobweb in the upper corner */}
      <path d="M0 0 L80 46 M0 0 L46 80 M0 40 L60 60 M40 0 L60 60" stroke="#9C947F" strokeWidth="2" opacity="0.45" fill="none" />
    </svg>
  )
}
