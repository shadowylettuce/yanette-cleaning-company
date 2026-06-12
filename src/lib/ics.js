// ics.js — reads a Google Calendar export file (.ics) and turns it into plain JavaScript objects
//
// An .ics file is just text. It looks like this:
//
//   BEGIN:VEVENT
//   UID:abc123@google.com
//   SUMMARY:Maria Gonzalez
//   DTSTART;TZID=America/Los_Angeles:20260615T093000
//   RRULE:FREQ=WEEKLY;INTERVAL=2
//   END:VEVENT
//
// This file has three jobs, each its own exported function:
//   1. parseIcs(text)        — read the raw file text and pull out every event
//   2. expandEvent(...)      — turn ONE repeating event into a list of actual dates
//   3. suggestFrequency(...) — guess a client's cleaning frequency from how the event repeats
//
// No libraries are used — every step is written out by hand so it can be read and understood.

// ─── SMALL DATE HELPERS ───

// turns a JavaScript Date object into a 'YYYY-MM-DD' string using LOCAL time
// (we never use toISOString() here — that converts to UTC and can shift the date by a day)
export function toYmd(d) {
  const year = d.getFullYear()                              // four-digit year, e.g. 2026
  const month = String(d.getMonth() + 1).padStart(2, '0')   // getMonth is 0-11, so add 1; pad "6" to "06"
  const day = String(d.getDate()).padStart(2, '0')          // day of the month, padded the same way
  return `${year}-${month}-${day}`                          // glue them together: "2026-06-15"
}

// turns a 'YYYY-MM-DD' string into a local-time Date object
// (we never use new Date('2026-06-15') — that parses as UTC midnight and can shift the date by a day)
export function ymdToDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)              // pull out the three numbers from the string
  return new Date(y, m - 1, d)                              // build the Date in LOCAL time (month is 0-11 again)
}

// ─── STEP 1 OF PARSING: UNFOLD LINES ───
// .ics files wrap long lines: a line that starts with a space or tab is actually
// the CONTINUATION of the line above it. This glues those pieces back together.
function unfoldLines(text) {
  const rawLines = text.split(/\r\n|\n|\r/)                 // split the file into lines (handles all newline styles)
  const lines = []                                          // the finished, glued-together lines go here
  for (const raw of rawLines) {                             // walk every raw line in order
    if (raw.startsWith(' ') || raw.startsWith('\t')) {      // starts with space/tab = continuation of the previous line
      if (lines.length > 0) {                               // safety check: there must BE a previous line
        lines[lines.length - 1] += raw.slice(1)             // glue it on, dropping the leading space/tab
      }
    } else if (raw !== '') {                                // a normal, non-empty line
      lines.push(raw)                                       // keep it as-is
    }
  }
  return lines
}

// ─── STEP 2 OF PARSING: SPLIT ONE LINE INTO ITS PARTS ───
// A line like  DTSTART;TZID=America/Los_Angeles:20260615T093000  has three parts:
//   name:   DTSTART
//   params: { TZID: 'America/Los_Angeles' }   (extra settings between ; and :)
//   value:  20260615T093000                    (everything after the first real :)
function parseLine(line) {
  let colonIndex = -1                                       // where the "real" colon (start of the value) is
  let inQuotes = false                                      // params can contain quoted text like CN="a:b" — ignore colons inside quotes
  for (let i = 0; i < line.length; i++) {                   // scan character by character
    const ch = line[i]                                      // the current character
    if (ch === '"') inQuotes = !inQuotes                    // a quote flips the "are we inside quotes" switch
    if (ch === ':' && !inQuotes) {                          // first colon OUTSIDE quotes = where the value begins
      colonIndex = i                                        // remember the spot
      break                                                 // stop scanning
    }
  }
  if (colonIndex === -1) return null                        // no colon at all = not a property line, skip it

  const head = line.slice(0, colonIndex)                    // everything before the colon: name + params
  const value = line.slice(colonIndex + 1)                  // everything after the colon: the value
  const headParts = head.split(';')                         // params are separated from the name by semicolons
  const name = headParts[0].toUpperCase()                   // the property name, e.g. DTSTART (uppercase to be safe)

  const params = {}                                         // collect the ;KEY=VAL pairs here
  for (const part of headParts.slice(1)) {                  // every piece after the name is one param
    const eq = part.indexOf('=')                            // params look like KEY=VALUE
    if (eq > -1) {                                          // only keep well-formed ones
      params[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1) // e.g. params.TZID = 'America/Los_Angeles'
    }
  }
  return { name, params, value }
}

