'use client' // tells Next.js this component runs in the browser, not on the server

// dashboard/import/page.js — import Yanette's old Google Calendar into the app
//
// How it works, in three screens (steps):
//   1. "upload"  — she exports her Google Calendar as a .ics file and uploads it here
//   2. "review"  — every event is shown in a list; she matches each one to a client
//                  (or creates a new client, or skips it). NOTHING is saved yet.
//   3. "done"    — after she clicks Import, we save everything and show a summary.
//
// Only Yanette (the owner) uses this page — it lives in the owner dashboard.

import { useState, useEffect } from 'react'  // React tools for state and side effects
import Link from 'next/link'                 // for the "View Calendar" button at the end
import { supabase } from '@/lib/supabase'    // our shared database connection
import { useUser } from '@/lib/useUser'      // who is logged in + their business + language
import { parseIcs, expandEvent, suggestFrequency, toYmd } from '@/lib/ics' // our hand-written .ics file reader

// builds the default end of the import window: three months from today
function threeMonthsFromToday() {
  const d = new Date()                       // right now
  d.setMonth(d.getMonth() + 3)               // jump ahead 3 months (JavaScript handles year rollover for us)
  return toYmd(d)                            // as a 'YYYY-MM-DD' string
}

// cleans up a name for comparing: lowercase, trimmed, extra spaces squeezed out
// ("  Maria  Gonzalez " and "maria gonzalez" both become "maria gonzalez")
function normalize(s) {
  return (s || '').toLowerCase().trim().replace(/\s+/g, ' ')
}

