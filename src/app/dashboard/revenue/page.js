'use client' // tells Next.js this component runs in the browser, not on the server

// dashboard/revenue/page.js — earnings overview: total, this month, and a simple monthly bar chart
// Revenue counts only COMPLETED appointments (the work was actually done).

import { useState, useEffect } from 'react'  // React tools for state and side effects
import { supabase } from '@/lib/supabase'    // our shared database connection
import { useUser } from '@/lib/useUser'      // who is logged in + their business + language

export default function RevenuePage() {
  // ─── STATE ───
  const [completedAppointments, setCompletedAppointments] = useState([]) // all completed jobs; starts empty

  const { businessId, t, loading } = useUser() // businessId scopes the query; t gives translated text

  // ─── EFFECTS ───
  useEffect(() => {              // runs after load and whenever businessId becomes known
    if (businessId) {            // only fetch once we know which business we are
      fetchCompleted()           // go get the completed appointments
    }
  }, [businessId])               // re-run if businessId changes

  // ─── FETCH ───
  async function fetchCompleted() {
    const { data, error } = await supabase   // send a request to Supabase; it gives back { data, error }
      .from('appointments')                  // look inside the appointments table
      .select('date, price')                 // we only need the date and the dollar amount
      .eq('business_id', businessId)         // filter: only this business
      .eq('status', 'completed')             // filter: only finished jobs count as revenue
      .order('date', { ascending: true })    // oldest first

    if (error) {                                        // if Supabase returned an error
      console.error('Failed to load revenue:', error)   // print it so we can debug
      return                                            // exit early
    }

    setCompletedAppointments(data || [])     // store the results (or an empty list)
  }

  // ─── HANDLERS ───
  // (no user actions on this page — it's a read-only overview)

  // math helpers the render section uses ------------------------------------

  // total earnings: add up every completed appointment's price
  const totalEarnings = completedAppointments.reduce((sum, apt) => sum + (Number(apt.price) || 0), 0) // reduce walks the list keeping a running sum

  // this month's earnings: same sum, but only for dates in the current month
  const now = new Date()                                                              // today's date
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` // e.g. '2026-06'
  const thisMonthEarnings = completedAppointments
    .filter((apt) => apt.date?.startsWith(thisMonthPrefix))                           // keep only this month's jobs (?. protects against a missing date)
    .reduce((sum, apt) => sum + (Number(apt.price) || 0), 0)                          // add up their prices

  // group earnings by month for the bar chart: { '2026-05': 1200, '2026-06': 950, ... }
  const monthlyTotals = {}                                       // empty object we'll fill below
  completedAppointments.forEach((apt) => {                       // walk every completed job
    const monthKey = apt.date?.slice(0, 7)                       // take 'YYYY-MM' from the date string
    if (!monthKey) return                                        // skip rows with no date
    monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + (Number(apt.price) || 0) // add this job's price to its month's total
  })
  const monthKeys = Object.keys(monthlyTotals).sort()            // the months in order, e.g. ['2026-05', '2026-06']
  const biggestMonth = Math.max(...Object.values(monthlyTotals), 1) // the largest monthly total (minimum 1 so we never divide by zero)

  // ─── RENDER ───
  if (loading) return <p className="text-muted">{t.loading}</p> // wait until we know who's logged in

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t.revenue}</h1>

      {/* ── SUMMARY CARDS ── */}
      {/* two big number cards: all-time total and this month */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-card p-6">
          <p className="text-sm text-muted">{t.totalEarnings}</p>
          <p className="text-3xl font-extrabold text-brand">${totalEarnings.toFixed(2)}</p> {/* toFixed(2) always shows cents */}
          <p className="text-sm text-muted">{completedAppointments.length} {t.completedJobs}</p>
        </div>
        <div className="rounded-xl border border-line bg-card p-6">
          <p className="text-sm text-muted">{t.thisMonth}</p>
          <p className="text-3xl font-extrabold text-accent">${thisMonthEarnings.toFixed(2)}</p>
        </div>
      </div>
      {/* ── END SUMMARY CARDS ── */}

      {/* ── MONTHLY BREAKDOWN ── */}
      <h2 className="mb-3 text-lg font-semibold">{t.monthlyBreakdown}</h2>
      <div className="space-y-2 rounded-xl border border-line bg-card p-6">
        {/* friendly message if there's no completed work yet */}
        {monthKeys.length === 0 && <p className="text-muted">{t.noAppointmentsList}</p>}

        {monthKeys.map((monthKey) => (
          // one horizontal bar per month, width proportional to that month's earnings
          <div key={monthKey} className="flex items-center gap-3">
            <span className="w-20 text-sm text-muted">{monthKey}</span>
            <div className="flex-1">
              {/* the green bar — its width is this month's share of the biggest month */}
              <div
                className="h-6 rounded bg-brand"
                style={{ width: `${(monthlyTotals[monthKey] / biggestMonth) * 100}%` }} // e.g. 75% as wide as the best month
              />
            </div>
            <span className="w-24 text-right text-sm font-semibold">${monthlyTotals[monthKey].toFixed(2)}</span>
          </div>
        ))}
      </div>
      {/* ── END MONTHLY BREAKDOWN ── */}

    </div>
  )
}
