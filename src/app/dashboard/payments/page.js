'use client' // tells Next.js this component runs in the browser, not on the server

// dashboard/payments/page.js — payment status per appointment
// Yanette marks payments as received and records how the client paid (Cash / Zelle / Venmo).
// NO credit card processing — that's a future version. We show a "coming soon" line instead.

import { useState, useEffect } from 'react'  // React tools for state and side effects
import { supabase } from '@/lib/supabase'    // our shared database connection
import { useUser } from '@/lib/useUser'      // who is logged in + their business + language

export default function PaymentsPage() {
  // ─── STATE ───
  const [payments, setPayments] = useState([]) // payments holds every payment row with its appointment info; starts empty

  const { businessId, t, loading } = useUser() // businessId scopes the query; t gives translated text

  // ─── EFFECTS ───
  useEffect(() => {              // runs after load and whenever businessId becomes known
    if (businessId) {            // only fetch once we know which business we are
      fetchPayments()            // go get the payment list
    }
  }, [businessId])               // re-run if businessId changes

  // ─── FETCH ───
  async function fetchPayments() {
    const { data, error } = await supabase   // send a request to Supabase; it gives back { data, error }
      .from('payments')                      // look inside the payments table
      .select('*, appointments(date, business_id, clients(name))') // also pull the appointment date and client name through the joins
      .order('created_at', { ascending: false }) // newest payments first

    if (error) {                                         // if Supabase returned an error
      console.error('Failed to load payments:', error)   // print it so we can debug
      return                                             // exit early
    }

    // payments have no business_id column, so keep only rows whose APPOINTMENT belongs to our business
    const ours = (data || []).filter((row) => row.appointments?.business_id === businessId) // ?. protects against a missing join
    setPayments(ours)                        // store the filtered results
  }

  // ─── HANDLERS ───
  async function handleMarkPaid(paymentId, method) {
    const { error } = await supabase
      .from('payments')                              // look inside the payments table
      .update({                                      // change these columns...
        paid: true,                                  // confirmed received
        paid_date: new Date().toISOString().slice(0, 10), // today as 'YYYY-MM-DD'
        method: method,                              // how the client paid (cash/zelle/venmo)
      })
      .eq('id', paymentId)                           // ...only on this payment's row

    if (error) {                                          // if the update failed
      console.error('Failed to mark as paid:', error)     // print it so we can debug
      alert(t.errorGeneric)                               // tell the user
      return                                              // stop here
    }

    fetchPayments()                          // reload so the badge flips to Paid
  }

  // ─── RENDER ───
  if (loading) return <p className="text-muted">{t.loading}</p> // wait until we know who's logged in

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t.payments}</h1>

      {/* ── PAYMENT METHODS INFO ── */}
      {/* the three accepted methods, each with instructions for clients */}
      <h2 className="mb-3 text-lg font-semibold">{t.paymentInstructions}</h2>
      <div className="mb-2 grid gap-4 sm:grid-cols-3">
        {[
          { icon: '💵', title: t.cash, desc: t.cashDesc },
          { icon: '🏦', title: t.zelle, desc: t.zelleDesc },
          { icon: '📱', title: t.venmo, desc: t.venmoDesc },
        ].map((methodInfo) => (
          <div key={methodInfo.title} className="rounded-xl border border-line bg-card p-4">
            <p className="text-2xl">{methodInfo.icon}</p>
            <p className="font-semibold">{methodInfo.title}</p>
            <p className="text-sm text-muted">{methodInfo.desc}</p>
          </div>
        ))}
      </div>
      {/* placeholder required by the spec — Stripe/cards come in a future version */}
      <p className="mb-8 text-sm italic text-muted">{t.cardComingSoon}</p>
      {/* ── END PAYMENT METHODS INFO ── */}

      {/* ── PAYMENT LIST ── */}
      {/* friendly empty message when there are no payments yet */}
      {payments.length === 0 && <p className="text-muted">{t.noAppointmentsList}</p>}

      <div className="space-y-2">
        {payments.map((payment) => (
          // one row per payment: who/when/how much on the left, status + actions on the right
          <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card p-4">
            <div>
              <p className="font-semibold">{payment.appointments?.clients?.name}</p> {/* double ?. — both joins could be missing */}
              <p className="text-sm text-muted">{payment.appointments?.date} · ${Number(payment.amount).toFixed(2)}</p>
              {/* if already paid, show when and how */}
              {payment.paid && (
                <p className="text-sm text-brand">{t.paid}: {payment.paid_date} · {payment.method && t[payment.method]}</p> // translate the method name if one was recorded
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* green badge when paid, yellow-ish when still owed */}
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${payment.paid ? 'bg-brand text-white' : 'bg-newclient text-ink'}`}>
                {payment.paid ? t.paid : t.unpaid}
              </span>
              {/* while unpaid: one button per method — clicking records BOTH "paid" and "how" in one tap */}
              {!payment.paid && (
                <div className="flex gap-1">
                  {['cash', 'zelle', 'venmo'].map((method) => (
                    <button
                      key={method}
                      onClick={() => handleMarkPaid(payment.id, method)} // mark paid with this method
                      className="rounded-lg border border-line px-3 py-1 text-xs hover:border-brand"
                    >
                      {t[method]} {/* translated method name on the button */}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* ── END PAYMENT LIST ── */}

    </div>
  )
}
