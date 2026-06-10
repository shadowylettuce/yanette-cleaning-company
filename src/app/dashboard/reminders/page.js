'use client' // tells Next.js this component runs in the browser, not on the server

// dashboard/reminders/page.js — two jobs on one page:
//   1. the reschedule-request queue: Yanette approves or denies client requests here
//   2. notification preferences: how each user wants to be reminded (app/email/sms/all)
// NOTE: actual email/SMS sending is a future integration — preferences are stored now so they're ready.

import { useState, useEffect } from 'react'  // React tools for state and side effects
import { supabase } from '@/lib/supabase'    // our shared database connection
import { useUser } from '@/lib/useUser'      // who is logged in + their business + language

export default function RemindersPage() {
  // ─── STATE ───
  const [requests, setRequests] = useState([])   // requests holds the pending reschedule requests; starts empty
  const [appUsers, setAppUsers] = useState([])   // appUsers holds everyone in the users table (for the preferences list)

  const { businessId, t, loading } = useUser()   // businessId scopes the queries; t gives translated text

  // ─── EFFECTS ───
  useEffect(() => {              // runs after load and whenever businessId becomes known
    if (businessId) {            // only fetch once we know which business we are
      fetchRequests()            // load the reschedule queue
      fetchUsers()               // load all users for the preferences section
    }
  }, [businessId])               // re-run if businessId changes

  // ─── FETCH ───
  async function fetchRequests() {
    const { data, error } = await supabase   // send a request to Supabase; it gives back { data, error }
      .from('reschedule_requests')           // look inside the reschedule_requests table
      .select('*, clients(name, business_id), appointments(date, time)') // also pull the client's name and the ORIGINAL appointment date/time
      .eq('status', 'pending')               // only requests still waiting for a decision
      .order('created_at', { ascending: true }) // oldest requests first (fair: first come, first served)

    if (error) {                                                    // if Supabase returned an error
      console.error('Failed to load reschedule requests:', error)   // print it so we can debug
      return                                                        // exit early
    }

    // requests have no business_id column, so keep only ones whose CLIENT belongs to our business
    const ours = (data || []).filter((row) => row.clients?.business_id === businessId) // ?. protects against a missing join
    setRequests(ours)                        // store the filtered results
  }

  async function fetchUsers() {
    const { data, error } = await supabase
      .from('users')                         // look inside the users table
      .select('*')                           // get every column (role, preferences)
      .eq('business_id', businessId)         // only this business's users
      .order('role', { ascending: true })    // group by role alphabetically

    if (error) {                                      // if the query failed
      console.error('Failed to load users:', error)   // print it so we can debug
      return                                          // exit early
    }

    setAppUsers(data || [])                  // store the results
  }

  // ─── HANDLERS ───
  async function handleApprove(request) {
    // step 1: mark the request itself as approved
    const { error } = await supabase
      .from('reschedule_requests')           // look inside the requests table
      .update({ status: 'approved' })        // record Yanette's decision
      .eq('id', request.id)                  // only this request

    if (error) {                                          // if the update failed
      console.error('Failed to approve request:', error)  // print it so we can debug
      alert(t.errorGeneric)                               // tell the user
      return                                              // stop here
    }

    // step 2: actually MOVE the appointment to the requested date/time and put it back on the schedule
    const { error: aptError } = await supabase
      .from('appointments')                        // look inside the appointments table
      .update({                                    // change these columns...
        date: request.requested_date,              // move to the new date the client asked for
        time: request.requested_time,              // and the new time
        status: 'scheduled',                       // it's a normal scheduled job again
        reschedule_fee: request.fee || 0,          // record the flat fee charged for this reschedule
      })
      .eq('id', request.appointment_id)            // ...only on the original appointment

    if (aptError) {                                              // if moving the appointment failed
      console.error('Failed to move appointment:', aptError)     // print it so we can debug
    }

    fetchRequests()                          // reload the queue so this request disappears
  }

  async function handleDeny(request) {
    // step 1: mark the request as denied
    const { error } = await supabase
      .from('reschedule_requests')           // look inside the requests table
      .update({ status: 'denied' })          // record Yanette's decision
      .eq('id', request.id)                  // only this request

    if (error) {                                       // if the update failed
      console.error('Failed to deny request:', error)  // print it so we can debug
      alert(t.errorGeneric)                            // tell the user
      return                                           // stop here
    }

    // step 2: put the original appointment back to normal "scheduled" (it was pending_reschedule)
    const { error: aptError } = await supabase
      .from('appointments')                  // look inside the appointments table
      .update({ status: 'scheduled' })       // back to its original date/time, unchanged
      .eq('id', request.appointment_id)      // only the original appointment

    if (aptError) {                                              // if restoring the status failed
      console.error('Failed to restore appointment:', aptError)  // print it so we can debug
    }

    fetchRequests()                          // reload the queue so this request disappears
  }

  async function handlePrefChange(userId, newPref) {
    const { error } = await supabase
      .from('users')                                  // look inside the users table
      .update({ notification_preference: newPref })   // save the new reminder preference
      .eq('id', userId)                               // only on this user's row

    if (error) {                                            // if the update failed
      console.error('Failed to update preference:', error)  // print it so we can debug
      alert(t.errorGeneric)                                 // tell the user
      return                                                // stop here
    }

    fetchUsers()                             // reload so the dropdown shows the saved value
  }

  function roleLabel(role) {                         // turns a role code into translated display text
    if (role === 'owner') return t.dashboard
    if (role === 'manager') return t.manager
    if (role === 'cleaner') return t.cleaner
    return t.client                                  // default: client
  }

  // ─── RENDER ───
  if (loading) return <p className="text-muted">{t.loading}</p> // wait until we know who's logged in

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t.reminders}</h1>

      {/* ── RESCHEDULE REQUEST QUEUE ── */}
      <h2 className="mb-3 text-lg font-semibold">{t.rescheduleRequests}</h2>
      {/* friendly empty message when the queue is clear */}
      {requests.length === 0 && <p className="mb-8 text-muted">{t.noRequests}</p>}

      <div className="mb-8 space-y-2">
        {requests.map((request) => (
          // one card per pending request: details on the left, approve/deny on the right
          <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card p-4">
            <div>
              <p className="font-semibold">{request.clients?.name}</p> {/* ?. protects against a missing join */}
              {/* show the original appointment so Yanette can compare old vs requested */}
              <p className="text-sm text-muted">
                {request.appointments?.date} {request.appointments?.time && `· ${request.appointments.time}`} {/* the ORIGINAL slot */}
                {' → '}
                {request.requested_date} {request.requested_time && `· ${request.requested_time}`} {/* the REQUESTED slot */}
              </p>
              <p className="text-sm text-accent">{t.fee}: ${Number(request.fee || 0).toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleApprove(request)} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                ✓ {t.approve}
              </button>
              <button onClick={() => handleDeny(request)} className="rounded-lg border border-line px-4 py-2 text-sm text-red-500 hover:border-red-400">
                ✕ {t.deny}
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* ── END RESCHEDULE REQUEST QUEUE ── */}

      {/* ── NOTIFICATION PREFERENCES ── */}
      <h2 className="mb-3 text-lg font-semibold">{t.notificationPrefs}</h2>
      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            {/* header row with translated column names */}
            <tr className="border-b border-line text-muted">
              <th className="px-4 py-3">{t.user}</th>
              <th className="px-4 py-3">{t.role}</th>
              <th className="px-4 py-3">{t.notificationPrefs}</th>
            </tr>
          </thead>
          <tbody>
            {appUsers.map((appUser) => (
              // one row per user; the dropdown saves immediately when changed
              <tr key={appUser.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{appUser.id.slice(0, 8)}…</td> {/* short id — the users table stores no names (those live on clients/workers) */}
                <td className="px-4 py-3">{roleLabel(appUser.role)}</td>
                <td className="px-4 py-3">
                  <select
                    value={appUser.notification_preference || 'app'}            // current saved preference (default app)
                    onChange={(e) => handlePrefChange(appUser.id, e.target.value)} // changing saves right away
                    className="rounded-lg border border-line px-2 py-1"
                  >
                    <option value="app">{t.prefApp}</option>
                    <option value="email">{t.prefEmail}</option>
                    <option value="sms">{t.prefSms}</option>
                    <option value="all">{t.prefAll}</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* ── END NOTIFICATION PREFERENCES ── */}

    </div>
  )
}
