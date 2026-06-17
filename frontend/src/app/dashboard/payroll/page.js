'use client' // tells Next.js this component runs in the browser, not on the server

// dashboard/payroll/page.js — worker clock-in/out log + weekly hours summary
// Yanette uses this to see who worked when, and roughly what she owes each worker this week.

import { useState, useEffect } from 'react'  // React tools for state and side effects
import { supabase } from '@/lib/supabase'    // our shared database connection
import { useUser } from '@/lib/useUser'      // who is logged in + their business + language

export default function PayrollPage() {
  // ─── STATE ───
  const [timesheets, setTimesheets] = useState([]) // timesheets holds the clock-in/out rows; starts empty
  const [workers, setWorkers] = useState([])       // workers holds this business's workers (for rates + the weekly table)

  const { businessId, t, loading } = useUser() // businessId scopes the queries; t gives translated text

  // ─── EFFECTS ───
  useEffect(() => {              // runs after load and whenever businessId becomes known
    if (businessId) {            // only fetch once we know which business we are
      fetchWorkers()             // load the workers (names + hourly rates)
      fetchTimesheets()          // load the clock-in/out log
    }
  }, [businessId])               // re-run if businessId changes

  // ─── FETCH ───
  async function fetchWorkers() {
    const { data, error } = await supabase   // send a request to Supabase; it gives back { data, error }
      .from('workers')                       // look inside the workers table
      .select('id, name, hourly_rate')       // we need the rate to estimate pay
      .eq('business_id', businessId)         // only this business's workers
      .order('name', { ascending: true })    // alphabetical

    if (error) {                                        // if the query failed
      console.error('Failed to load workers:', error)   // print it so we can debug
      return                                            // exit early
    }

    setWorkers(data || [])                   // store the results
  }

  async function fetchTimesheets() {
    const { data, error } = await supabase
      .from('timesheets')                    // look inside the timesheets table
      .select('*, workers(name, business_id)') // also pull the worker's name (and business, to filter below)
      .order('date', { ascending: false })   // newest shifts first

    if (error) {                                          // if the query failed
      console.error('Failed to load timesheets:', error)  // print it so we can debug
      return                                              // exit early
    }

    // timesheets have no business_id column, so keep only rows whose WORKER belongs to our business
    const ours = (data || []).filter((row) => row.workers?.business_id === businessId) // ?. protects against a missing join
    setTimesheets(ours)                      // store the filtered results
  }

  // ─── HANDLERS ───
  // (no user actions on this page — it's a read-only log)

  // weekly-hours helpers the render section uses ----------------------------

  function startOfThisWeek() {                         // finds the most recent Sunday (the start of the current week)
    const now = new Date()                             // today
    const sunday = new Date(now)                       // copy of today we can change
    sunday.setDate(now.getDate() - now.getDay())       // go back getDay() days (Sunday = 0, Monday = 1, ...)
    sunday.setHours(0, 0, 0, 0)                        // midnight, so the whole of Sunday counts
    return sunday
  }

  const weekStart = startOfThisWeek()                  // the cutoff — shifts on/after this date count as "this week"

  function weeklyHoursFor(workerId) {                                       // total hours one worker logged this week
    return timesheets
      .filter((row) => row.worker_id === workerId)                          // only this worker's shifts
      .filter((row) => row.date && new Date(row.date + 'T00:00:00') >= weekStart) // only shifts from this week ('T00:00:00' avoids timezone surprises)
      .reduce((sum, row) => sum + (Number(row.hours_worked) || 0), 0)       // add up the hours (0 for shifts still in progress)
  }

  function formatTime(timestamp) {                          // turns a raw timestamp into a short readable time like "8:05 AM"
    if (!timestamp) return '—'                              // show a dash if the worker hasn't clocked out yet
    return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) // e.g. "8:05 AM"
  }

  // ─── RENDER ───
  if (loading) return <p className="text-muted">{t.loading}</p> // wait until we know who's logged in

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t.payroll}</h1>

      {/* ── WEEKLY HOURS SUMMARY ── */}
      {/* one card per worker: hours this week and the estimated pay (hours × hourly rate) */}
      <h2 className="mb-3 text-lg font-semibold">{t.weeklyHours}</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workers.map((worker) => {
          const hours = weeklyHoursFor(worker.id)                       // this worker's hours so far this week
          const pay = hours * (Number(worker.hourly_rate) || 0)         // estimated pay = hours × their hourly rate
          return (
            <div key={worker.id} className="rounded-xl border border-line bg-card p-4">
              <p className="font-semibold">{worker.name}</p>
              <p className="text-2xl font-bold text-brand">{hours.toFixed(1)} {t.hoursWorked.toLowerCase()}</p> {/* e.g. "12.5 hours" */}
              <p className="text-sm text-muted">{t.estimatedPay}: ${pay.toFixed(2)}</p>
            </div>
          )
        })}
      </div>
      {/* ── END WEEKLY HOURS SUMMARY ── */}

      {/* ── CLOCK LOG ── */}
      <h2 className="mb-3 text-lg font-semibold">{t.clockLog}</h2>
      {/* friendly empty message when nobody has clocked in yet */}
      {timesheets.length === 0 && <p className="text-muted">{t.noTimesheets}</p>}

      {/* simple table of every shift, newest first */}
      {timesheets.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-line bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              {/* header row with translated column names */}
              <tr className="border-b border-line text-muted">
                <th className="px-4 py-3">{t.date}</th>
                <th className="px-4 py-3">{t.worker}</th>
                <th className="px-4 py-3">{t.clockIn}</th>
                <th className="px-4 py-3">{t.clockOut}</th>
                <th className="px-4 py-3">{t.hoursWorked}</th>
              </tr>
            </thead>
            <tbody>
              {timesheets.map((row) => (
                // one table row per shift
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{row.date}</td>
                  <td className="px-4 py-3 font-medium">{row.workers?.name}</td> {/* ?. protects against a missing join */}
                  <td className="px-4 py-3">{formatTime(row.clock_in)}</td>
                  <td className="px-4 py-3">{formatTime(row.clock_out)}</td>
                  <td className="px-4 py-3">{row.hours_worked ?? '—'}</td> {/* dash while the shift is still open */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* ── END CLOCK LOG ── */}

    </div>
  )
}