// ─── TEXT UN-ESCAPING ───
// .ics escapes special characters in text: "\n" means a real line break, "\," a real comma, etc.
function unescapeText(s) {
  let out = ''                                              // build the cleaned-up string here
  for (let i = 0; i < s.length; i++) {                      // walk character by character
    if (s[i] === '\\' && i + 1 < s.length) {                // found a backslash with something after it
      const next = s[i + 1]                                 // peek at the escaped character
      if (next === 'n' || next === 'N') out += '\n'         // \n becomes a real line break
      else out += next                                      // \, \; \\ just become the character itself
      i++                                                   // skip past the character we just handled
    } else {
      out += s[i]                                           // a normal character — keep it
    }
  }
  return out
}

// ─── DATE/TIME PARSING ───
// DTSTART comes in four shapes; this turns any of them into { date: 'YYYY-MM-DD', time: 'HH:MM' or null, isAllDay }
//   1. All-day:        DTSTART;VALUE=DATE:20260615            → date only, no time
//   2. With timezone:  DTSTART;TZID=...:20260615T093000       → take the digits as written (Bay Area wall-clock time)
//   3. Floating:       DTSTART:20260615T093000                → same, take as written
//   4. UTC:            DTSTART:20260615T163000Z               → convert from UTC to California time
function parseDt(value, params) {
  const v = value.trim()                                    // remove any stray whitespace

  // shape 1: all-day events are just 8 digits — slice the pieces straight out of the string
  if ((params && params.VALUE === 'DATE') || /^\d{8}$/.test(v)) { // marked VALUE=DATE, or simply has no time part
    return {
      date: `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`, // "20260615" → "2026-06-15"
      time: null,                                           // all-day = no specific start time
      isAllDay: true,
    }
  }

  // shape 4: ends with Z = the time is in UTC and must be converted to California local time
  if (v.endsWith('Z')) {
    const utc = new Date(Date.UTC(                          // build the exact UTC moment
      Number(v.slice(0, 4)),                                // year
      Number(v.slice(4, 6)) - 1,                            // month (0-11 for Date.UTC)
      Number(v.slice(6, 8)),                                // day
      Number(v.slice(9, 11)),                               // hour (skipping the "T" at position 8)
      Number(v.slice(11, 13))                               // minute
    ))
    // Intl.DateTimeFormat can re-express that moment in any timezone — we ask for Los Angeles
    const formatter = new Intl.DateTimeFormat('en-CA', {    // 'en-CA' is just a locale choice; the parts below are what matter
      timeZone: 'America/Los_Angeles',                      // convert into California time
      year: 'numeric', month: '2-digit', day: '2-digit',    // we want every piece as 2-digit numbers
      hour: '2-digit', minute: '2-digit', hour12: false,    // 24-hour clock, no AM/PM
    })
    const parts = {}                                        // collect each formatted piece by name
    for (const p of formatter.formatToParts(utc)) parts[p.type] = p.value // e.g. parts.hour = '09'
    return {
      date: `${parts.year}-${parts.month}-${parts.day}`,    // assemble "2026-06-15"
      time: `${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}`, // assemble "09:30" (some browsers say "24" for midnight)
      isAllDay: false,
    }
  }

  // shapes 2 and 3: take the digits exactly as written — Yanette's events are already in local Bay Area time
  // (a TZID from a different timezone would be wrong here, but that can't happen for this calendar — accepted simplification)
  return {
    date: `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`, // pull the date digits out of the string
    time: `${v.slice(9, 11)}:${v.slice(11, 13)}`,           // pull the time digits out (after the "T")
    isAllDay: false,
  }
}

