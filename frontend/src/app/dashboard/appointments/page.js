'use client' // tells Next.js this component runs in the browser, not on the server

// dashboard/appointments/page.js — list all appointments, create a new one, cancel one
// Only Yanette (the owner) ever sees this page — she is the only role that can create or edit appointments.

import { useState, useEffect } from 'react'  // React tools for state and side effects
import Link from 'next/link'                 // for clicking through to a single appointment's page
import { supabase } from '@/lib/supabase'    // our shared database connection
import { useUser } from '@/lib/useUser'      // who is logged in + their business + language

export default function AppointmentsPage() {
  // ─── STATE ───
  const [appointments, setAppointments] = useState([]) // appointments holds the list of bookings; starts empty
  const [clients, setClients] = useState([])           // clients fills the "which client?" dropdown in the form
  const [workers, setWorkers] = useState([])           // workers fills the "assign workers" checkboxes in the form
  const [showForm, setShowForm] = useState(false)      // showForm controls whether the create form is visible
  // newApt holds everything typed into the create form, in one object
  const [newApt, setNewApt] = useState({ client_id: '', date: '', time: '', price: '', notes: '' })
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([]) // which workers are checked for the new appointment

  const { businessId, t, loading } = useUser() // businessId scopes every query; t gives translated text

  // ─── EFFECTS ───
  useEffect(() => {              // runs after load and whenever businessId becomes known
    if (businessId) {            // only fetch once we know which business we are
      fetchAppointments()        // load the appointment list
      fetchClients()             // load clients for the dropdown
      fetchWorkers()             // load workers for the checkboxes
    }
  }, [businessId])               // re-run if businessId changes

  // ─── FETCH ───
  async function fetchAppointments() {
    const { data, error } = await supabase   // send a request to Supabase; it gives back { data, error }
      .from('appointments')                  // look inside the appointments table
      .select('*, clients(name, address), appointment_workers(workers(name))') // also pull client info and assigned worker names
      .eq('business_id', businessId)         // filter: only this business's appointments
      .order('date', { ascending: false })   // newest dates first

    if (error) {                                              // if Supabase returned an error
      console.error('Failed to load appointments:', error)    // print it so we can debug
      return                                                  // exit early
    }

    setAppointments(data || [])              // store the results (or an empty list)
  }

  async function fetchClients() {
    const { data, error } = await supabase
      .from('clients')                       // look inside the clients table
      .select('id, name')                    // we only need id (to save) and name (to display)
      .eq('business_id', businessId)         // only this business's clients
      .order('name', { ascending: true })    // alphabetical

    if (error) {                                        // if the query failed
      console.error('Failed to load clients:', error)   // print it so we can debug
      return                                            // exit early
    }

    setClients(data || [])                   // store the results
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
  async function handleCreate(e) {
    e.preventDefault()                       // stop the browser from reloading the page on form submit

    // step 1: insert the appointment itself, and ask for the new row back (.select()) so we get its id
    const { data: created, error } = await supabase
      .from('appointments')                          // look inside the appointments table
      .insert([{                                     // add one new row:
        client_id: newApt.client_id,                 // which client's home
        date: newApt.date,                           // the scheduled date
        time: newApt.time || null,                   // the start time (null if left blank)
        price: Number(newApt.price) || 0,            // the price as a number (0 if blank)
        notes: newApt.notes,                         // special instructions
        business_id: businessId,                     // our business id
      }])
      .select()                                      // give us back the inserted row (so we can read its id)

    if (error) {                                              // if the insert failed
      console.error('Failed to create appointment:', error)   // print it so we can debug
      alert(t.errorGeneric)                                   // tell the user
      return                                                  // stop here
    }

    const newAppointmentId = created?.[0]?.id        // safely grab the new appointment's id

    // step 2: save the worker assignments (one row per checked worker) — only if any were checked
    if (newAppointmentId && selectedWorkerIds.length > 0) {
      const assignmentRows = selectedWorkerIds.map((workerId) => ({ // build one row object per checked worker
        appointment_id: newAppointmentId,                           // link to the appointment we just made
        worker_id: workerId,                                        // link to this worker
      }))

      const { error: assignError } = await supabase
        .from('appointment_workers')           // look inside the assignments join table
        .insert(assignmentRows)                // add all the assignment rows at once

      if (assignError) {                                          // if saving assignments failed
        console.error('Failed to assign workers:', assignError)   // print it; the appointment itself was still created
      }
    }

    setNewApt({ client_id: '', date: '', time: '', price: '', notes: '' }) // clear the form
    setSelectedWorkerIds([])                 // uncheck all workers
    setShowForm(false)                       // hide the form
    fetchAppointments()                      // reload the list so the new appointment appears
  }

  async function handleCancel(appointmentId) {
    if (!confirm(t.confirmDelete)) return    // yes/no box; stop if the user cancels

    const { error } = await supabase
      .from('appointments')                  // look inside the appointments table
      .update({ status: 'cancelled' })       // we don't delete — we mark it cancelled (keeps history)
      .eq('id', appointmentId)               // only this appointment

    if (error) {                                              // if the update failed
      console.error('Failed to cancel appointment:', error)   // print it so we can debug
      alert(t.errorGeneric)                                   // tell the user
      return                                                  // stop here
    }

    fetchAppointments()                      // reload the list so the status badge updates
  }

  function toggleWorker(workerId) {                               // runs when a worker checkbox is clicked
    if (selectedWorkerIds.includes(workerId)) {                   // if this worker is already checked
      setSelectedWorkerIds(selectedWorkerIds.filter((id) => id !== workerId)) // uncheck them (remove from the list)
    } else {
      setSelectedWorkerIds([...selectedWorkerIds, workerId])      // otherwise check them (add to the list)
    }
  }

  function statusLabel(status) {                       // turns a status code into translated display text
    if (status === 'completed') return t.completed
    if (status === 'cancelled') return t.cancelled
    if (status === 'pending_reschedule') return t.pendingReschedule
    return t.scheduled                                 // default: anything else shows as "Scheduled"
  }

  // ─── RENDER ───
  if (loading) return <p className="text-muted">{t.loading}</p> // wait until we know who's logged in

  return (
    <div>

      {/* ── PAGE HEADER ── */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.appointments}</h1>
        {/* toggles the create form open and closed */}
        <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark">
          + {t.addAppointment}
        </button>
      </div>
      {/* ── END PAGE HEADER ── */}

      {/* ── CREATE FORM ── */}
      {/* only rendered while showForm is true */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 grid gap-3 rounded-xl border border-line bg-card p-4 sm:grid-cols-2">

          {/* which client this cleaning is for */}
          <select value={newApt.client_id} onChange={(e) => setNewApt({ ...newApt, client_id: e.target.value })} required className="rounded-lg border border-line px-3 py-2">
            <option value="">{t.selectClient}</option> {/* empty placeholder option forces a real choice */}
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>

          {/* date, time, and price inputs */}
          <input type="date" value={newApt.date} onChange={(e) => setNewApt({ ...newApt, date: e.target.value })} required className="rounded-lg border border-line px-3 py-2" />
          <input type="time" value={newApt.time} onChange={(e) => setNewApt({ ...newApt, time: e.target.value })} className="rounded-lg border border-line px-3 py-2" />
          <input type="number" step="0.01" value={newApt.price} onChange={(e) => setNewApt({ ...newApt, price: e.target.value })} placeholder={`${t.price} ($)`} className="rounded-lg border border-line px-3 py-2" />

          {/* special instructions for this visit */}
          <textarea value={newApt.notes} onChange={(e) => setNewApt({ ...newApt, notes: e.target.value })} placeholder={t.notes} rows={2} className="rounded-lg border border-line px-3 py-2 sm:col-span-2" />

          {/* worker assignment checkboxes — check everyone who is going to this house */}
          <div className="sm:col-span-2">
            <p className="mb-1 text-sm font-medium">{t.assignedWorkers}</p>
            <div className="flex flex-wrap gap-3">
              {workers.map((worker) => (
                // each label is one clickable checkbox + name pair
                <label key={worker.id} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedWorkerIds.includes(worker.id)} // checked if this worker's id is in our list
                    onChange={() => toggleWorker(worker.id)}        // clicking adds/removes them
                  />
                  {worker.name}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark sm:col-span-2">
            {t.save}
          </button>
        </form>
      )}
      {/* ── END CREATE FORM ── */}

      {/* ── APPOINTMENT LIST ── */}
      {/* friendly empty message when there are no appointments yet */}
      {appointments.length === 0 && <p className="text-muted">{t.noAppointmentsList}</p>}

      <div className="space-y-2">
        {appointments.map((apt) => (
          // one row per appointment: details on the left, status + buttons on the right
          <div key={apt.id} className="flex items-center justify-between rounded-xl border border-line bg-card p-4">
            <div>
              <p className="font-semibold">{apt.clients?.name}</p> {/* ?. protects against a missing client join */}
              <p className="text-sm text-muted">{apt.date} {apt.time && `· ${apt.time}`} · ${apt.price}</p> {/* only show the time if one was set */}
            </div>
            <div className="flex items-center gap-2">
              {/* colored status badge: green for completed, red for cancelled, blue otherwise */}
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                apt.status === 'completed' ? 'bg-brand text-white'
                : apt.status === 'cancelled' ? 'bg-red-100 text-red-600'
                : 'bg-accent text-white'
              }`}>
                {statusLabel(apt.status)}
              </span>
              {/* link to this appointment's full detail/edit page */}
              <Link href={`/dashboard/appointments/${apt.id}`} className="rounded-lg border border-line px-3 py-1 text-sm hover:border-brand">
                {t.edit}
              </Link>
              {/* only show the cancel button if it isn't already cancelled */}
              {apt.status !== 'cancelled' && (
                <button onClick={() => handleCancel(apt.id)} className="rounded-lg border border-line px-3 py-1 text-sm text-red-500 hover:border-red-400">
                  {t.cancel}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* ── END APPOINTMENT LIST ── */}

    </div>
  )
}
