'use client' // tells Next.js this component runs in the browser, not on the server

// dashboard/appointments/[id]/page.js — view and edit ONE appointment
// Includes the important "Mark Completed" button, which also:
//   1. bumps the client's cleaning_count up by 1 (this drives the yellow new-client rule)
//   2. creates an unpaid payment row so the appointment shows up on the Payments page

import { useState, useEffect } from 'react'             // React tools for state and side effects
import { useParams } from 'next/navigation'             // reads the appointment id from the URL
import Link from 'next/link'                            // for the back link
import { supabase } from '@/lib/supabase'               // our shared database connection
import { useUser } from '@/lib/useUser'                 // who is logged in + their business + language

export default function AppointmentDetailPage() {
  // ─── STATE ───
  const [apt, setApt] = useState(null)                       // apt holds this one appointment's data; null until loaded
  const [workers, setWorkers] = useState([])                 // workers fills the assignment checkboxes
  const [assignedWorkerIds, setAssignedWorkerIds] = useState([]) // which workers are currently assigned to this appointment
  const [saveMsg, setSaveMsg] = useState('')                 // saveMsg shows "Saved!" feedback after a successful save

  const { businessId, t, loading } = useUser()   // business + translated text
  const params = useParams()                     // gives us the pieces of the URL
  const appointmentId = params.id                // the appointment id from the URL

  // ─── EFFECTS ───
  useEffect(() => {              // runs once when the page loads
    fetchAppointment()           // load the appointment + its current worker assignments
  }, [])                         // empty array = only run once

  useEffect(() => {              // runs when businessId becomes known
    if (businessId) {            // only fetch once we know which business we are
      fetchWorkers()             // load all workers for the checkboxes
    }
  }, [businessId])               // re-run if businessId changes

  // ─── FETCH ───
  async function fetchAppointment() {
    const { data, error } = await supabase   // send a request to Supabase; it gives back { data, error }
      .from('appointments')                  // look inside the appointments table
      .select('*, clients(name, address), appointment_workers(worker_id)') // also pull the client info and current assignments
      .eq('id', appointmentId)               // filter: only the row with this id

    if (error) {                                            // if Supabase returned an error
      console.error('Failed to load appointment:', error)   // print it so we can debug
      return                                                // exit early
    }

    const loaded = data?.[0]                 // safely grab the first (only) result
    setApt(loaded || null)                   // store it (or null if not found)

    // pull out just the worker ids from the assignment rows, so the checkboxes know what to check
    const currentIds = (loaded?.appointment_workers || []).map((row) => row.worker_id)
    setAssignedWorkerIds(currentIds)         // store them in state
  }

  async function fetchWorkers() {
    const { data, error } = await supabase
      .from('workers')                       // look inside the workers table
      .select('id, name')                    // we only need id and name
      .eq('business_id', businessId)         // only this business's workers
      .order('name', { ascending: true })    // alphabetical

    if (error) {                                        // if the query failed
      console.error('Failed to load workers:', error)   // print it so we can debug
      return                                            // exit early
    }

    setWorkers(data || [])                   // store the results
  }

  // ─── HANDLERS ───
  async function handleSave(e) {
    e.preventDefault()                       // stop the browser from reloading the page

    // step 1: save the appointment's own fields
    const { error } = await supabase
      .from('appointments')                            // look inside the appointments table
      .update({                                        // change these columns...
        date: apt.date,
        time: apt.time || null,                        // null if the time box was cleared
        price: Number(apt.price) || 0,                 // make sure price is stored as a number
        notes: apt.notes,
        status: apt.status,
      })
      .eq('id', appointmentId)                         // ...only on this appointment's row

    if (error) {                                            // if the save failed
      console.error('Failed to save appointment:', error)   // print it so we can debug
      alert(t.errorGeneric)                                 // tell the user
      return                                                // stop here
    }

    // step 2: replace the worker assignments — simplest reliable way: delete the old rows, insert the new ones
    const { error: clearError } = await supabase
      .from('appointment_workers')           // look inside the assignments join table
      .delete()                              // remove rows...
      .eq('appointment_id', appointmentId)   // ...all assignments for THIS appointment only

    if (clearError) {                                                 // if clearing failed
      console.error('Failed to clear old assignments:', clearError)   // print it so we can debug
    }

    if (assignedWorkerIds.length > 0) {      // only insert if at least one worker is checked
      const rows = assignedWorkerIds.map((workerId) => ({ // build one row per checked worker
        appointment_id: appointmentId,                    // link to this appointment
        worker_id: workerId,                              // link to this worker
      }))

      const { error: assignError } = await supabase
        .from('appointment_workers')         // look inside the assignments join table
        .insert(rows)                        // add all the new assignment rows

      if (assignError) {                                          // if inserting failed
        console.error('Failed to save assignments:', assignError) // print it so we can debug
      }
    }

    setSaveMsg(t.saved)                      // show the "Saved!" message
    setTimeout(() => setSaveMsg(''), 2000)   // hide it again after 2 seconds
  }

  async function handleMarkCompleted() {
    if (apt.status === 'completed') return   // guard: never complete the same appointment twice (would double-count)

    // step 1: set the appointment's status to completed
    const { error } = await supabase
      .from('appointments')                  // look inside the appointments table
      .update({ status: 'completed' })       // mark it done
      .eq('id', appointmentId)               // only this appointment

    if (error) {                                              // if the update failed
      console.error('Failed to mark completed:', error)       // print it so we can debug
      alert(t.errorGeneric)                                   // tell the user
      return                                                  // stop here
    }

    // step 2: bump the client's cleaning_count by 1 (drives the yellow new-client highlight)
    const { data: clientData } = await supabase
      .from('clients')                       // look inside the clients table
      .select('cleaning_count')              // we only need the current count
      .eq('id', apt.client_id)               // the client this appointment belongs to

    const currentCount = clientData?.[0]?.cleaning_count ?? 0 // safely read the count; 0 if missing

    const { error: countError } = await supabase
      .from('clients')                                 // back to the clients table
      .update({ cleaning_count: currentCount + 1 })    // write the count + 1
      .eq('id', apt.client_id)                         // only this client

    if (countError) {                                                // if the count update failed
      console.error('Failed to update cleaning count:', countError)  // print it so we can debug
    }

    // step 3: create an unpaid payment row so this job shows up on the Payments page
    const { error: payError } = await supabase
      .from('payments')                      // look inside the payments table
      .insert([{                             // add one new row:
        appointment_id: appointmentId,       // link to this appointment
        amount: apt.price || 0,              // owed amount = the appointment's price
        paid: false,                         // not paid yet — Yanette marks it paid later
      }])

    if (payError) {                                              // if creating the payment failed
      console.error('Failed to create payment row:', payError)   // print it so we can debug
    }

    fetchAppointment()                       // reload so the status badge and button update
  }

  function toggleWorker(workerId) {                               // runs when a worker checkbox is clicked
    if (assignedWorkerIds.includes(workerId)) {                   // if this worker is already checked
      setAssignedWorkerIds(assignedWorkerIds.filter((id) => id !== workerId)) // uncheck them
    } else {
      setAssignedWorkerIds([...assignedWorkerIds, workerId])      // otherwise check them
    }
  }

  function setField(field, value) {            // updates ONE field of the appointment object
    setApt({ ...apt, [field]: value })         // copy everything else, replace just that field
  }

  // ─── RENDER ───
  if (loading || !apt) return <p className="text-muted">{t.loading}</p> // wait for login check AND appointment data

  return (
    <div className="max-w-2xl">

      {/* ── PAGE HEADER ── */}
      <Link href="/dashboard/appointments" className="text-sm text-accent hover:underline">← {t.back}</Link>
      <h1 className="mt-2 text-2xl font-bold">{t.appointmentDetails}</h1>
      {/* show whose home this is — read-only here; the client is chosen at creation time */}
      <p className="mb-6 text-muted">{apt.clients?.name} · {apt.clients?.address}</p>
      {/* ── END PAGE HEADER ── */}

      {/* ── EDIT FORM ── */}
      <form onSubmit={handleSave} className="space-y-4 rounded-xl border border-line bg-card p-6">

        {/* date and time side by side */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">{t.date}</label>
            <input type="date" value={apt.date || ''} onChange={(e) => setField('date', e.target.value)} required className="w-full rounded-lg border border-line px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t.time}</label>
            <input type="time" value={apt.time || ''} onChange={(e) => setField('time', e.target.value)} className="w-full rounded-lg border border-line px-3 py-2" />
          </div>
        </div>

        {/* price and status side by side */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">{t.price} ($)</label>
            <input type="number" step="0.01" value={apt.price ?? ''} onChange={(e) => setField('price', e.target.value)} className="w-full rounded-lg border border-line px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t.status}</label>
            <select value={apt.status || 'scheduled'} onChange={(e) => setField('status', e.target.value)} className="w-full rounded-lg border border-line px-3 py-2">
              <option value="scheduled">{t.scheduled}</option>
              <option value="completed">{t.completed}</option>
              <option value="cancelled">{t.cancelled}</option>
              <option value="pending_reschedule">{t.pendingReschedule}</option>
            </select>
          </div>
        </div>

        {/* special instructions for this visit */}
        <div>
          <label className="mb-1 block text-sm font-medium">{t.notes}</label>
          <textarea value={apt.notes || ''} onChange={(e) => setField('notes', e.target.value)} rows={3} className="w-full rounded-lg border border-line px-3 py-2" />
        </div>

        {/* worker assignment checkboxes */}
        <div>
          <p className="mb-1 text-sm font-medium">{t.assignedWorkers}</p>
          <div className="flex flex-wrap gap-3">
            {workers.map((worker) => (
              <label key={worker.id} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={assignedWorkerIds.includes(worker.id)} // checked if assigned to this appointment
                  onChange={() => toggleWorker(worker.id)}        // clicking assigns/unassigns
                />
                {worker.name}
              </label>
            ))}
          </div>
        </div>

        {/* save + mark-completed buttons + the temporary "Saved!" message */}
        <div className="flex items-center gap-3">
          <button type="submit" className="rounded-lg bg-brand px-6 py-2 font-semibold text-white hover:bg-brand-dark">{t.save}</button>
          {/* only offer "Mark Completed" while the job isn't completed yet */}
          {apt.status !== 'completed' && (
            <button type="button" onClick={handleMarkCompleted} className="rounded-lg border border-brand px-4 py-2 font-semibold text-brand hover:bg-brand hover:text-white">
              ✓ {t.markCompleted}
            </button>
          )}
          {saveMsg && <span className="text-sm font-medium text-brand">{saveMsg}</span>} {/* only visible right after saving */}
        </div>
      </form>
      {/* ── END EDIT FORM ── */}

    </div>
  )
}
