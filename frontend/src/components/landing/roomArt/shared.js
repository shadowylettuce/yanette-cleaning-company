'use client' // tells Next.js this component runs in the browser, not on the server

// shared.js — constants reused by every room illustration in the cinematic landing

export const VIEW = '0 0 1200 760' // every room SVG shares this canvas so they stack and crossfade perfectly

export const svgProps = { // spread onto each room SVG so sizing/cropping matches across all scenes
  viewBox: VIEW,
  preserveAspectRatio: 'xMidYMid slice',
  className: 'absolute inset-0 h-full w-full',
}
