'use client' // tells Next.js this component runs in the browser, not on the server

// KitchenScene.js — the illustrated kitchen behind the whole cinematic landing.
// HOW THE CLEANING EFFECT WORKS:
//   • The CLEAN kitchen is drawn once as the always-visible base layer.
//   • A MESSY overlay (grime + clutter) sits on top of it.
//   • The overlay is clipped with `clip-path: inset(0 0 0 var(--dirty))`.
//   • As the crew moves left→right, GSAP raises --dirty from 0% → 100%,
//     which slices the mess away from the left, revealing the clean kitchen underneath.
// Both SVGs share the exact same viewBox + absolute fill, so they line up perfectly.

// shared canvas size — every shape below is positioned inside this coordinate box
const VIEW = '0 0 1200 760'

// ─── CLEAN KITCHEN (base layer, always visible) ───
function CleanKitchen() {
  return (
    // preserveAspectRatio slice = fill the whole scene, cropping edges instead of letterboxing
    <svg viewBox={VIEW} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      {/* back wall — warm bright cream so the room feels sunny and clean */}
      <rect x="0" y="0" width="1200" height="560" fill="#FBF6EE" />

      {/* window opening with a clear blue sky — light pours in */}
      <rect x="470" y="70" width="260" height="190" rx="10" fill="#CDEBF7" />
      {/* window cross bars */}
      <rect x="595" y="70" width="10" height="190" fill="#FBF6EE" />
      <rect x="470" y="158" width="260" height="10" fill="#FBF6EE" />
      {/* window frame outline */}
      <rect x="470" y="70" width="260" height="190" rx="10" fill="none" stroke="#E5E7EB" strokeWidth="8" />
      {/* a little potted plant on the sill — a tidy, lived-in touch */}
      <rect x="500" y="240" width="44" height="24" rx="4" fill="#C9A981" />
      <path d="M522 240 C 506 214, 540 214, 522 240 Z" fill="#4CAF82" />
      <path d="M522 240 C 502 224, 512 200, 522 226 Z" fill="#3D9A6F" />

      {/* upper cabinets — soft cream doors with simple handles */}
      <rect x="70" y="120" width="320" height="150" rx="8" fill="#EFE7DA" stroke="#E5E7EB" strokeWidth="4" />
      <rect x="232" y="120" width="4" height="150" fill="#E5E7EB" />
      <rect x="200" y="185" width="24" height="6" rx="3" fill="#C9A981" />
      <rect x="244" y="185" width="24" height="6" rx="3" fill="#C9A981" />

      {/* range hood above the stove */}
      <path d="M800 120 H1010 L975 200 H835 Z" fill="#E7ECEF" stroke="#E5E7EB" strokeWidth="4" />

      {/* counter top — a long butcher-block surface across the room */}
      <rect x="0" y="380" width="1200" height="46" fill="#D9BD93" />
      {/* thin highlight line shows the counter is polished and shiny */}
      <rect x="0" y="384" width="1200" height="6" fill="#E7D2A8" opacity="0.7" />

      {/* lower cabinets — brand-sage doors give the room its warm green character */}
      <rect x="0" y="426" width="1200" height="200" fill="#B7D5C4" />
      {/* cabinet door seams */}
      <rect x="180" y="426" width="4" height="200" fill="#A6C7B5" />
      <rect x="400" y="426" width="4" height="200" fill="#A6C7B5" />
      <rect x="1020" y="426" width="4" height="200" fill="#A6C7B5" />
      {/* cabinet handles */}
      <rect x="150" y="470" width="8" height="40" rx="4" fill="#7FA994" />
      <rect x="360" y="470" width="8" height="40" rx="4" fill="#7FA994" />

      {/* sink basin set into the counter */}
      <rect x="470" y="392" width="190" height="30" rx="8" fill="#C7CDD2" />
      <rect x="486" y="398" width="158" height="18" rx="6" fill="#AEB6BD" />
      {/* faucet */}
      <path d="M566 392 V356 q0 -16 18 -16 h6" fill="none" stroke="#9AA2AA" strokeWidth="8" strokeLinecap="round" />

      {/* stove top with two burners, set into the counter on the right */}
      <rect x="838" y="384" width="150" height="40" rx="6" fill="#C7CDD2" />
      <circle cx="878" cy="404" r="14" fill="#9AA2AA" />
      <circle cx="948" cy="404" r="14" fill="#9AA2AA" />

      {/* tall fridge on the far right — clean stainless look */}
      <rect x="1050" y="150" width="120" height="476" rx="12" fill="#DCE2E6" stroke="#E5E7EB" strokeWidth="4" />
      <rect x="1108" y="210" width="8" height="60" rx="4" fill="#AEB6BD" />
      <rect x="1050" y="330" width="120" height="4" fill="#C7CDD2" />

      {/* floor — warm light wood planks */}
      <rect x="0" y="626" width="1200" height="134" fill="#E7D3B3" />
      <rect x="0" y="626" width="1200" height="6" fill="#D8C09A" />
      {/* faint plank lines */}
      <rect x="300" y="632" width="3" height="128" fill="#D8C09A" opacity="0.6" />
      <rect x="640" y="632" width="3" height="128" fill="#D8C09A" opacity="0.6" />
      <rect x="980" y="632" width="3" height="128" fill="#D8C09A" opacity="0.6" />
    </svg>
  )
}

