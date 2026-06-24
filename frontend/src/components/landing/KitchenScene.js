'use client' // tells Next.js this component runs in the browser, not on the server

// KitchenScene.js — thin re-export so older imports still work; delegates to RoomScene.

import RoomScene from './RoomScene'

export default function KitchenScene({ dirty = '0%' }) {
  return <RoomScene room="kitchen" dirty={dirty} />
}
