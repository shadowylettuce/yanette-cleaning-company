'use client' // tells Next.js this component runs in the browser, not on the server

// dashboard/workers/[id]/page.js — view and edit ONE worker's details
// The [id] folder name means the URL contains the worker's id, e.g. /dashboard/workers/abc-123

import { useState, useEffect } from 'react'             // React tools for state and side effects
import { useParams, useRouter } from 'next/navigation'  // useParams reads the id from the URL; useRouter lets us go back
import Link from 'next/link'                            // for the back link
import { supabase } from '@/lib/supabase'               // our shared database connection
import { useUser } from '@/lib/useUser'                 // who is logged in + language

export default function WorkerDetailPage() {
  // ─── STATE ───
  const [worker, setWorker] = useState(null)     // worker holds this one worker's data; null until loaded
  const [saveMsg, setSaveMsg] = useState('')     // saveMsg shows "Saved!" feedback after a successful save

  const { t, loading } = useUser()               // translated text + loading flag
  const params = useParams()                     // gives us the pieces of the URL
  const workerId = params.id                     // the worker id from the URL
  const router = useRouter()                     // lets us navigate back after deleting

  // ─── EFFECTS ───
  useEffect(() => {            // runs once when the page loads
    fetchWorker()              // go get this worker's data
  }, [])                       // empty array = only run once

  // ─── FETCH ───
  async function fetchWorker() {
    const { data, error } = await supabase   // send a request to Supabase; it gives back { data, error }
      .from('workers')                       // look inside the workers table
      .select('*')                           // get every column
      .eq('id', workerId)                    // filter: only the row with this id

    if (error) {                                       // if Supabase returned an error
      console.error('Failed to load worker:', error)   // print it so we can debug
      return                                           // exit early
    }

    setWorker(data?.[0] || null)             // safely grab the first (only) result; null if not found
  }

  // ─── HANDLERS ───
  async function handleSave(e) {
    e.preventDefault()                       // stop the browser from reloading the page

    const { error } = await supabase
      .from('workers')                                 // look inside the workers table
      .update({                                        // change these columns...
        name: worker.name,
        phone: worker.phone,
        hourly_rate: Number(worker.hourly_rate) || 0,  // make sure the rate is stored as a number (0 if blank)
        tier: worker.tier,
      })
      .eq('id', workerId)                              // ...only on this worker's row

    if (error) {                                       // if the save failed
      console.error('Failed to save worker:', error)   // print it so we can debug
      alert(t.errorGeneric)                            // tell the user
      return                                           // stop here
    }

    setSaveMsg(t.saved)                      // show the "Saved!" message
    setTimeout(() => setSaveMsg(''), 2000)   // hide it again after 2 seconds
  }

  async function handleDelete() {
    if (!confirm(t.confirmDelete)) return    // yes/no box; stop if the user cancels

    const { error } = await supabase
      .from('workers')                       // look inside the workers table
      .delete()                              // remove rows...
      .eq('id', workerId)                    // ...only this worker's row

    if (error) {                                         // if the delete failed
      console.error('Failed to delete worker:', error)   // print it so we can debug
      alert(t.errorGeneric)                              // tell the user
      return                                             // stop here
    }

    router.push('/dashboard/workers')        // go back to the worker list
  }

  function setField(field, value) {                  // updates ONE field of the worker object
    setWorker({ ...worker, [field]: value })         // copy everything else, replace just that field
  }

  // ─── RENDER ───
  if (loading || !worker) return <p className="text-muted">{t.loading}</p> // wait for login check AND worker data

  return (
    <div className="max-w-2xl">

      {/* ── PAGE HEADER ── */}
      <Link href="/dashboard/workers" className="text-sm text-accent hover:underline">← {t.back}</Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold">{t.workerDetails}</h1>
      {/* ── END PAGE HEADER ── */}

      {/* ── EDIT FORM ── */}
      <form onSubmit={handleSave} className="space-y-4 rounded-xl border border-line bg-card p-6">

        <div>
          <label className="mb-1 block text-sm font-medium">{t.name}</label>
          <input value={worker.name || ''} onChange={(e) => setField('name', e.target.value)} required className="w-full rounded-lg border border-line px-3 py-2" />
        </div>

        {/* phone and hourly rate side by side on wider screens */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">{t.phone}</label>
            <input value={worker.phone || ''} onChange={(e) => setField('phone', e.target.value)} className="w-full rounded-lg border border-line px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t.hourlyRate}</label>
            <input type="number" step="0.01" value={worker.hourly_rate ?? ''} onChange={(e) => setField('hourly_rate', e.target.value)} className="w-full rounded-lg border border-line px-3 py-2" />
          </div>
        </div>

        {/* manager or cleaner — decides which portal this worker sees */}
        <div>
          <label className="mb-1 block text-sm font-medium">{t.tier}</label>
          <select value={worker.tier || 'cleaner'} onChange={(e) => setField('tier', e.target.value)} className="w-full rounded-lg border border-line px-3 py-2">
            <option value="cleaner">{t.cleaner}</option>
            <option value="manager">{t.manager}</option>
          </select>
        </div>

        {/* save button + delete button + the temporary "Saved!" message */}
        <div className="flex items-center gap-3">
          <button type="submit" className="rounded-lg bg-brand px-6 py-2 font-semibold text-white hover:bg-brand-dark">{t.save}</button>
          <button type="button" onClick={handleDelete} className="rounded-lg border border-line px-4 py-2 text-red-500 hover:border-red-400">{t.deleteWorker}</button>
          {saveMsg && <span className="text-sm font-medium text-brand">{saveMsg}</span>} {/* only visible right after saving */}
        </div>
      </form>
      {/* ── END EDIT FORM ── */}

    </div>
  )
}
