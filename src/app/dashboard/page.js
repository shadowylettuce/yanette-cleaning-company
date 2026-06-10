'use client' // tells Next.js this component runs in the browser, not on the server

// dashboard/page.js — THE CALENDAR, the heartbeat of the whole app
// Desktop: a monthly grid; each day cell shows client names, addresses, and assigned workers.
// Mobile: defaults to a clean single-day "today" view.
// Clicking a day opens a side panel with full details for every house that day.
// HARD RULE: clients with fewer than 4 completed cleanings get a YELLOW background (new client).

import { useState, useEffect } from 'react'  // React tools for state and side effects
import { supabase } from '@/lib/supabase'    // our shared database connection
import { useUser } from '@/lib/useUser'      // who is logged in + their business + language

export default function CalendarPage() {
  // ─── STATE ───
  const today = new Date()                                            // today's real date, used as the starting point
  const [viewYear, setViewYear] = useState(today.getFullYear())       // viewYear is the year currently shown on the grid
  const [viewMonth, setViewMonth] = useState(today.getMonth())        // viewMonth is the month shown (0 = January, 11 = December)
  const [appointments, setAppointments] = useState([])                // appointments holds this month's bookings; starts empty
  const [selectedDate, setSelectedDate] = useState(null)              // selectedDate is the day the user clicked ('YYYY-MM-DD'), null = panel closed

  const { businessId, t, loading } = useUser() // businessId scopes every query; t gives translated text

  // ─── EFFECTS ───
  useEffect(() => {                            // runs after load AND every time the month or business changes
    if (businessId) {                          // only fetch once we know which business we are
      fetchAppointments()                      // go get this month's appointments from the database
    }
  }, [businessId, viewYear, viewMonth])        // re-run when any of these three values change

  // ─── FETCH ───
  async function fetchAppointments() {
    // build the first and last date of the month we're viewing, as 'YYYY-MM-DD' strings
    const firstDay = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`            // e.g. '2026-06-01'
    const lastDayNum = new Date(viewYear, viewMonth + 1, 0).getDate()                       // day 0 of NEXT month = last day of THIS month
    const lastDay = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}` // e.g. '2026-06-30'

    const { data, error } = await supabase     // send a request to Supabase; it gives back { data, error }
      .from('appointments')                    // look inside the appointments table
      .select('*, clients(name, address, cleaning_count), appointment_workers(workers(name))') // also pull the client info and assigned worker names through the joins
      .eq('business_id', businessId)           // filter: only this business's appointments
      .gte('date', firstDay)                   // filter: date is on or after the 1st of the month
      .lte('date', lastDay)                    // filter: date is on or before the last day of the month
      .neq('status', 'cancelled')              // hide cancelled appointments from the calendar
      .order('time', { ascending: true })      // sort by start time, earliest first

    if (error) {                                                  // if Supabase returned an error instead of data
      console.error('Failed to load appointments:', error)        // print it so we can debug
      return                                                      // exit early — do not use broken data
    }

    setAppointments(data || [])                // store the results (or an empty list if data was null)
  }

  // ─── HANDLERS ───
  function goToPrevMonth() {                   // runs when the user clicks the ← arrow
    if (viewMonth === 0) {                     // if we're on January
      setViewMonth(11)                         // wrap around to December...
      setViewYear(viewYear - 1)                // ...of the previous year
    } else {
      setViewMonth(viewMonth - 1)              // otherwise just go back one month
    }
    setSelectedDate(null)                      // close the side panel when changing months
  }

  function goToNextMonth() {                   // runs when the user clicks the → arrow
    if (viewMonth === 11) {                    // if we're on December
      setViewMonth(0)                          // wrap around to January...
      setViewYear(viewYear + 1)                // ...of the next year
    } else {
      setViewMonth(viewMonth + 1)              // otherwise just go forward one month
    }
    setSelectedDate(null)                      // close the side panel when changing months
  }

  // small helpers the render section uses ----------------------------------

  function dateString(dayNum) {                // turns a day number (1-31) into 'YYYY-MM-DD' for the month on screen
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
  }

  function appointmentsOn(dateStr) {                           // all appointments on one specific date
    return appointments.filter((apt) => apt.date === dateStr)  // keep only the ones whose date matches
  }

  function isNewClient(apt) {                                  // the yellow-highlight rule
    return (apt.clients?.cleaning_count ?? 0) < 4              // fewer than 4 completed cleanings = new client (?? 0 protects against a missing join)
  }

  function workerNames(apt) {                                                  // builds "Maria, Rosa" from the joined assignment rows
    return (apt.appointment_workers || [])                                     // the list of assignment rows (or empty list if none)
      .map((assignment) => assignment.workers?.name)                           // pull each worker's name through the join (?. protects against null)
      .filter(Boolean)                                                         // drop any empty/missing names
      .join(', ')                                                              // glue them together with commas
  }

  // build the grid cells: some blanks first (so day 1 lands on the right weekday), then the days
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()      // which weekday the month starts on (0 = Sunday)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()  // how many days this month has
  const cells = []                                                    // will hold null for blanks, then 1..daysInMonth
  for (let i = 0; i < firstWeekday; i++) cells.push(null)             // add the blank lead-in cells
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)                // add one cell per real day

  const todayStr = dateString(today.getDate())                                   // today's date as a string (only correct when viewing the current month)
  const viewingCurrentMonth = today.getFullYear() === viewYear && today.getMonth() === viewMonth // are we looking at the real current month?

  // ─── RENDER ───
  if (loading) return <p className="text-muted">{t.loading}</p> // show a loading message until we know who's logged in

  return (
    <div>

      {/* ── MONTH HEADER ── */}
      {/* month name + arrows to move between months */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {t.monthNames[viewMonth]} {viewYear} {/* e.g. "June 2026" or "Junio 2026" */}
        </h1>
        <div className="flex gap-2">
          <button onClick={goToPrevMonth} className="rounded-lg border border-line px-4 py-2 hover:bg-card">←</button>
          <button onClick={goToNextMonth} className="rounded-lg border border-line px-4 py-2 hover:bg-card">→</button>
        </div>
      </div>

      {/* legend explaining the yellow highlight */}
      <p className="mb-4 text-sm text-muted">
        <span className="mr-1 inline-block h-3 w-3 rounded bg-newclient"></span> {/* small yellow square */}
        {t.newClientLegend}
      </p>
      {/* ── END MONTH HEADER ── */}

      {/* ── MOBILE: TODAY VIEW ── */}
      {/* hidden on desktop (md:hidden); shows a simple scannable list of today's jobs */}
      <div className="md:hidden">
        <h2 className="mb-3 text-lg font-semibold">{t.today}</h2>
        {/* if there are no appointments today, say so instead of showing nothing */}
        {appointmentsOn(todayStr).length === 0 && viewingCurrentMonth && (
          <p className="text-muted">{t.noAppointments}</p>
        )}
        <div className="space-y-3">
          {viewingCurrentMonth && appointmentsOn(todayStr).map((apt) => (
            // one card per appointment; yellow if the client is new
            <div key={apt.id} className={`rounded-xl border border-line p-4 ${isNewClient(apt) ? 'bg-newclient' : 'bg-card'}`}>
              <p className="font-semibold">{apt.clients?.name}</p>
              <p className="text-sm text-muted">{apt.clients?.address}</p>
              <p className="text-sm">{apt.time} {workerNames(apt) && `· ${workerNames(apt)}`}</p> {/* only show the dot + names if workers are assigned */}
            </div>
          ))}
        </div>
      </div>
      {/* ── END MOBILE: TODAY VIEW ── */}

      {/* ── DESKTOP: MONTHLY GRID + SIDE PANEL ── */}
      {/* hidden on mobile (hidden md:flex); grid on the left, details panel on the right when a day is clicked */}
      <div className="hidden gap-4 md:flex">

        {/* the calendar grid itself */}
        <div className="flex-1">
          {/* weekday names across the top */}
          <div className="grid grid-cols-7 text-center text-sm font-semibold text-muted">
            {t.dayNames.map((day) => (
              <div key={day} className="py-2">{day}</div>
            ))}
          </div>

          {/* the day cells: 7 columns, one cell per day (plus blank lead-ins) */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((dayNum, index) => {
              if (dayNum === null) {                                  // blank lead-in cell before day 1
                return <div key={`blank-${index}`} />                  // render an empty box to keep the grid aligned
              }

              const dStr = dateString(dayNum)                         // this cell's date as 'YYYY-MM-DD'
              const dayAppointments = appointmentsOn(dStr)            // the appointments on this day
              const isToday = viewingCurrentMonth && dStr === todayStr // highlight today's cell with a green border

              return (
                // each day cell is clickable — clicking opens the side panel for that day
                <button
                  key={dStr}
                  onClick={() => setSelectedDate(dStr)}
                  className={`min-h-24 rounded-lg border p-1 text-left align-top hover:border-brand ${
                    isToday ? 'border-brand border-2' : 'border-line'
                  } ${selectedDate === dStr ? 'bg-card' : 'bg-white'}`}
                >
                  <span className="text-xs font-semibold text-muted">{dayNum}</span>
                  {/* one mini entry per appointment; yellow background if the client is new */}
                  {dayAppointments.map((apt) => (
                    <div key={apt.id} className={`mt-1 rounded px-1 py-0.5 text-xs ${isNewClient(apt) ? 'bg-newclient' : 'bg-card'}`}>
                      <p className="truncate font-medium">{apt.clients?.name}</p>
                      <p className="truncate text-muted">{apt.clients?.address}</p>
                      {/* only render the worker line if anyone is assigned */}
                      {workerNames(apt) && <p className="truncate text-accent">{workerNames(apt)}</p>}
                    </div>
                  ))}
                </button>
              )
            })}
          </div>
        </div>

        {/* the expanded side panel — only rendered when a day has been clicked */}
        {selectedDate && (
          <aside className="w-80 shrink-0 rounded-xl border border-line bg-card p-4">
            {/* panel header with a close button */}
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">{t.dayDetails} — {selectedDate}</h2>
              <button onClick={() => setSelectedDate(null)} className="text-muted hover:text-ink">✕</button>
            </div>

            {/* if the clicked day has no appointments, say so */}
            {appointmentsOn(selectedDate).length === 0 && (
              <p className="text-sm text-muted">{t.noAppointments}</p>
            )}

            {/* full details for each house on this day */}
            <div className="space-y-3">
              {appointmentsOn(selectedDate).map((apt) => (
                <div key={apt.id} className={`rounded-lg border border-line p-3 ${isNewClient(apt) ? 'bg-newclient' : 'bg-white'}`}>
                  <p className="font-semibold">{apt.clients?.name}</p>
                  {/* only show the "new client" tag when the yellow rule applies */}
                  {isNewClient(apt) && <p className="text-xs font-semibold">⭐ {t.newClient}</p>}
                  <p className="text-sm text-muted">{apt.clients?.address}</p>
                  <p className="mt-1 text-sm">{t.time}: {apt.time || t.none}</p> {/* fall back to "None" if no time set */}
                  <p className="text-sm">{t.assignedWorkers}: {workerNames(apt) || t.none}</p> {/* fall back to "None" if nobody assigned */}
                  {apt.notes && <p className="mt-1 text-sm italic text-muted">{apt.notes}</p>} {/* only show notes if there are any */}
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
      {/* ── END DESKTOP: MONTHLY GRID + SIDE PANEL ── */}

    </div>
  )
}
