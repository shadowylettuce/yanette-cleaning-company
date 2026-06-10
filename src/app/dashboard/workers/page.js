'use client' // tells Next.js this component runs in the browser, not on the server

// dashboard/workers/page.js — list all workers, add a new worker, delete a worker

import { useState, useEffect } from 'react'  // React tools for state and side effects
import Link from 'next/link'                 // for clicking through to a single worker's page
import { supabase } from '@/lib/supabase'    // our shared database connection
import { useUser } from '@/lib/useUser'      // who is logged in + their business + language

export default function WorkersPage() {
  // ─── STATE ───
  const [workers, setWorkers] = useState([])        // workers holds the list of all workers; starts empty
  const [showForm, setShowForm] = useState(false)   // showForm controls whether the "add worker" form is visible
  // newWorker holds everything typed into the add form, in one object
  const [newWorker, setNewWorker] = useState({ name: '', phone: '', hourly_rate: '', tier: 'cleaner' })

  const { businessId, t, loading } = useUser() // businessId scopes every query; t gives translated text

  // ─── EFFECTS ───
  useEffect(() => {              // runs after load and whenever businessId becomes known
    if (businessId) {            // only fetch once we know which business we are
      fetchWorkers()             // go get the worker list from the database
    }
  }, [businessId])               // re-run if businessId changes

  // ─── FETCH ───
  async function fetchWorkers() {
    const { data, error } = await supabase   // send a request to Supabase; it gives back { data, error }
      .from('workers')                       // look inside the workers table
      .select('*')                           // get every column
      .eq('business_id', businessId)         // filter: only this business's workers
      .order('name', { ascending: true })    // sort alphabetically by name

    if (error) {                                        // if Supabase returned an error
      console.error('Failed to load workers:', error)   // print it so we can debug
      return                                            // exit early
    }

    setWorkers(data || [])                   // store the results (or an empty list)
  }

  // ─── HANDLERS ───
  async function handleAddWorker(e) {
    e.preventDefault()                       // stop the browser from reloading the page on form submit

    const { error } = await supabase
      .from('workers')                                       // look inside the workers table
      .insert([{                                             // add one new row:
        ...newWorker,                                        // everything from the form...
        hourly_rate: Number(newWorker.hourly_rate) || 0,     // ...converting the rate from text to a number (0 if blank)
        business_id: businessId,                             // ...plus our business id
      }])

    if (error) {                                        // if the insert failed
      console.error('Failed to add worker:', error)     // print it so we can debug
      alert(t.errorGeneric)                             // tell the user
      return                                            // stop here
    }

    setNewWorker({ name: '', phone: '', hourly_rate: '', tier: 'cleaner' }) // clear the form for next time
    setShowForm(false)                       // hide the form again
    fetchWorkers()                           // reload the list so the new worker appears
  }

  async function handleDeleteWorker(workerId) {
    if (!confirm(t.confirmDelete)) return    // yes/no box; stop if the user cancels

    const { error } = await supabase
      .from('workers')                       // look inside the workers table
      .delete()                              // remove rows...
      .eq('id', workerId)                    // ...only the one with this exact id

    if (error) {                                          // if the delete failed
      console.error('Failed to delete worker:', error)    // print it so we can debug
      alert(t.errorGeneric)                               // tell the user
      return                                              // stop here
    }

    fetchWorkers()                           // reload the list so the deleted worker disappears
  }

  // ─── RENDER ───
  if (loading) return <p className="text-muted">{t.loading}</p> // wait until we know who's logged in

  return (
    <div>

      {/* ── PAGE HEADER ── */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.workers}</h1>
        {/* toggles the add-worker form open and closed */}
        <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark">
          + {t.addWorker}
        </button>
      </div>
      {/* ── END PAGE HEADER ── */}

      {/* ── ADD WORKER FORM ── */}
      {/* only rendered while showForm is true */}
      {showForm && (
        <form onSubmit={handleAddWorker} className="mb-6 grid gap-3 rounded-xl border border-line bg-card p-4 sm:grid-cols-2">
          {/* each input updates ONE field inside the newWorker object, keeping the rest unchanged */}
          <input value={newWorker.name} onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })} placeholder={t.name} required className="rounded-lg border border-line px-3 py-2" />
          <input value={newWorker.phone} onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })} placeholder={t.phone} className="rounded-lg border border-line px-3 py-2" />
          <input type="number" step="0.01" value={newWorker.hourly_rate} onChange={(e) => setNewWorker({ ...newWorker, hourly_rate: e.target.value })} placeholder={t.hourlyRate} className="rounded-lg border border-line px-3 py-2" />
          {/* manager or cleaner — decides which portal they see when they log in */}
          <select value={newWorker.tier} onChange={(e) => setNewWorker({ ...newWorker, tier: e.target.value })} className="rounded-lg border border-line px-3 py-2">
            <option value="cleaner">{t.cleaner}</option>
            <option value="manager">{t.manager}</option>
          </select>
          <button type="submit" className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark sm:col-span-2">
            {t.save}
          </button>
        </form>
      )}
      {/* ── END ADD WORKER FORM ── */}

      {/* ── WORKER LIST ── */}
      {/* friendly empty message when there are no workers yet */}
      {workers.length === 0 && <p className="text-muted">{t.noWorkers}</p>}

      <div className="space-y-2">
        {workers.map((worker) => (
          // one row per worker: info on the left, action buttons on the right
          <div key={worker.id} className="flex items-center justify-between rounded-xl border border-line bg-card p-4">
            <div>
              <p className="font-semibold">{worker.name}</p>
              <p className="text-sm text-muted">{worker.phone}</p>
              {/* translate the tier word and show the hourly rate */}
              <p className="text-sm text-accent">{worker.tier === 'manager' ? t.manager : t.cleaner} · ${worker.hourly_rate}/hr</p>
            </div>
            <div className="flex gap-2">
              {/* link to this worker's full detail/edit page */}
              <Link href={`/dashboard/workers/${worker.id}`} className="rounded-lg border border-line px-3 py-1 text-sm hover:border-brand">
                {t.edit}
              </Link>
              <button onClick={() => handleDeleteWorker(worker.id)} className="rounded-lg border border-line px-3 py-1 text-sm text-red-500 hover:border-red-400">
                {t.delete}
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* ── END WORKER LIST ── */}

    </div>
  )
}
