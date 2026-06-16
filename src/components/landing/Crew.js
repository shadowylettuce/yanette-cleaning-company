'use client' // tells Next.js this component runs in the browser, not on the server

// Crew.js — the team of women who clean the kitchen as the visitor scrolls.
// This component only draws the artwork. Its position on screen (moving left→right)
// is controlled by the parent CinematicLanding via the wrapping .js-crew element.
// Each figure gets a gentle "scrubbing" bob via the .crew-bob CSS class (keyframes in globals.css).

// ─── ONE WOMAN ───
// x = horizontal offset inside the SVG; tool = which cleaning tool she holds;
// skin / hair / delay let each figure look a little different and bob out of sync.
function Woman({ x, tool, skin, hair, delay }) {
  return (
    // the bob animation is applied per-figure; transformBox keeps the rotate/scale centered on the figure
    <g className="crew-bob" style={{ animationDelay: delay, transformOrigin: `${x + 30}px 250px` }}>
      {/* legs */}
      <rect x={x + 18} y="250" width="12" height="46" rx="6" fill="#3A4250" />
      <rect x={x + 36} y="250" width="12" height="46" rx="6" fill="#2F3845" />
      {/* apron dress in brand green — the team uniform */}
      <path d={`M${x + 8} 160 q22 -18 50 0 l10 96 q-35 16 -70 0 Z`} fill="#4CAF82" />
      {/* apron front panel (lighter) */}
      <path d={`M${x + 22} 176 h22 l5 70 q-16 7 -32 0 Z`} fill="#3D9A6F" />
      {/* arms reaching toward the surface they are cleaning */}
      <rect x={x + 2} y="170" width="14" height="54" rx="7" fill={skin} transform={`rotate(24 ${x + 9} 197)`} />
      <rect x={x + 50} y="170" width="14" height="54" rx="7" fill={skin} transform={`rotate(-24 ${x + 57} 197)`} />
      {/* head */}
      <circle cx={x + 33} cy="140" r="22" fill={skin} />
      {/* hair tied back */}
      <path d={`M${x + 11} 140 q0 -30 22 -30 q22 0 22 30 q-10 -14 -22 -14 q-12 0 -22 14 Z`} fill={hair} />
      <circle cx={x + 33} cy="112" r="6" fill={hair} />

      {/* the cleaning tool in her hands */}
      {tool === 'spray' && (
        // spray bottle with a little mist of droplets
        <g>
          <rect x={x - 10} y="206" width="16" height="24" rx="4" fill="#5BAFD6" />
          <rect x={x - 6} y="198" width="8" height="10" rx="2" fill="#3F93BA" />
          <g fill="#5BAFD6">
            <circle cx={x - 18} cy="200" r="2.5" />
            <circle cx={x - 24} cy="208" r="2" />
            <circle cx={x - 16} cy="212" r="2" />
          </g>
        </g>
      )}
      {tool === 'mop' && (
        // a mop leaning across her body
        <g>
          <rect x={x + 58} y="150" width="6" height="150" rx="3" fill="#C9A981" transform={`rotate(18 ${x + 61} 225)`} />
          <path d={`M${x + 96} 286 q14 -6 28 0 l-6 22 q-16 6 -28 0 Z`} fill="#E7D2A8" transform={`rotate(18 ${x + 110} 300)`} />
        </g>
      )}
      {tool === 'cloth' && (
        // a folded wiping cloth in her hand
        <rect x={x - 12} y="206" width="26" height="18" rx="4" fill="#FCD34D" transform={`rotate(-10 ${x + 1} 215)`} />
      )}
    </g>
  )
}

// ─── CREW (three women clustered together) ───
export default function Crew() {
  return (
    // wide-but-short viewBox holding the cluster; parent controls where this sits on screen
    <svg viewBox="0 0 320 320" preserveAspectRatio="xMidYMax meet" className="h-full w-full overflow-visible">
      {/* three figures with different skin tones, hair colors, tools, and bob timing */}
      <Woman x={0} tool="spray" skin="#E8B894" hair="#3A2A20" delay="0s" />
      <Woman x={95} tool="cloth" skin="#C98A5E" hair="#1F1A16" delay="0.25s" />
      <Woman x={190} tool="mop" skin="#F0C9A8" hair="#5A3A22" delay="0.5s" />
    </svg>
  )
}