// ─── MESSY OVERLAY (top layer, clipped away as the crew cleans) ───
function MessyOverlay() {
  return (
    // this whole group is sliced away from the left by clip-path as --dirty grows
    <svg viewBox={VIEW} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      {/* a dull warm-gray film over the entire room — makes the dirty side look grimy and flat */}
      <rect x="0" y="0" width="1200" height="760" fill="#6B6457" opacity="0.22" />

      {/* grime smudges high on the wall */}
      <ellipse cx="160" cy="200" rx="60" ry="34" fill="#8A8170" opacity="0.35" />
      <ellipse cx="900" cy="160" rx="48" ry="28" fill="#8A8170" opacity="0.3" />
      {/* cobweb in the top-left corner */}
      <path d="M0 0 L70 40 M0 0 L40 70 M0 36 L52 52 M36 0 L52 52" stroke="#9C947F" strokeWidth="2" opacity="0.5" fill="none" />

      {/* coffee-ring stains on the counter */}
      <circle cx="250" cy="404" r="16" fill="none" stroke="#7C5A3A" strokeWidth="4" opacity="0.55" />
      <circle cx="300" cy="408" r="11" fill="none" stroke="#7C5A3A" strokeWidth="3" opacity="0.5" />

      {/* dirty dishes piled in the sink */}
      <ellipse cx="540" cy="392" rx="40" ry="12" fill="#B7A98C" />
      <ellipse cx="560" cy="384" rx="32" ry="10" fill="#A99B7E" />
      <rect x="600" y="366" width="22" height="28" rx="4" fill="#9DB3C2" />
      <path d="M540 392 q6 -14 22 -8" stroke="#8A8170" strokeWidth="3" fill="none" opacity="0.6" />

      {/* tipped-over spray bottle and a crumpled rag on the counter */}
      <g transform="rotate(20 760 372)">
        <rect x="744" y="356" width="20" height="34" rx="5" fill="#C98A8A" />
        <rect x="749" y="346" width="10" height="12" rx="2" fill="#A86C6C" />
      </g>
      <path d="M690 384 q14 -16 30 -4 q12 10 -2 18 q-18 8 -28 -14 Z" fill="#D8CBBE" opacity="0.9" />

      {/* crumpled paper / trash on the floor */}
      <path d="M180 690 q18 -22 40 -8 q18 12 0 26 q-24 14 -40 -18 Z" fill="#D8CBBE" />
      <path d="M188 690 l12 6 l-6 10" stroke="#B3A691" strokeWidth="2" fill="none" />

      {/* a small spill puddle on the floor */}
      <ellipse cx="430" cy="700" rx="46" ry="16" fill="#7C5A3A" opacity="0.4" />
      <ellipse cx="430" cy="698" rx="26" ry="9" fill="#7C5A3A" opacity="0.35" />

      {/* scattered crumbs across the floor */}
      <g fill="#8A7250" opacity="0.7">
        <circle cx="320" cy="676" r="3" />
        <circle cx="360" cy="690" r="2.5" />
        <circle cx="500" cy="684" r="3" />
        <circle cx="600" cy="700" r="2.5" />
        <circle cx="720" cy="678" r="3" />
        <circle cx="860" cy="694" r="2.5" />
        <circle cx="940" cy="682" r="3" />
      </g>

      {/* floating dust specks in the grimy air */}
      <g fill="#9C947F" opacity="0.5">
        <circle cx="420" cy="300" r="3" />
        <circle cx="700" cy="260" r="2.5" />
        <circle cx="980" cy="320" r="3" />
        <circle cx="820" cy="220" r="2" />
      </g>
    </svg>
  )
}

// ─── KITCHEN SCENE (puts the clean base + messy overlay together) ───
// `dirty` is a CSS length string ('0%' → '100%') controlling how much mess remains.
// On desktop GSAP animates it via the .js-messy ref; on mobile it is forced to '100%' (fully clean).
export default function KitchenScene({ dirty = '0%' }) {
  return (
    // relative wrapper so both SVG layers stack on top of each other and fill the scene
    <div className="absolute inset-0 overflow-hidden">
      {/* base layer: the bright, tidy kitchen — never clipped */}
      <CleanKitchen />
      {/* top layer: grime + clutter, sliced away from the left as --dirty climbs toward 100% */}
      <div
        className="js-messy absolute inset-0"
        // clip-path reads the --dirty variable live, so GSAP can animate the mess away by tweening --dirty
        style={{ clipPath: 'inset(0 0 0 var(--dirty))', ['--dirty']: dirty }}
      >
        <MessyOverlay />
      </div>
    </div>
  )
}
