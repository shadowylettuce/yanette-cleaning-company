'use client' // tells Next.js this component runs in the browser, not on the server

// portal/cleaner/page.js — the cleaner portal, MOBILE-FIRST
// A cleaner sees ONLY the jobs assigned to them today, clocks in at the first house
// and out after the last, and can see their total hours for the current week.

import { useState, useEffect } from 'react'  // React tools for state and side effects
import { supabase } from '@/lib/supabase'    // our shared database connection
import { useUser } from '@/lib/useUser'      // who is logged in + their business + language

export default function CleanerPortal() {
  // ─── STATE ───
  const [jobs, setJobs] = useState([])               // jobs holds MY assigned appointments for today; starts empty
  const [workerRow, setWorkerRow] = useState(null)   // workerRow is my row in the workers table
  const [todayShift, setTodayShift] = useState(null) // todayShift is today's timesheet row; null = not clocked in yet
  const [weekHours, setWeekHours] = useState(0)      // weekHours is my total hours worked this week

  const { user, t, lang, setLang, loading, logOut } = useUser() // everything from our shared hook

  const todayStr = new Date().toISOString().slice(0, 10) // today as 'YYYY-MM-DD'

  // ─── EFFECTS ───
  useEffect(() => {              // runs when the login info is known
    if (user) {                  // wait until we know who's logged in
      fetchWorkerRow()           // find my workers-table row, then everything that depends on it
    }
  }, [user])                     // re-run if the user changes

  // ─── FETCH ───
  async function fetchWorkerRow() {
    const { data, error } = await supabase   // send a request to Supabase; it gives back { data, error }
      .from('workers')                       // look inside the workers table
      .select('*')                           // get every column
      .eq('user_id', user.id)                // filter: the worker row linked to MY login account

    if (error) {                                          // if the query failed
      console.error('Failed to load worker row:', error)  // print it so we can debug
      return                                              // exit early
    }

    const me = data?.[0]                     // safely grab the first result
    setWorkerRow(me || null)                 // store it (or null if not linked yet)

    if (me) {                                // once we know my worker id, load everything else
      fetchMyJobs(me.id)                     // my assigned jobs today
      fetchTodayShift(me.id)                 // my clock-in state
      fetchWeekHours(me.id)                  // my hours this week
    }
  }

  async function fetchMyJobs(workerId) {
    // start from the ASSIGNMENTS table: rows that link ME to an appointment, pulling the appointment + client through joins
    const { data, error } = await supabase
      .from('appointment_workers')           // look inside the assignments join table
      .select('appointments(id, date, time, status, notes, clients(name, address, city))') // pull the full appointment + client through the joins
      .eq('worker_id', workerId)             // only MY assignments

    if (error) {                                       // if the query failed
      console.error('Failed to load my jobs:', error)  // print it so we can debug
      return                                           // exit early
    }

    // unwrap the joined appointments and keep only today's non-cancelled ones
    const todays = (data || [])
      .map((row) => row.appointments)                          // pull the appointment object out of each assignment row
      .filter((apt) => apt && apt.date === todayStr && apt.status !== 'cancelled') // today only, skip cancelled (and skip broken joins)
      .sort((a, b) => (a.time || '').localeCompare(b.time || '')) // earliest start time first

    setJobs(todays)                          // store my schedule for today
  }

  async function fetchTodayShift(workerId) {
    const { data, error } = await supabase
      .from('timesheets')                    // look inside the timesheets table
      .select('*')                           // get every column
      .eq('worker_id', workerId)             // only my shifts
      .eq('date', todayStr)                  // only today

    if (error) {                                              // if the query failed
      console.error('Failed to load today\'s shift:', error)  // print it so we can debug
      return                                                  // exit early
    }

    setTodayShift(data?.[0] || null)         // store today's row (or null if not clocked in)
  }

  async function fetchWeekHours(workerId) {
    // figure out the most recent Sunday — the start of the current week
    const now = new Date()                             // today
    const sunday = new Date(now)                       // a copy we can change
    sunday.setDate(now.getDate() - now.getDay())       // step back to Sunday (getDay: Sunday = 0)
    const sundayStr = sunday.toISOString().slice(0, 10) // as 'YYYY-MM-DD'

    const { data, error } = await supabase
      .from('timesheets')                    // look inside the timesheets table
      .select('hours_worked')                // we only need the hours column
      .eq('worker_id', workerId)             // only my shifts
      .gte('date', sundayStr)                // only shifts since Sunday

    if (error) {                                          // if the query failed
      console.error('Failed to load week hours:', error)  // print it so we can debug
      return                                              // exit early
    }

    // add up all the hours (shifts still in progress have null hours and count as 0)
    const total = (data || []).reduce((sum, row) => sum + (Number(row.hours_worked) || 0), 0)
    setWeekHours(total)                      // store the weekly total
  }

  // ─── HANDLERS ───
  async function handleClockIn() {           // runs at the FIRST house of the day
    const { error } = await supabase
      .from('timesheets')                    // look inside the timesheets table
      .insert([{                             // add one new shift row:
        worker_id: workerRow.id,             // it's my shift
        clock_in: new Date().toISOString(),  // right now
        date: todayStr,                      // today's date
      }])

    if (error) {                                     // if the insert failed
      console.error('Failed to clock in:', error)    // print it so we can debug
      alert(t.errorGeneric)                          // tell the user
      return                                         // stop here
    }

    fetchTodayShift(workerRow.id)            // reload so the button switches to "Clock Out"
  }

  async function handleClockOut() {          // runs after the LAST house of the day
    const now = new Date()                                                   // the clock-out moment
    const startedAt = new Date(todayShift.clock_in)                          // when I clocked in
    const hours = (now - startedAt) / (1000 * 60 * 60)                       // milliseconds difference → hours

    const { error } = await supabase
      .from('timesheets')                            // look inside the timesheets table
      .update({                                      // change these columns...
        clock_out: now.toISOString(),                // record when I stopped
        hours_worked: Math.round(hours * 100) / 100, // hours rounded to 2 decimal places
      })
      .eq('id', todayShift.id)                       // ...only on today's shift row

    if (error) {                                      // if the update failed
      console.error('Failed to clock out:', error)    // print it so we can debug
      alert(t.errorGeneric)                           // tell the user
      return                                          // stop here
    }

    fetchTodayShift(workerRow.id)            // reload so the screen shows "Day complete"
    fetchWeekHours(workerRow.id)             // and refresh the weekly total with today's hours
  }

  function formatTime(timestamp) {                          // turns a raw timestamp into "8:05 AM" style text
    return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  // ─── RENDER ───
  if (loading) return <p className="p-6 text-muted">{t.loading}</p> // wait until we know who's logged in

  return (
    // mobile-first: a single comfortable column; max-w keeps it tidy on desktop
    <main className="mx-auto min-h-screen max-w-lg bg-page p-4">

      {/* ── HEADER ── */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{t.todaysJobs}</h1>
        <div className="flex gap-2">
          <button onClick={() => setLang(lang === 'en' ? 'es' : 'en')} className="rounded-lg border border-line px-3 py-1 text-sm text-muted">
            {lang === 'en' ? 'ES' : 'EN'} {/* show the language you would switch TO */}
          </button>
          <button onClick={logOut} className="rounded-lg border border-line px-3 py-1 text-sm text-muted">{t.logOut}</button>
        </div>
      </div>
      {/* ── END HEADER ── */}

      {/* ── WEEKLY HOURS CARD ── */}
      {/* the cleaner's running total for the current week */}
      <div className="mb-4 rounded-xl border border-line bg-card p-4 text-center">
        <p className="text-sm text-muted">{t.hoursThisWeek}</p>
        <p className="text-3xl font-extrabold text-brand">{weekHours.toFixed(1)}</p>
      </div>
      {/* ── END WEEKLY HOURS CARD ── */}

      {/* ── CLOCK IN / OUT ── */}
      {/* one big thumb-friendly button whose state walks through the day */}
      <div className="mb-6 rounded-xl border border-line bg-card p-4 text-center">
        {!todayShift && (                       // CASE 1: haven't clocked in yet today
          <>
            <p className="mb-2 text-sm text-muted">{t.notClockedIn}</p>
            <button onClick={handleClockIn} disabled={!workerRow} className="w-full rounded-xl bg-brand py-4 text-lg font-bold text-white disabled:opacity-50">
              {t.clockIn} {/* disabled if this login isn't linked to a worker row yet */}
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

      {/* ── TODAY'S JOB LIST ── */}
      {/* friendly message when nothing is assigned today */}
      {jobs.length === 0 && <p className="text-muted">{t.noJobsToday}</p>}

      <div className="space-y-3">
        {jobs.map((job, index) => (
          // one card per assigned house, in time order
          <div key={job.id} className="rounded-xl border border-line bg-card p-4">
            <div className="flex items-start gap-3">
              {/* job number circle */}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-white">{index + 1}</span>
              <div>
                <p className="font-semibold">{job.clients?.name}</p> {/* ?. protects against a missing join */}
                <p className="text-sm text-muted">{job.clients?.address}{job.clients?.city && `, ${job.clients.city}`}</p> {/* only add city if saved */}
                {job.time && <p className="text-sm">{t.time}: {job.time}</p>} {/* only show a time if one was set */}
                {job.notes && <p className="text-sm italic text-muted">{job.notes}</p>} {/* special instructions, if any */}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* ── END TODAY'S JOB LIST ── */}

    </main>
  )
}