// ─── RRULE PARSING ───
// A repeat rule looks like: FREQ=WEEKLY;INTERVAL=2;BYDAY=TU;UNTIL=20261231T075959Z
// This turns it into a tidy object we can work with.
function parseRrule(value) {
  const rule = { freq: '', interval: 1, byday: [], until: null, count: null } // sensible defaults (interval 1 = every time)
  for (const piece of value.split(';')) {                   // rules are KEY=VALUE pairs separated by semicolons
    const eq = piece.indexOf('=')                           // find the = in each pair
    if (eq === -1) continue                                 // skip anything malformed
    const key = piece.slice(0, eq).toUpperCase()            // e.g. FREQ
    const val = piece.slice(eq + 1)                         // e.g. WEEKLY
    if (key === 'FREQ') rule.freq = val.toUpperCase()       // how it repeats: WEEKLY, MONTHLY, ...
    if (key === 'INTERVAL') rule.interval = Number(val) || 1 // every N weeks/months (2 = every other = biweekly)
    if (key === 'BYDAY') rule.byday = val.split(',')        // which weekdays, e.g. ['TU'] or ['2WE'] (2nd Wednesday)
    if (key === 'UNTIL') rule.until = parseDt(val, {}).date // last possible date — reuse our date parser, keep just the date
    if (key === 'COUNT') rule.count = Number(val) || null   // total number of times the event happens
  }
  return rule
}

// ─── MAIN PARSER ───
// Reads the whole .ics file text and returns { events: [...], errors: [...] }.
// One broken event becomes a message in `errors` — it never crashes the whole import.
export function parseIcs(icsText) {
  const events = []                                         // every successfully parsed event lands here
  const errors = []                                         // human-readable problems land here
  const lines = unfoldLines(icsText)                        // step 1: glue wrapped lines back together

  let current = null                                        // the property lines of the event we are currently inside (null = not inside one)
  let inAlarm = false                                       // are we inside a VALARM (reminder) block? those have their own DESCRIPTION we must ignore

  for (const line of lines) {                               // walk the file line by line
    if (line.startsWith('BEGIN:VEVENT')) {                  // an event starts here
      current = []                                          // start collecting its lines
      inAlarm = false                                       // reset the alarm flag for safety
    } else if (line.startsWith('END:VEVENT')) {             // the event ends here — turn the collected lines into an object
      if (current) {                                        // safety: only if we actually saw a BEGIN
        try {                                               // a single bad event should not kill the import
          const event = buildEvent(current)                 // convert the raw lines into our event shape
          if (event) events.push(event)                     // keep it (buildEvent returns null for events with no date)
        } catch (err) {                                     // something unexpected went wrong with THIS event only
          errors.push(`Could not read one event: ${err?.message || err}`) // record it and move on
        }
      }
      current = null                                        // we are no longer inside an event
    } else if (line.startsWith('BEGIN:VALARM')) {           // a reminder block inside the event starts
      inAlarm = true                                        // start ignoring lines
    } else if (line.startsWith('END:VALARM')) {             // the reminder block ends
      inAlarm = false                                       // stop ignoring lines
    } else if (current && !inAlarm) {                       // a normal line inside an event (and not inside a reminder)
      current.push(line)                                    // collect it for buildEvent
    }
    // lines outside any VEVENT (calendar headers, VTIMEZONE blocks) are simply ignored
  }

  return { events, errors }
}

// takes the raw property lines of ONE event and builds the tidy event object
function buildEvent(propertyLines) {
  // start with an empty event and fill it in as we recognize each line
  const event = {
    uid: '',                                                // Google's unique id for this event (used to avoid double-imports)
    summary: '',                                            // the event title — for Yanette this is usually the client's name
    description: '',                                        // the event's notes/details
    location: '',                                           // the address field in Google Calendar
    start: null,                                            // { date, time, isAllDay } — filled from DTSTART
    rrule: null,                                            // the repeat rule, or null if the event happens once
    exdates: [],                                            // dates that were deleted out of a repeating series
    recurrenceId: null,                                     // set when this VEVENT is a MODIFIED copy of one occurrence in a series
    cancelled: false,                                       // true if the event was cancelled in Google
  }

  for (const line of propertyLines) {                       // look at every property line of this event
    const prop = parseLine(line)                            // split it into { name, params, value }
    if (!prop) continue                                     // not a property line — skip

    if (prop.name === 'UID') event.uid = prop.value.trim()                       // remember the unique id
    if (prop.name === 'SUMMARY') event.summary = unescapeText(prop.value).trim() // title, with \, and \n cleaned up
    if (prop.name === 'DESCRIPTION') event.description = unescapeText(prop.value).trim() // notes, cleaned up the same way
    if (prop.name === 'LOCATION') event.location = unescapeText(prop.value).trim()       // address, cleaned up too
    if (prop.name === 'DTSTART') event.start = parseDt(prop.value, prop.params)  // when the event starts
    if (prop.name === 'RRULE') event.rrule = parseRrule(prop.value)              // how the event repeats
    if (prop.name === 'STATUS' && prop.value.trim().toUpperCase() === 'CANCELLED') event.cancelled = true // was it cancelled?
    if (prop.name === 'RECURRENCE-ID') event.recurrenceId = parseDt(prop.value, prop.params).date // which occurrence this overrides
    if (prop.name === 'EXDATE') {                           // EXDATE = "skip these dates"; can appear several times
      for (const piece of prop.value.split(',')) {          // and each line can hold several dates separated by commas
        event.exdates.push(parseDt(piece, prop.params).date) // keep just the date part of each one
      }
    }
  }

  if (!event.start) return null                             // an event with no start date is useless to us — drop it quietly
  return event
}

