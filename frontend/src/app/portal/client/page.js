'use client' // tells Next.js this component runs in the browser, not on the server

// portal/client/page.js — the client portal, MOBILE-FIRST
// A client sees their next cleaning, their payment status, and can request a reschedule
// (a flat fee applies, and Yanette must approve before anything actually moves).

import { useState, useEffect } from 'react'  // React tools for state and side effects
import { supabase } from '@/lib/supabase'    // our shared database connection
import { useUser } from '@/lib/useUser'      // who is logged in + their language

// the flat reschedule fee in dollars — TODO: confirm the exact amount with Yanette (open question in CLAUDE.md)
const RESCHEDULE_FEE = 25

export default function ClientPortal() {
  // ─── STATE ───
  const [clientRow, setClientRow] = useState(null)       // clientRow is my row in the clients table; null until loaded
  const [nextAppointment, setNextAppointment] = useState(null) // nextAppointment is my next upcoming cleaning; null = none
  const [payment, setPayment] = useState(null)           // payment is the payment row for my most recent cleaning
  const [hasPendingRequest, setHasPendingRequest] = useState(false) // true if I already have a reschedule request waiting
  const [showForm, setShowForm] = useState(false)        // showForm controls whether the reschedule form is open
  const [requestDate, setRequestDate] = useState('')     // requestDate is the new date I'm asking for
  const [requestTime, setRequestTime] = useState('')     // requestTime is the new time I'm asking for
  const [sentMsg, setSentMsg] = useState('')             // sentMsg shows the "Request sent!" confirmation

  const { user, t, lang, setLang, loading, logOut } = useUser() // everything from our shared hook

  const todayStr = new Date().toISOString().slice(0, 10) // today as 'YYYY-MM-DD'

  // ─── EFFECTS ───
  useEffect(() => {              // runs when the login info is known
    if (user) {                  // wait until we know who's logged in
      fetchClientRow()           // find my clients-table row, then everything that depends on it
    }
  }, [user])                     // re-run if the user changes

  // ─── FETCH ───
  async function fetchClientRow() {
    const { data, error } = await supabase   // send a request to Supabase; it gives back { data, error }
      .from('clients')                       // look inside the clients table
      .select('id, name, address, frequency') // only the fields we show (NOT owner_notes — those are private to Yanette)
      .eq('user_id', user.id)                // filter: the client row linked to MY login account

    if (error) {                                          // if the query failed
      console.error('Failed to load client row:', error)  // print it so we can debug
      return                                              // exit early
    }

    const me = data?.[0]                     // safely grab the first result
    setClientRow(me || null)                 // store it (or null if my login isn't linked yet)

    if (me) {                                // once we know my client id, load my appointment info
      fetchNextAppointment(me.id)            // my next upcoming cleaning
      fetchPendingRequest(me.id)             // do I already have a request waiting?
    }
  }

  async function fetchNextAppointment(clientId) {
    const { data, error } = await supabase
      .from('appointments')                  // look inside the appointments table
      .select('*')                           // get every column
      .eq('client_id', clientId)             // only MY appointments
      .gte('date', todayStr)                 // only today or later (upcoming)
      .in('status', ['scheduled', 'pending_reschedule']) // only active ones (not completed/cancelled)
      .order('date', { ascending: true })    // soonest first
      .limit(1)                              // we only need the very next one

    if (error) {                                                  // if the query failed
      console.error('Failed to load next appointment:', error)    // print it so we can debug
      return                                                      // exit early
    }

    const next = data?.[0]                   // safely grab the first (soonest) result
    setNextAppointment(next || null)         // store it (or null if nothing upcoming)

    if (next) {                              // if there is an upcoming appointment
      fetchPayment(next.id)                  // also check its payment status
    }
  }

  async function fetchPayment(appointmentId) {
    const { data, error } = await supabase
      .from('payments')                      // look inside the payments table
      .select('*')                           // get every column
      .eq('appointment_id', appointmentId)   // only the payment for THIS appointment

    if (error) {                                        // if the query failed
      console.error('Failed to load payment:', error)   // print it so we can debug
      return                                            // exit early
    }

    setPayment(data?.[0] || null)            // store it (or null — most upcoming jobs aren't billed yet)
  }

  async function fetchPendingRequest(clientId) {
    const { data, error } = await supabase
      .from('reschedule_requests')           // look inside the requests table
      .select('id')                          // we only need to know if any exist
      .eq('client_id', clientId)             // only MY requests
      .eq('status', 'pending')               // only ones still waiting for Yanette

    if (error) {                                                 // if the query failed
      console.error('Failed to check pending requests:', error)  // print it so we can debug
      return                                                     // exit early
    }

    setHasPendingRequest((data || []).length > 0) // true if at least one pending request exists
  }

  // ─── HANDLERS ───
  async function handleSubmitRequest(e) {
    e.preventDefault()                       // stop the browser from reloading the page on form submit

    // step 1: create the reschedule request for Yanette to review
    const { error } = await supabase
      .from('reschedule_requests')           // look inside the requests table
      .insert([{                             // add one new row:
        appointment_id: nextAppointment.id,  // which appointment I want to move
        client_id: clientRow.id,             // it's my request
        requested_date: requestDate,         // the new date I'm asking for
        requested_time: requestTime || null, // the new time (null if I left it blank)
        fee: RESCHEDULE_FEE,                 // the flat fee for rescheduling
        status: 'pending',                   // waiting for Yanette's decision
      }])

    if (error) {                                          // if the insert failed
      console.error('Failed to submit request:', error)   // print it so we can debug
      alert(t.errorGeneric)                               // tell the user
      return                                              // stop here
    }

    // step 2: flag the appointment itself so it shows as "pending reschedule" everywhere
    const { error: aptError } = await supabase
      .from('appointments')                        // look inside the appointments table
      .update({ status: 'pending_reschedule' })    // mark it as in limbo until Yanette decides
      .eq('id', nextAppointment.id)                // only my appointment

    if (aptError) {                                            // if flagging failed
      console.error('Failed to flag appointment:', aptError)   // print it; the request itself was still created
    }

    setShowForm(false)                       // close the form
    setSentMsg(t.requestSent)                // show the confirmation message
    setHasPendingRequest(true)               // block a second request until this one is decided
    fetchNextAppointment(clientRow.id)       // reload so the status badge updates
  }

  function statusLabel(status) {                       // turns a status code into translated display text
    if (status === 'pending_reschedule') return t.pendingReschedule
    return t.scheduled                                 // upcoming appointments are otherwise "Scheduled"
  }

  // ─── RENDER ───
  if (loading) return <p className="p-6 text-muted">{t.loading}</p> // wait until we know who's logged in

  return (
    // mobile-first: a single comfortable column; max-w keeps it tidy on desktop
    <main className="mx-auto min-h-screen max-w-lg bg-page p-4">

      {/* ── HEADER ── */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{clientRow?.name || t.companyName}</h1> {/* greet the client by name once loaded */}
        <div className="flex gap-2">
          <button onClick={() => setLang(lang === 'en' ? 'es' : 'en')} className="rounded-lg border border-line px-3 py-1 text-sm text-muted">
            {lang === 'en' ? 'ES' : 'EN'} {/* show the language you would switch TO */}
          </button>
          <button onClick={logOut} className="rounded-lg border border-line px-3 py-1 text-sm text-muted">{t.logOut}</button>
        </div>
      </div>
      {/* ── END HEADER ── */}

      {/* ── NEXT CLEANING CARD ── */}
      <div className="mb-4 rounded-xl border border-line bg-card p-5">
        <h2 className="mb-2 text-lg font-semibold">{t.yourNextCleaning}</h2>

        {/* if nothing is scheduled, say so kindly */}
        {!nextAppointment && <p className="text-muted">{t.noUpcoming}</p>}

        {nextAppointment && (
          <>
            <p className="text-2xl font-extrabold text-brand">{nextAppointment.date}</p>
            {nextAppointment.time && <p className="text-lg">{t.time}: {nextAppointment.time}</p>} {/* only show a time if one was set */}
            <p className="text-sm text-muted">{clientRow?.address}</p>
            {nextAppointment.notes && <p className="mt-1 text-sm italic text-muted">{nextAppointment.notes}</p>} {/* special instructions, if any */}
            {/* status badge — blue normally, yellow while a reschedule is pending */}
            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
              nextAppointment.status === 'pending_reschedule' ? 'bg-newclient text-ink' : 'bg-accent text-white'
            }`}>
              {statusLabel(nextAppointment.status)}
            </span>
          </>
        )}
      </div>
      {/* ── END NEXT CLEANING CARD ── */}

      {/* ── PAYMENT STATUS CARD ── */}
      {/* only shown when a payment row exists for the next appointment */}
      {payment && (
        <div className="mb-4 rounded-xl border border-line bg-card p-5">
          <h2 className="mb-2 text-lg font-semibold">{t.paymentStatus}</h2>
          <div className="flex items-center justify-between">
            <p className="text-xl font-bold">${Number(payment.amount).toFixed(2)}</p>
            {/* green badge when paid, yellow when still owed */}
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${payment.paid ? 'bg-brand text-white' : 'bg-newclient text-ink'}`}>
              {payment.paid ? t.paid : t.unpaid}
            </span>
          </div>
          {/* gentle reminder of how to pay */}
          <p className="mt-2 text-sm text-muted">{t.cash} · {t.zelle} · {t.venmo}</p>
          <p className="text-xs italic text-muted">{t.cardComingSoon}</p>
        </div>
      )}
      {/* ── END PAYMENT STATUS CARD ── */}

      {/* ── RESCHEDULE REQUEST ── */}
      {/* only offered when there IS an upcoming appointment */}
      {nextAppointment && (
        <div className="rounded-xl border border-line bg-card p-5">
          <h2 className="mb-2 text-lg font-semibold">{t.requestReschedule}</h2>

          {/* the green confirmation right after sending */}
          {sentMsg && <p className="mb-2 font-medium text-brand">✓ {sentMsg}</p>}

          {/* if a request is already waiting, explain instead of offering the form again */}
          {hasPendingRequest && !sentMsg && <p className="text-muted">{t.requestPendingNotice}</p>}

          {/* the open-form button — hidden while a request is pending */}
          {!hasPendingRequest && !showForm && (
            <>
              <p className="mb-3 text-sm text-muted">{t.rescheduleNote} ({t.fee}: ${RESCHEDULE_FEE})</p>
              <button onClick={() => setShowForm(true)} className="w-full rounded-xl bg-brand py-3 font-bold text-white">
                {t.requestReschedule}
              </button>
            </>
          )}

          {/* the actual form — date required, time optional */}
          {showForm && (
            <form onSubmit={handleSubmitRequest} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">{t.newDate}</label>
                <input type="date" value={requestDate} onChange={(e) => setRequestDate(e.target.value)} required min={todayStr} className="w-full rounded-lg border border-line px-3 py-2" /> {/* min stops picking a past date */}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t.newTime}</label>
                <input type="time" value={requestTime} onChange={(e) => setRequestTime(e.target.value)} className="w-full rounded-lg border border-line px-3 py-2" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 rounded-xl bg-brand py-3 font-bold text-white">{t.submitRequest}</button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-line px-4 py-3 text-muted">{t.cancel}</button>
              </div>
            </form>
          )}
        </div>
      )}
      {/* ── END RESCHEDULE REQUEST ── */}

    </main>
  )
}
