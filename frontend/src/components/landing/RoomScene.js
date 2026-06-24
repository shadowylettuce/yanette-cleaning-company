'use client' // tells Next.js this component runs in the browser, not on the server

// RoomScene.js — unified room wrapper for the cinematic landing scroll story.
// Each interior room has a clean base layer + a messy overlay clipped by --dirty.
// The exterior scene has no messy layer — the crew is done and standing outside.

import { CleanBedroom, MessyBedroom } from './roomArt/Bedroom'
import { CleanBathroom, MessyBathroom } from './roomArt/Bathroom'
import { CleanKitchen, MessyKitchen } from './roomArt/Kitchen'
import { CleanLivingRoom, MessyLivingRoom } from './roomArt/LivingRoom'
import { CleanExterior } from './roomArt/Exterior'

// map each room key to its clean SVG component and optional messy overlay component
const ROOMS = {
  bedroom: { Clean: CleanBedroom, Messy: MessyBedroom },
  bathroom: { Clean: CleanBathroom, Messy: MessyBathroom },
  kitchen: { Clean: CleanKitchen, Messy: MessyKitchen },
  livingRoom: { Clean: CleanLivingRoom, Messy: MessyLivingRoom },
  exterior: { Clean: CleanExterior, Messy: null },
}

// ─── RENDER ───
// `room` picks which illustration to show; `dirty` controls how much mess remains (0% = fully messy, 100% = fully clean)
export default function RoomScene({ room = 'bedroom', dirty = '0%', messyClassName = 'js-messy' }) {
  const { Clean, Messy } = ROOMS[room] || ROOMS.bedroom // fall back to bedroom if an unknown room is passed
  const isExterior = room === 'exterior' // exterior never gets a grime overlay

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Clean />
      {!isExterior && Messy && (
        <div
          className={`${messyClassName} absolute inset-0`}
          style={{ clipPath: 'inset(0 0 0 var(--dirty))', ['--dirty']: dirty }}
        >
          <Messy />
        </div>
      )}
    </div>
  )
}