export default function ImportPage() {
  // ─── STATE ───
  const [step, setStep] = useState('upload')                    // which screen we are on: 'upload' | 'review' | 'done'
  const [rangeStart, setRangeStart] = useState(toYmd(new Date())) // import window start — default today
  const [rangeEnd, setRangeEnd] = useState(threeMonthsFromToday()) // import window end — default 3 months out
  const [parseErrors, setParseErrors] = useState([])            // any problems the file reader hit (shown as warnings)
  const [uploadMessage, setUploadMessage] = useState('')        // friendly message on the upload screen (e.g. "no events found")
  const [clients, setClients] = useState([])                    // this business's existing clients, for the matching dropdowns
  const [groups, setGroups] = useState([])                      // one entry per event SERIES (see shape in handleFile below)
  const [importing, setImporting] = useState(false)             // true while the save is running — disables the button
  const [importError, setImportError] = useState('')            // shown if the save fails partway
  const [results, setResults] = useState(null)                  // the final counts shown on the done screen

  const { businessId, t, loading } = useUser()                  // businessId scopes every query; t gives translated text

  const today = toYmd(new Date())                               // today as 'YYYY-MM-DD', used to mark past dates

  // ─── EFFECTS ───
  useEffect(() => {                  // runs after load and whenever businessId becomes known
    if (businessId) fetchClients()   // load the client list once we know which business we are
  }, [businessId])                   // re-run if businessId changes

  // ─── FETCH ───
  async function fetchClients() {
    const { data, error } = await supabase
      .from('clients')                       // look inside the clients table
      .select('id, name, frequency')         // id (to link), name (to match/display), frequency (not used yet but cheap)
      .eq('business_id', businessId)         // only this business's clients
      .order('name', { ascending: true })    // alphabetical for the dropdowns

    if (error) {                                        // if the query failed
      console.error('Failed to load clients:', error)   // print it so we can debug
      return                                            // exit early
    }

    setClients(data || [])                   // store the results
  }

  // looks up which events were ALREADY imported before (so re-uploading the same file makes no duplicates)
  // returns a Set of "uid|date" strings — one for every previously imported appointment
  async function fetchAlreadyImported() {
    const { data, error } = await supabase
      .from('appointments')                            // look inside the appointments table
      .select('google_event_uid, date')                // we only need the Google id and the date
      .eq('business_id', businessId)                   // only this business
      .not('google_event_uid', 'is', null)             // only rows that came from a previous import

    if (error) {                                                  // if the query failed
      console.error('Failed to check for duplicates:', error)     // print it so we can debug
      return new Set()                                            // fall back to "nothing imported yet" — worst case is a visible duplicate she can cancel
    }

    return new Set((data || []).map((row) => `${row.google_event_uid}|${row.date}`)) // fast lookup set
  }

  // ─── HANDLERS ───

  // runs when Yanette picks a .ics file — reads it, expands repeats, matches clients, builds the review list
  async function handleFile(e) {
    const file = e.target.files?.[0]         // the file she picked (?. in case the picker was cancelled)
    if (!file) return                        // no file = nothing to do
    setUploadMessage('')                     // clear any old message

    let parsed                               // will hold { events, errors } from the parser
    try {
      const text = await file.text()         // read the whole file as plain text
      parsed = parseIcs(text)                // run our hand-written parser over it
    } catch (err) {                          // the file couldn't even be read as text
      console.error('Failed to read .ics file:', err)
      setUploadMessage(t.parseFailed)        // tell her in plain language
      return
    }

    if (parsed.events.length === 0) {        // a readable file, but with zero events in it
      setUploadMessage(t.parseFailed)
      return
    }
    setParseErrors(parsed.errors)            // keep any per-event warnings to show on the review screen

    // ── handle "modified occurrence" events ──
    // When ONE date of a repeating series is edited in Google (say one visit moved an hour),
    // the file holds a second copy of the event with the same UID plus a RECURRENCE-ID.
    // Rule: that date is removed from the normal series, and (unless cancelled) added back as a one-off.
    const overrides = parsed.events.filter((ev) => ev.recurrenceId)   // the modified single occurrences
    const baseEvents = parsed.events.filter((ev) => !ev.recurrenceId && !ev.cancelled) // the normal events (cancelled ones dropped)

    for (const override of overrides) {                               // for every modified occurrence
      const parent = baseEvents.find((ev) => ev.uid === override.uid) // find the series it belongs to
      if (parent) parent.exdates.push(override.recurrenceId)          // remove that date from the series' normal expansion
    }

    // ── expand every series into actual dates and build one review "group" per series ──
    const builtGroups = []                   // the review list we are building
    for (const ev of baseEvents) {           // one group per event series
      const occurrences = expandEvent(ev, rangeStart, rangeEnd) // all the dates this event happens on, inside the window

      // add back any modified occurrences that belong to this series (and weren't cancelled)
      for (const override of overrides) {
        if (override.uid === ev.uid && !override.cancelled                      // belongs here and still happening
            && override.start.date >= rangeStart && override.start.date <= rangeEnd) { // and inside the window
          occurrences.push({ date: override.start.date, time: override.start.time })   // its (possibly new) date and time
        }
      }
      occurrences.sort((a, b) => (a.date < b.date ? -1 : 1)) // show the dates in calendar order

      if (occurrences.length === 0) continue // nothing inside the window — leave this series out entirely

      // figure out the little "Repeats" badge text for this series
      const r = ev.rrule                     // shorthand for the repeat rule
      const recurrence =
        !r ? 'once'                                                 // no rule = happens one time
        : r.freq === 'WEEKLY' && r.interval === 1 ? 'weekly'        // every week
        : r.freq === 'WEEKLY' && r.interval === 2 ? 'biweekly'      // every other week
        : r.freq === 'MONTHLY' ? 'monthly'                          // monthly
        : 'custom'                                                  // anything we didn't fully unroll — flagged so she double-checks

      builtGroups.push({
        uid: ev.uid,                                       // Google's id — saved with each appointment for duplicate protection
        summary: ev.summary || '(no title)',               // the event title (usually the client's name)
        recurrence,                                        // the badge text decided above
        suggestedFrequency: suggestFrequency(ev.rrule),    // the frequency a NEW client would be created with
        notes: [ev.description, ev.location].filter(Boolean).join('\n'), // event details + address become the appointment notes
        action: 'new',                                     // who this maps to: a client id, 'new', or 'skip' — matched below
        price: '',                                         // Yanette types the price per series (Google doesn't know prices)
        rows: occurrences.map((occ) => ({                  // one row per actual date
          date: occ.date,
          time: occ.time,
          include: occ.date >= today,                      // past dates start unchecked (she can re-check them)
          isDuplicate: false,                              // filled in just below, after we ask the database
        })),
      })
    }

    if (builtGroups.length === 0) {          // the file had events, but none land inside the chosen window
      setUploadMessage(t.noEventsInRange)    // suggest widening the dates
      return
    }

    // ── pre-match each series to an existing client by name ──
    for (const group of builtGroups) {
      const title = normalize(group.summary)                            // the event title, cleaned up
      // best case: the title IS exactly a client's name
      const exact = clients.find((c) => normalize(c.name) === title)
      if (exact) {
        group.action = exact.id                                         // pre-link it
        continue
      }
      // next best: the title CONTAINS a client's name (or the other way around), e.g. "Clean - Maria Gonzalez"
      const partials = clients.filter((c) => {
        const cname = normalize(c.name)
        if (Math.min(cname.length, title.length) < 3) return false      // too short to trust (avoid matching "Jo" to everything)
        return title.includes(cname) || cname.includes(title)
      })
      if (partials.length === 1) group.action = partials[0].id          // exactly one candidate → safe to pre-link
      // zero or several candidates → leave action as 'new' and let Yanette decide in the dropdown
    }

    // ── mark dates that were already imported in a previous run ──
    const alreadyImported = await fetchAlreadyImported()                 // Set of "uid|date" keys
    for (const group of builtGroups) {
      for (const row of group.rows) {
        if (alreadyImported.has(`${group.uid}|${row.date}`)) {           // this exact event+date exists in the database
          row.isDuplicate = true                                         // gray it out on screen
          row.include = false                                            // and force it out of the import
        }
      }
    }

    setGroups(builtGroups)                   // hand the finished list to the review screen
    setStep('review')                        // and move to it
  }

  // updates ONE field of ONE group (e.g. its matched client or price) without touching the others
  function updateGroup(groupIndex, patch) {
    setGroups(groups.map((g, i) => (i === groupIndex ? { ...g, ...patch } : g))) // copy the list, replacing just that group
  }

  // checks/unchecks ONE date row inside a group
  function toggleRow(groupIndex, rowIndex) {
    setGroups(groups.map((g, i) => {
      if (i !== groupIndex) return g                                     // not this group — leave it alone
      return {
        ...g,
        rows: g.rows.map((row, j) =>
          j === rowIndex && !row.isDuplicate                             // duplicates can never be re-checked
            ? { ...row, include: !row.include }                          // flip the checkbox
            : row
        ),
      }
    }))
  }

  // checks (or unchecks) every non-duplicate date in every series at once
  function setAllIncluded(value) {
    setGroups(groups.map((g) => ({
      ...g,
      rows: g.rows.map((row) => (row.isDuplicate ? row : { ...row, include: value })), // duplicates stay excluded no matter what
    })))
  }

  // counts for the live summary line and the final import — computed fresh on every render
  const activeGroups = groups.filter((g) => g.action !== 'skip')          // series Yanette hasn't skipped
  const willImportCount = activeGroups.reduce(                            // how many appointment rows will be saved
    (sum, g) => sum + g.rows.filter((row) => row.include && !row.isDuplicate).length, 0)
  const newClientNames = [...new Set(                                     // unique new-client names (two series with the same title = one client)
    activeGroups
      .filter((g) => g.action === 'new' && g.rows.some((row) => row.include && !row.isDuplicate)) // only series that will actually import something
      .map((g) => normalize(g.summary))
  )]

  // runs when Yanette clicks "Import Selected" — THIS is the moment things are actually saved
  async function handleImport() {
    setImporting(true)                       // disable the button so it can't be double-clicked
    setImportError('')                       // clear any previous error

    // keep only the series and dates that are really going in
    const kept = activeGroups
      .map((g) => ({ ...g, rows: g.rows.filter((row) => row.include && !row.isDuplicate) })) // drop unchecked + duplicate dates
      .filter((g) => g.rows.length > 0)                                                      // drop series with nothing left

    // ── step 1: create the new clients first (we need their ids before we can save appointments) ──
    const nameToClientId = {}                // maps a normalized name → the client id to use for it
    for (const g of kept) {                  // existing matches already have their id in g.action
      if (g.action !== 'new') nameToClientId[normalize(g.summary)] = g.action
    }

    // build one clients row per UNIQUE new name (the Set above dedupes "Maria" appearing in two series)
    const newClientRows = []
    for (const g of kept) {
      const key = normalize(g.summary)
      if (g.action === 'new' && !nameToClientId[key] && !newClientRows.some((r) => normalize(r.name) === key)) {
        newClientRows.push({
          name: g.summary.trim(),                    // the event title becomes the client's name
          frequency: g.suggestedFrequency,           // guessed from how the event repeats (weekly/biweekly/monthly/on-call)
          business_id: businessId,                   // our business
        })
      }
    }

    let createdClientCount = 0               // for the done-screen summary
    if (newClientRows.length > 0) {          // only talk to the database if there is something to create
      const { data: createdClients, error } = await supabase
        .from('clients')                     // look inside the clients table
        .insert(newClientRows)               // add all the new clients at once
        .select()                            // give us back the inserted rows (so we can read their ids)

      if (error) {                                              // if creating clients failed
        console.error('Failed to create clients:', error)       // print it so we can debug
        setImportError(t.errorGeneric)                          // tell the user, visibly
        setImporting(false)                                     // re-enable the button
        return                                                  // stop — do NOT try to save appointments without client ids
      }

      for (const c of createdClients || []) {                   // remember each new client's id under their name
        nameToClientId[normalize(c.name)] = c.id
      }
      createdClientCount = createdClients?.length || 0          // count for the summary
    }

    // ── step 2: build every appointment row ──
    const aptRows = []
    for (const g of kept) {                  // every kept series...
      const clientId = nameToClientId[normalize(g.summary)]     // the client this series belongs to (existing or just created)
      if (!clientId) continue                                   // safety: if we somehow have no client, skip rather than crash
      for (const row of g.rows) {            // ...and every kept date in it
        aptRows.push({
          client_id: clientId,                       // whose home
          date: row.date,                            // the cleaning date
          time: row.time || null,                    // the start time (null for all-day events)
          price: Number(g.price) || 0,               // the price Yanette typed for this series (0 if blank)
          notes: g.notes || null,                    // the Google event's details + address
          business_id: businessId,                   // our business
          google_event_uid: g.uid,                   // remember where this came from — blocks duplicates on re-import
        })
      }
    }

    // ── step 3: save the appointments in batches of 100 (gentler than one giant insert) ──
    let savedCount = 0                       // how many made it in
    let failedCount = 0                      // how many did not
    for (let i = 0; i < aptRows.length; i += 100) {              // walk the rows 100 at a time
      const chunk = aptRows.slice(i, i + 100)                    // this batch
      const { error } = await supabase
        .from('appointments')                                    // look inside the appointments table
        .insert(chunk)                                           // add the whole batch at once

      if (error) {                                                          // if this batch failed
        console.error('Failed to import an appointment batch:', error)      // print it so we can debug
        failedCount += chunk.length                                         // count them as failed, but keep going with the rest
      } else {
        savedCount += chunk.length                                          // count the successes
      }
    }

    // ── step 4: show the results screen ──
    setResults({
      newClients: createdClientCount,        // how many clients were created
      newAppointments: savedCount,           // how many appointments were saved
      failed: failedCount,                   // how many could not be saved (0 if all went well)
    })
    setImporting(false)                      // done working
    setStep('done')                          // move to the summary screen
  }

  // resets everything so another file can be imported from scratch
  function resetWizard() {
    setGroups([])                            // forget the old review list
    setParseErrors([])                       // and its warnings
    setResults(null)                         // and the old results
    setUploadMessage('')                     // and any old message
    setStep('upload')                        // back to screen 1
  }

  // turns a recurrence code into its translated badge text
  function recurrenceLabel(code) {
    if (code === 'weekly') return t.weekly
    if (code === 'biweekly') return t.biweekly
    if (code === 'monthly') return t.monthly
    if (code === 'custom') return t.custom
    return t.once                            // default: a one-time event
  }

  // ─── RENDER ───
  if (loading) return <p className="text-muted">{t.loading}</p> // wait until we know who's logged in

  return (
    <div>

      {/* ── PAGE HEADER ── */}
      <h1 className="mb-6 text-2xl font-bold">{t.importTitle}</h1>
      {/* ── END PAGE HEADER ── */}

      {/* ── STEP 1: UPLOAD ── */}
      {step === 'upload' && (
        // the upload card: instructions, the date window, and the file picker
        <div className="max-w-2xl rounded-xl border border-line bg-card p-6">
          {/* plain-language instructions, including how to export from Google */}
          <p className="mb-6 text-muted">{t.importInstructions}</p>

          {/* the import window: only events between these two dates will be brought in */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium">{t.importFrom}</label>
            <input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} className="rounded-lg border border-line px-3 py-2" />
            <label className="text-sm font-medium">{t.importTo}</label>
            <input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className="rounded-lg border border-line px-3 py-2" />
          </div>

          {/* the file picker — the <label> is the green button; the real input hides inside it */}
          <label className="inline-block cursor-pointer rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark">
            {t.chooseFile}
            <input
              type="file"
              accept=".ics,text/calendar"           // only offer calendar files in the picker
              onChange={handleFile}                 // reading + parsing starts the moment a file is chosen
              className="hidden"                    // the browser's default file input is ugly — hide it, the label does the work
            />
          </label>

          {/* problem message, e.g. unreadable file or no events inside the window */}
          {uploadMessage && <p className="mt-4 text-sm text-red-500">{uploadMessage}</p>}
        </div>
      )}
      {/* ── END STEP 1: UPLOAD ── */}

      {/* ── STEP 2: REVIEW & MATCH ── */}
      {step === 'review' && (
        <div>

          {/* any events the parser could not read — shown as warnings, they don't block the import */}
          {parseErrors.length > 0 && (
            <div className="mb-4 rounded-lg border border-newclient bg-yellow-50 p-3 text-sm">
              {parseErrors.map((msg, i) => <p key={i}>{msg}</p>)}
            </div>
          )}

          {/* sticky summary bar: live counts + bulk buttons + the big import button */}
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-card p-4">
            {/* the live summary, e.g. "5 events found · 23 will be imported · 3 new clients will be created" */}
            <p className="text-sm text-muted">
              {groups.length} {t.eventsFound} · <span className="font-semibold text-ink">{willImportCount} {t.willImport}</span> · {newClientNames.length} {t.newClientsToCreate}
            </p>
            <div className="ml-auto flex gap-2"> {/* pushes the buttons to the right side */}
              <button onClick={() => setAllIncluded(true)} className="rounded-lg border border-line px-3 py-1 text-sm hover:border-brand">{t.selectAll}</button>
              <button onClick={() => setAllIncluded(false)} className="rounded-lg border border-line px-3 py-1 text-sm hover:border-brand">{t.deselectAll}</button>
              <button
                onClick={handleImport}
                disabled={importing || willImportCount === 0}  // can't import nothing, can't double-click while saving
                className="rounded-lg bg-brand px-4 py-1 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
              >
                {importing ? t.importingNow : t.confirmImport}
              </button>
            </div>
          </div>

          {/* shown if the save itself failed (e.g. lost connection) */}
          {importError && <p className="mb-4 text-sm text-red-500">{importError}</p>}

          {/* one card per event series */}
          <div className="space-y-3">
            {groups.map((group, gi) => (
              <div key={`${group.uid}-${gi}`} className="rounded-xl border border-line bg-card p-4">

                {/* top line of the card: title + repeat badge on the left, client dropdown + price on the right */}
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <p className="font-semibold">{group.summary}</p>
                  {/* the repeat badge: green for understood patterns, yellow for "custom" so it gets a second look */}
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    group.recurrence === 'custom' ? 'bg-newclient text-ink' : 'bg-brand text-white'
                  }`}>
                    {recurrenceLabel(group.recurrence)}
                  </span>

                  <div className="ml-auto flex flex-wrap items-center gap-2"> {/* right-hand controls */}
                    {/* who this series belongs to: an existing client, a brand-new one, or skip it entirely */}
                    <select
                      value={group.action}
                      onChange={(e) => updateGroup(gi, { action: e.target.value })}
                      className="rounded-lg border border-line px-3 py-2 text-sm"
                    >
                      <option value="new">{t.createNewClient}</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                      <option value="skip">{t.skipEvent}</option>
                    </select>
                    {/* the price for every visit in this series (Google Calendar doesn't store prices) */}
                    <input
                      type="number"
                      step="0.01"
                      value={group.price}
                      onChange={(e) => updateGroup(gi, { price: e.target.value })}
                      placeholder={`${t.price} ($)`}
                      className="w-28 rounded-lg border border-line px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                {/* the actual dates this series happens on — each one can be checked or unchecked */}
                {/* the whole card dims when the series is skipped */}
                <div className={`flex flex-wrap gap-2 ${group.action === 'skip' ? 'opacity-40' : ''}`}>
                  {group.rows.map((row, ri) => (
                    // one little chip per date: checkbox + date + time, gray when it's a duplicate
                    <label
                      key={`${row.date}-${ri}`}
                      className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-sm ${
                        row.isDuplicate ? 'border-line bg-page text-muted line-through'           // already imported — locked out
                        : row.include ? 'border-brand bg-white'                                   // going to be imported
                        : 'border-line bg-page text-muted'                                        // unchecked
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={row.include}                  // reflects this date's include flag
                        disabled={row.isDuplicate || group.action === 'skip'} // duplicates and skipped series can't be checked
                        onChange={() => toggleRow(gi, ri)}     // clicking flips it
                      />
                      {row.date}{row.time ? ` · ${row.time}` : ''} {/* only show the time if the event has one */}
                      {/* small tags so she knows WHY something looks different */}
                      {row.isDuplicate && <span className="text-xs">({t.alreadyImported})</span>}
                      {!row.isDuplicate && row.date < today && <span className="text-xs">({t.pastEvent})</span>}
                    </label>
                  ))}
                </div>

                {/* the event's details/address from Google — these become the appointment notes */}
                {group.notes && (
                  <p className="mt-2 truncate text-sm text-muted" title={group.notes}> {/* truncate keeps long notes to one line; hover shows everything */}
                    {t.notes}: {group.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* ── END STEP 2: REVIEW & MATCH ── */}

      {/* ── STEP 3: DONE ── */}
      {step === 'done' && results && (
        // the summary card: what was created, plus where to go next
        <div className="max-w-2xl rounded-xl border border-line bg-card p-6">
          <h2 className="mb-4 text-xl font-bold text-brand">{t.importDone}</h2>
          <p className="mb-1">{results.newClients} {t.clientsCreated}</p>
          <p className="mb-1">{results.newAppointments} {t.appointmentsCreated}</p>
          {/* only mention failures if there were any — no scary zero */}
          {results.failed > 0 && <p className="mb-1 text-red-500">{results.failed} {t.importFailedCount}</p>}

          <div className="mt-6 flex gap-3">
            {/* straight to the calendar to see the imported schedule */}
            <Link href="/dashboard" className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark">
              {t.viewCalendar}
            </Link>
            {/* or start over with another .ics file */}
            <button onClick={resetWizard} className="rounded-lg border border-line px-4 py-2 hover:border-brand">
              {t.importAnother}
            </button>
          </div>
        </div>
      )}
      {/* ── END STEP 3: DONE ── */}

    </div>
  )
}
