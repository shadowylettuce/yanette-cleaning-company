'use client' // tells Next.js this component runs in the browser, not on the server

// Kitchen.js — clean + messy SVG layers for the kitchen act of the cinematic landing

import { svgProps } from './shared'

// ─── CLEAN KITCHEN (base layer, always visible) ───
export function CleanKitchen() {
  return (
    <svg {...svgProps}>
      <rect x="0" y="0" width="1200" height="560" fill="#FBF6EE" />
      <rect x="470" y="70" width="260" height="190" rx="10" fill="#CDEBF7" />
      <rect x="595" y="70" width="10" height="190" fill="#FBF6EE" />
      <rect x="470" y="158" width="260" height="10" fill="#FBF6EE" />
      <rect x="470" y="70" width="260" height="190" rx="10" fill="none" stroke="#E5E7EB" strokeWidth="8" />
      <rect x="500" y="240" width="44" height="24" rx="4" fill="#C9A981" />
      <path d="M522 240 C 506 214, 540 214, 522 240 Z" fill="#4CAF82" />
      <path d="M522 240 C 502 224, 512 200, 522 226 Z" fill="#3D9A6F" />
      <rect x="70" y="120" width="320" height="150" rx="8" fill="#EFE7DA" stroke="#E5E7EB" strokeWidth="4" />
      <rect x="232" y="120" width="4" height="150" fill="#E5E7EB" />
      <rect x="200" y="185" width="24" height="6" rx="3" fill="#C9A981" />
      <rect x="244" y="185" width="24" height="6" rx="3" fill="#C9A981" />
      <path d="M800 120 H1010 L975 200 H835 Z" fill="#E7ECEF" stroke="#E5E7EB" strokeWidth="4" />
      <rect x="0" y="380" width="1200" height="46" fill="#D9BD93" />
      <rect x="0" y="384" width="1200" height="6" fill="#E7D2A8" opacity="0.7" />
      <rect x="0" y="426" width="1200" height="200" fill="#B7D5C4" />
      <rect x="180" y="426" width="4" height="200" fill="#A6C7B5" />
      <rect x="400" y="426" width="4" height="200" fill="#A6C7B5" />
      <rect x="1020" y="426" width="4" height="200" fill="#A6C7B5" />
      <rect x="150" y="470" width="8" height="40" rx="4" fill="#7FA994" />
      <rect x="360" y="470" width="8" height="40" rx="4" fill="#7FA994" />
      <rect x="470" y="392" width="190" height="30" rx="8" fill="#C7CDD2" />
      <rect x="486" y="398" width="158" height="18" rx="6" fill="#AEB6BD" />
      <path d="M566 392 V356 q0 -16 18 -16 h6" fill="none" stroke="#9AA2AA" strokeWidth="8" strokeLinecap="round" />
      <rect x="838" y="384" width="150" height="40" rx="6" fill="#C7CDD2" />
      <circle cx="878" cy="404" r="14" fill="#9AA2AA" />
      <circle cx="948" cy="404" r="14" fill="#9AA2AA" />
      <rect x="1050" y="150" width="120" height="476" rx="12" fill="#DCE2E6" stroke="#E5E7EB" strokeWidth="4" />
      <rect x="1108" y="210" width="8" height="60" rx="4" fill="#AEB6BD" />
      <rect x="1050" y="330" width="120" height="4" fill="#C7CDD2" />
      <rect x="0" y="626" width="1200" height="134" fill="#E7D3B3" />
      <rect x="0" y="626" width="1200" height="6" fill="#D8C09A" />
      <rect x="300" y="632" width="3" height="128" fill="#D8C09A" opacity="0.6" />
      <rect x="640" y="632" width="3" height="128" fill="#D8C09A" opacity="0.6" />
      <rect x="980" y="632" width="3" height="128" fill="#D8C09A" opacity="0.6" />
    </svg>
  )
}

// ─── MESSY KITCHEN OVERLAY ───
export function MessyKitchen() {
  return (
    <svg {...svgProps}>
      <rect x="0" y="0" width="1200" height="760" fill="#6B6457" opacity="0.22" />
      <ellipse cx="160" cy="200" rx="60" ry="34" fill="#8A8170" opacity="0.35" />
      <ellipse cx="900" cy="160" rx="48" ry="28" fill="#8A8170" opacity="0.3" />
      <path d="M0 0 L70 40 M0 0 L40 70 M0 36 L52 52 M36 0 L52 52" stroke="#9C947F" strokeWidth="2" opacity="0.5" fill="none" />
      <circle cx="250" cy="404" r="16" fill="none" stroke="#7C5A3A" strokeWidth="4" opacity="0.55" />
      <circle cx="300" cy="408" r="11" fill="none" stroke="#7C5A3A" strokeWidth="3" opacity="0.5" />
      <ellipse cx="540" cy="392" rx="40" ry="12" fill="#B7A98C" />
      <ellipse cx="560" cy="384" rx="32" ry="10" fill="#A99B7E" />
      <rect x="600" y="366" width="22" height="28" rx="4" fill="#9DB3C2" />
      <path d="M540 392 q6 -14 22 -8" stroke="#8A8170" strokeWidth="3" fill="none" opacity="0.6" />
      <g transform="rotate(20 760 372)">
        <rect x="744" y="356" width="20" height="34" rx="5" fill="#C98A8A" />
        <rect x="749" y="346" width="10" height="12" rx="2" fill="#A86C6C" />
      </g>
      <path d="M690 384 q14 -16 30 -4 q12 10 -2 18 q-18 8 -28 -14 Z" fill="#D8CBBE" opacity="0.9" />
      <path d="M180 690 q18 -22 40 -8 q18 12 0 26 q-24 14 -40 -18 Z" fill="#D8CBBE" />
      <ellipse cx="430" cy="700" rx="46" ry="16" fill="#7C5A3A" opacity="0.4" />
      <g fill="#8A7250" opacity="0.7">
        <circle cx="320" cy="676" r="3" />
        <circle cx="500" cy="684" r="3" />
        <circle cx="720" cy="678" r="3" />
      </g>
    </svg>
  )
}
