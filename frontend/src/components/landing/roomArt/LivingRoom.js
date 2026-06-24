'use client' // tells Next.js this component runs in the browser, not on the server

// LivingRoom.js — clean + messy SVG layers for the living room act.
// Same stage as the kitchen (wall → floor line at y=426 → two-band wood floor to y=760) so the
// crew is grounded and the rooms crossfade seamlessly.

import { svgProps } from './shared'

// ─── CLEAN LIVING ROOM ───
export function CleanLivingRoom() {
  return (
    <svg {...svgProps}>
      {/* back wall — warm cream */}
      <rect x="0" y="0" width="1200" height="560" fill="#FBF6EE" />
      {/* far + near wood floor bands */}
      <rect x="0" y="426" width="1200" height="200" fill="#D9BD93" />
      <rect x="0" y="626" width="1200" height="134" fill="#E7D3B3" />
      {/* baseboard highlight + band seam */}
      <rect x="0" y="426" width="1200" height="6" fill="#E7D2A8" opacity="0.7" />
      <rect x="0" y="626" width="1200" height="6" fill="#D8C09A" />
      {/* vertical plank seams on the near floor */}
      <rect x="300" y="632" width="3" height="128" fill="#D8C09A" opacity="0.6" />
      <rect x="640" y="632" width="3" height="128" fill="#D8C09A" opacity="0.6" />
      <rect x="980" y="632" width="3" height="128" fill="#D8C09A" opacity="0.6" />

      {/* large window on the wall with a sunny glow */}
      <rect x="640" y="110" width="300" height="210" rx="10" fill="#CDEBF7" stroke="#E5E7EB" strokeWidth="8" />
      <rect x="785" y="110" width="10" height="210" fill="#FBF6EE" />
      <rect x="640" y="208" width="300" height="10" fill="#FBF6EE" />
      <circle cx="880" cy="170" r="30" fill="#FCD34D" opacity="0.4" />              {/* sun seen through the window */}

      {/* framed art on the wall to the left */}
      <rect x="120" y="140" width="150" height="120" rx="6" fill="#EFE7DA" stroke="#E5E7EB" strokeWidth="4" />
      <rect x="138" y="158" width="114" height="84" rx="4" fill="#B7D5C4" />

      {/* area rug on the floor under the sofa */}
      <ellipse cx="430" cy="600" rx="340" ry="70" fill="#CDEBF7" opacity="0.45" />

      {/* sofa resting on the floor */}
      <rect x="120" y="380" width="500" height="90" rx="20" fill="#B7D5C4" />       {/* backrest */}
      <rect x="110" y="440" width="520" height="90" rx="16" fill="#A6C7B5" />       {/* seat base on the floor */}
      <rect x="150" y="430" width="130" height="60" rx="14" fill="#C7E0D2" />       {/* seat cushion 1 */}
      <rect x="300" y="430" width="130" height="60" rx="14" fill="#C7E0D2" />       {/* seat cushion 2 */}
      <rect x="450" y="430" width="130" height="60" rx="14" fill="#C7E0D2" />       {/* seat cushion 3 */}
      <rect x="100" y="420" width="40" height="110" rx="14" fill="#7FA994" />       {/* left armrest */}
      <rect x="600" y="420" width="40" height="110" rx="14" fill="#7FA994" />       {/* right armrest */}
      <rect x="180" y="392" width="70" height="50" rx="12" fill="#FCD34D" opacity="0.85" transform="rotate(-8 215 417)" /> {/* throw pillow */}

      {/* coffee table on the floor in front of the sofa */}
      <rect x="260" y="560" width="220" height="20" rx="6" fill="#C9A981" />        {/* tabletop */}
      <rect x="280" y="580" width="12" height="50" rx="4" fill="#B89770" />         {/* left leg */}
      <rect x="448" y="580" width="12" height="50" rx="4" fill="#B89770" />         {/* right leg */}

      {/* potted plant on the floor to the right */}
      <rect x="980" y="470" width="70" height="70" rx="6" fill="#C9A981" />         {/* pot */}
      <path d="M1015 470 q-40 -70 -10 -120 q24 40 10 120 Z" fill="#4CAF82" />       {/* leaves */}
      <path d="M1015 470 q40 -60 16 -110 q-8 44 -16 110 Z" fill="#3D9A6F" />
    </svg>
  )
}

// ─── MESSY LIVING ROOM OVERLAY ───
// Tossed blanket, clutter and dust on the floor; the --dirty clip wipes them away left→right.
export function MessyLivingRoom() {
  return (
    <svg {...svgProps}>
      {/* dim grime wash over the whole room */}
      <rect x="0" y="0" width="1200" height="760" fill="#6B6457" opacity="0.2" />
      {/* dusty haze high on the wall */}
      <ellipse cx="350" cy="360" rx="90" ry="32" fill="#8A8170" opacity="0.28" />
      {/* blanket tossed over the sofa */}
      <path d="M150 470 q60 -30 130 -6 q50 18 110 -2 q-20 50 -130 40 q-90 -8 -110 -32 Z" fill="#D8CBBE" opacity="0.9" />
      {/* magazines scattered on the floor */}
      <rect x="520" y="640" width="110" height="40" rx="6" fill="#B7A98C" transform="rotate(6 575 660)" />
      <rect x="540" y="628" width="90" height="34" rx="6" fill="#C98A8A" transform="rotate(-6 585 645)" />
      {/* a left-out mug ring */}
      <circle cx="760" cy="660" r="16" fill="none" stroke="#7C5A3A" strokeWidth="4" opacity="0.5" />
      {/* cushion knocked onto the floor */}
      <rect x="200" y="630" width="90" height="70" rx="14" fill="#9DB3C2" transform="rotate(-12 245 665)" />
      {/* dust bunnies */}
      <g fill="#8A7250" opacity="0.6">
        <circle cx="430" cy="700" r="4" />
        <circle cx="900" cy="690" r="3.5" />
        <circle cx="1050" cy="700" r="4" />
      </g>
    </svg>
  )
}
