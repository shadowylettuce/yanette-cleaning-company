'use client' // tells Next.js this component runs in the browser, not on the server

// portal/manager/page.js — the manager (driver) portal, MOBILE-FIRST
// The manager sees today's driving route (every house, in time order),
// which cleaners are going to each house, and ONE clock-in/out for the whole day.

import { useState, useEffect } from 'react'  // React tools for state and side effects
import { supabase } from '@/lib/supabase'    // our shared database connection
import { useUser } from '@/lib/useUser'      // who is logged in + their business + language

export default function ManagerPortal() {
  // ─── STATE ───
  const [jobs, setJobs] = useState([])             // jobs holds today's appointments (the route); starts empty
  const [workerRow, setWorkerRow] = useState(null) // workerRow is this manager's row in the workers table (needed for timesheets)
  const [todayShift, setTodayShift] = useState(null) // todayShift is today's timesheet row; null = not clocked in yet

  const { user, businessId, t, lang, setLang, loading, logOut } = useUser() // everything from our shared hook

  const todayStr = new Date().toISOString().slice(0, 10) // today as 'YYYY-MM-DD'

  // ─── EFFECTS ───
  useEffect(() => {                    // runs when the login info and business are known
    if (user && businessId) {          // wait until we have both
      fetchWorkerRow()                 // find this manager's workers-table row
      fetchTodaysJobs()                // load today's route
    }
  }, [user, businessId])               // re-run if either changes

  // ─── FETCH ───
  async function fetchWorkerRow() {
    const { data, error } = await supabase   // send a request to Supabase; it gives back { data, error }
      .from('workers')                       // look inside the workers table
      .select('*')                           // get every column
      .eq('user_id', user.id)                // filter: the worker row linked to MY login account

    if (error) {                                            // if the query failed
      console.error('Failed to load worker row:', error)    // print it so we can debug
      return                                                // exit early
    }

    const me = data?.[0]                     // safely grab the first result
    setWorkerRow(me || null)                 // store it (or null if my login isn't linked to a worker yet)

    if (me) {                                // if we found my worker row
      fetchTodayShift(me.id)                 // also check whether I already clocked in today
    }
  }

  async function fetchTodayShift(workerId) {
    const { data, error } = await supabase
      .from('timesheets')                    // look inside the timesheets table
      .select('*')                           // get every column
      .eq('worker_id', workerId)             // only my shifts
      .eq('date', todayStr)                  // only today's shift

    if (error) {                                              // if the query failed
      console.error('Failed to load today\'s shift:', error)  // print it so we can debug
      return                                                  // exit early
    }

    setTodayShift(data?.[0] || null)         // store today's row (or null if I haven't clocked in)
  }

  async function fetchTodaysJobs() {
    const { data, error } = await supabase
      .from('appointments')                  // look inside the appointments table
      .select('*, clients(name, address, city), appointment_workers(workers(name, tier))') // also pull each house's info and who's assigned
      .eq('business_id', businessId)         // only this business's jobs
      .eq('date', todayStr)                  // only today
      .neq('status', 'cancelled')            // skip cancelled jobs
      .order('time', { ascending: true })    // in driving order: earliest first

    if (error) {                                            // if the query failed
      console.error('Failed to load today\'s route:', error) // print it so we can debug
      return                                                // exit early
    }

    setJobs(data || [])                      // store the route (or an empty list)
  }

  // ─── HANDLERS ───
  async function handleClockIn() {           // runs ONCE at the start of the day
    const { error } = await supabase
      .from('timesheets')                    // look inside the timesheets table
      .insert([{                             // add one new shift row:
        worker_id: workerRow.id,             // it's my shift
        clock_in: new Date().toISOString(),  // right now
        date: todayStr,                      // today's date
      }])

    if (error) {                                       // if the insert failed
      console.error('Failed to clock in:', error)      // print it so we can debug
      alert(t.errorGeneric)                            // tell the user
      return                                           // stop here
    }

    fetchTodayShift(workerRow.id)            // reload so the button switches to "Clock Out"
  }

  async function handleClockOut() {          // runs ONCE at the end of the day
    const now = new Date()                                                   // the clock-out moment
    const startedAt = new Date(todayShift.clock_in)                          // when I clocked in this morning
    const hours = (now - startedAt) / (1000 * 60 * 60)                       // milliseconds difference → hours

    const { error } = await supabase
      .from('timesheets')                            // look inside the timesheets table
      .update({                                      // change these columns...
        clock_out: now.toISOString(),                // record when I stopped
        hours_worked: Math.round(hours * 100) / 100, // store hours rounded to 2 decimal places
      })
      .eq('id', todayShift.id)                       // ...only on today's shift row

    if (error) {                                       // if the update failed
      console.error('Failed to clock out:', error)     // print it so we can debug
      alert(t.errorGeneric)                            // tell the user
      return                                           // stop here
    }

    fetchTodayShift(workerRow.id)            // reload so the screen shows "Day complete"
  }

  function cleanerNames(job) {                                       // builds the list of CLEANERS going to one house
    return (job.appointment_workers || [])                           // the assignment rows (or empty list)
      .map((row) => row.workers)                                     // pull each joined worker object
      .filter((worker) => worker?.tier === 'cleaner')                // keep only cleaners (the manager drives, doesn't clean)
      .map((worker) => worker.name)                                  // just their names
      .join(', ')                                                    // glued with commas
  }

  function formatTime(timestamp) {                          // turns a raw timestamp into "8:05 AM" style text
    return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  // ─── RENDER ───
  if (loading) return <p className="p-6 text-muted">{t.loading}</p> // wait until we know who's logged in

  return (
    // mobile-first: a single comfortable column; max-w keeps it tidy if opened on desktop
    <main className="mx-auto min-h-screen max-w-lg bg-page p-4">

      {/* ── HEADER ── */}
      {/* portal title + language toggle + log out */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{t.todaysRoute}</h1>
        <div className="flex gap-2">
          <button onClick={() => setLang(lang === 'en' ? 'es' : 'en')} className="rounded-lg border border-line px-3 py-1 text-sm text-muted">
            {lang === 'en' ? 'ES' : 'EN'} {/* show the language you would switch TO */}
          </button>
          <button onClick={logOut} className="rounded-lg border border-line px-3 py-1 text-sm text-muted">{t.logOut}</button>
        </div>
      </div>
      {/* ── END HEADER ── */}

      {/* ── CLOCK IN / OUT ── */}
      {/* one big thumb-friendly button whose state walks through the day */}
      <div className="mb-6 rounded-xl border border-line bg-card p-4 text-center">
        {!todayShift && (                       // CASE 1: haven't clocked in yet today
          <>
            <p className="mb-2 text-sm text-muted">{t.notClockedIn}</p>
            <button onClick={handleClockIn} disabled={!workerRow} className="w-full rounded-xl bg-brand py-4 text-lg font-bold text-white disabled:opacity-50">
              {t.clockIn} {/* button disabled if this login isn't linked to a worker row yet */}
            </button>
          </>
        )}
        {todayShift && !todayShift.clock_out && ( // CASE 2: clocked in, still working
          <>
            <p className="mb-2 text-sm text-muted">{t.clockedInAt} {formatTime(todayShift.clock_in)}</p>
            <button onClick={handleClockOut} className="w-full rounded-xl bg-accent py-4 text-lg font-bold text-white">
              {t.clockOut}
            </button>
          </>
        )}
        {todayShift && todayShift.clock_out && (  // CASE 3: day is finished
          <p className="font-semibold text-brand">
            ✓ {t.dayComplete} {t.clockedOutAt} {formatTime(todayShift.clock_out)} · {todayShift.hours_worked} {t.hoursWorked.toLowerCase()}
          </p>
        )}
      </div>
      {/* ── END CLOCK IN / OUT ── */}

      {/* ── TODAY'S ROUTE ── */}
      {/* friendly message when there is nothing to drive to */}
      {jobs.length === 0 && <p className="text-muted">{t.noJobsToday}</p>}

      <div className="space-y-3">
        {jobs.map((job, index) => (
          // one card per stop on the route, numbered in driving order
          <div key={job.id} className="rounded-xl border border-line bg-card p-4">
            <div className="flex items-start gap-3">
              {/* stop number circle */}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-white">{index + 1}</span>
              <div>
                <p className="font-semibold">{job.clients?.name}</p> {/* ?. protects against a missing join */}
                <p className="text-sm text-muted">{job.clients?.address}{job.clients?.city && `, ${job.clients.city}`}</p> {/* only add city if saved */}
                {job.time && <p className="text-sm">{t.time}: {job.time}</p>} {/* only show a time if one was set */}
                {/* which cleaners ride along to this house */}
                <p className="text-sm text-accent">{t.cleanersGoing}: {cleanerNames(job) || t.none}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* ── END TODAY'S ROUTE ── */}

    </main>
  )
}