// ─── RECURRENCE EXPANSION ───
// Takes ONE event and returns the list of actual calendar dates it happens on,
// limited to the window [windowStart, windowEnd] (both 'YYYY-MM-DD' strings).
// Each entry looks like { date: 'YYYY-MM-DD', time: 'HH:MM' or null }.
export function expandEvent(event, windowStart, windowEnd) {
  const time = event.start.time                             // every occurrence of a series starts at the same time

  // ── case 1: the event does not repeat — it is one single date ──
  if (!event.rrule) {
    const d = event.start.date                              // the one and only date
    if (d >= windowStart && d <= windowEnd) return [{ date: d, time }] // inside the window → keep it
    return []                                               // outside the window → nothing
  }

  const rule = event.rrule                                  // shorthand for the repeat rule
  const occurrences = []                                    // the dates we generate land here
  const startDate = ymdToDate(event.start.date)             // the very first occurrence, as a Date object
  let generated = 0                                         // counts EVERY occurrence since the series began (needed for COUNT)
  const MAX = 500                                           // hard safety cap so a weird rule can never loop forever

  // small helper: decide whether one candidate date should be kept, and whether to keep generating at all.
  // returns false when the series is over (COUNT used up or UNTIL passed) so the caller can stop.
  function consider(dateObj) {
    const ymd = toYmd(dateObj)                              // the candidate as a 'YYYY-MM-DD' string
    if (ymd < event.start.date) return true                 // before the series even began — not a real occurrence, keep going
    generated++                                             // this IS a real occurrence — it uses up one of COUNT's slots
    if (rule.count && generated > rule.count) return false  // the series already happened all its times — stop
    if (rule.until && ymd > rule.until) return false        // past the rule's end date — stop
    if (ymd > windowEnd) return false                       // past the window we care about — stop
    if (ymd >= windowStart && !event.exdates.includes(ymd)) { // inside the window and not a deleted date
      occurrences.push({ date: ymd, time })                 // keep it!
    }
    return generated < MAX                                  // keep going unless we hit the safety cap
  }

  // maps .ics weekday codes to JavaScript's day numbers (Sunday = 0 ... Saturday = 6)
  const DAY_NUMBERS = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }

  // ── case 2: repeats weekly (every week, or every 2 weeks = biweekly, etc.) ──
  if (rule.freq === 'WEEKLY') {
    // which weekdays does it happen on? BYDAY says (e.g. ['TU']); if missing, use the start date's own weekday
    const weekdays = rule.byday.length > 0
      ? rule.byday.map((code) => DAY_NUMBERS[code.slice(-2)]).filter((n) => n !== undefined).sort() // last 2 chars = the day code
      : [startDate.getDay()]                                // no BYDAY → just the weekday the series started on

    // anchor the week-stepping on the START DATE's week — never on the window!
    // (if we stepped from the window start, an every-2-weeks rule could land on the WRONG alternating weeks)
    const weekAnchor = new Date(startDate)                  // copy so we don't modify startDate
    weekAnchor.setDate(weekAnchor.getDate() - weekAnchor.getDay()) // walk back to the Sunday that starts the first week

    let keepGoing = true                                    // flips to false when consider() says the series is over
    while (keepGoing) {                                     // one loop turn = one "active" week of the series
      for (const wd of weekdays) {                          // the event may happen on several weekdays in that week
        const candidate = new Date(weekAnchor)              // copy the week's Sunday
        candidate.setDate(candidate.getDate() + wd)         // move forward to the right weekday
        keepGoing = consider(candidate)                     // keep it / skip it / or learn the series is over
        if (!keepGoing) break                               // series over — stop checking this week's remaining days
      }
      weekAnchor.setDate(weekAnchor.getDate() + 7 * rule.interval) // jump ahead N weeks (N=2 makes it biweekly)
    }
    return occurrences
  }

  // ── case 3: repeats monthly ──
  if (rule.freq === 'MONTHLY') {
    // Google writes "2nd Wednesday of the month" as BYDAY=2WE (or "last Friday" as BYDAY=-1FR)
    const ordinalMatch = rule.byday.length > 0 ? rule.byday[0].match(/^(-?\d+)([A-Z]{2})$/) : null // split "2WE" into 2 and WE

    let keepGoing = true                                    // same stop-flag pattern as the weekly case
    let monthCursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1) // the 1st of the series' first month

    while (keepGoing) {                                     // one loop turn = one "active" month of the series
      const year = monthCursor.getFullYear()                // the month we are generating for
      const month = monthCursor.getMonth()

      if (ordinalMatch) {                                   // "nth weekday of the month" style
        const ordinal = Number(ordinalMatch[1])             // 2 means "2nd", -1 means "last"
        const weekday = DAY_NUMBERS[ordinalMatch[2]]        // which weekday (WE → 3)
        let candidate                                       // the computed date goes here
        if (ordinal > 0) {                                  // counting from the START of the month
          const firstOfMonth = new Date(year, month, 1)     // what weekday is the 1st?
          const offset = (weekday - firstOfMonth.getDay() + 7) % 7 // days from the 1st to the first matching weekday
          candidate = new Date(year, month, 1 + offset + (ordinal - 1) * 7) // then jump ahead (n-1) more weeks
        } else {                                            // counting from the END of the month (e.g. -1 = last)
          const lastOfMonth = new Date(year, month + 1, 0)  // day 0 of next month = last day of this month
          const offset = (lastOfMonth.getDay() - weekday + 7) % 7 // days back from the last day to the matching weekday
          candidate = new Date(year, month, lastOfMonth.getDate() - offset + (ordinal + 1) * 7) // then back (n-1) more weeks
        }
        if (candidate.getMonth() === month) {               // make sure the math didn't spill into another month
          keepGoing = consider(candidate)                   // keep it / skip it / or learn the series is over
        }
      } else {                                              // simple style: same day-of-month as the start date
        const candidate = new Date(year, month, startDate.getDate()) // e.g. always the 15th
        if (candidate.getMonth() === month) {               // skip months that don't have this day (no Feb 31st)
          keepGoing = consider(candidate)
        }
      }

      monthCursor.setMonth(monthCursor.getMonth() + rule.interval) // jump ahead N months
      if (toYmd(monthCursor) > windowEnd) keepGoing = false // the next month starts past the window — we are done
    }
    return occurrences
  }

  // ── case 4: a repeat style we don't expand (DAILY, YEARLY, ...) ──
  // we return just the first date so the event still shows up; the page marks it "custom"
  // so Yanette can see it repeats in a way the importer didn't unroll.
  const d = event.start.date
  if (d >= windowStart && d <= windowEnd) return [{ date: d, time }]
  return []
}

// ─── FREQUENCY SUGGESTION ───
// When the import creates a NEW client, we guess their cleaning frequency from the event's repeat rule.
// The returned values match the choices in the clients table: weekly | biweekly | monthly | on-call
export function suggestFrequency(rrule) {
  if (!rrule) return 'on-call'                              // doesn't repeat → a one-off / on-call client
  if (rrule.freq === 'WEEKLY' && rrule.interval === 1) return 'weekly'   // every single week
  if (rrule.freq === 'WEEKLY' && rrule.interval === 2) return 'biweekly' // every other week
  if (rrule.freq === 'MONTHLY') return 'monthly'            // once a month
  return 'biweekly'                                         // anything unusual → the app's default frequency
}
