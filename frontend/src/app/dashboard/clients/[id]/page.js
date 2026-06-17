'use client' // tells Next.js this component runs in the browser, not on the server

// dashboard/clients/[id]/page.js — view and edit ONE client's details
// The [id] folder name means the URL contains the client's id, e.g. /dashboard/clients/abc-123

import { useState, useEffect } from 'react'      // React tools for state and side effects
import { useParams, useRouter } from 'next/navigation' // useParams reads the id from the URL; useRouter lets us go back
import Link from 'next/link'                     // for the back link
import { supabase } from '@/lib/supabase'        // our shared database connection
import { useUser } from '@/lib/useUser'          // who is logged in + language

export default function ClientDetailPage() {
  // ─── STATE ───
  const [client, setClient] = useState(null)       // client holds this one client's data; null until loaded
  const [saveMsg, setSaveMsg] = useState('')       // saveMsg shows "Saved!" feedback after a successful save

  const { t, loading } = useUser()                 // translated text + loading flag
  const params = useParams()                       // gives us the pieces of the URL
  const clientId = params.id                       // the client id from the URL
  const router = useRouter()                       // lets us navigate back after deleting

  // ─── EFFECTS ───
  useEffect(() => {            // runs once when the page loads
    fetchClient()              // go get this client's data
  }, [])                       // empty array = only run once

  // ─── FETCH ───
  async function fetchClient() {
    const { data, error } = await supabase   // send a request to Supabase; it gives back { data, error }
      .from('clients')                       // look inside the clients table
      .select('*')                           // get every column
      .eq('id', clientId)                    // filter: only the row with this id

    if (error) {                                       // if Supabase returned an error
      console.error('Failed to load client:', error)   // print it so we can debug
      return                                           // exit early
    }

    setClient(data?.[0] || null)             // safely grab the first (only) result; null if not found
  }

  // ─── HANDLERS ───
  async function handleSave(e) {
    e.preventDefault()                       // stop the browser from reloading the page

    const { error } = await supabase
      .from('clients')                       // look inside the clients table
      .update({                              // change these columns...
        name: client.name,
        phone: client.phone,
        email: client.email,
        address: client.address,
        city: client.city,
        frequency: client.frequency,
        owner_notes: client.owner_notes,     // Yanette's private notes — never shown to the client
      })
      .eq('id', clientId)                    // ...only on this client's row

    if (error) {                                       // if the save failed
      console.error('Failed to save client:', error)   // print it so we can debug
      alert(t.errorGeneric)                            // tell the user
      return                                           // stop here
    }

    setSaveMsg(t.saved)                      // show the "Saved!" message
    setTimeout(() => setSaveMsg(''), 2000)   // hide it again after 2 seconds
  }

  async function handleDelete() {
    if (!confirm(t.confirmDelete)) return    // yes/no box; stop if the user cancels

    const { error } = await supabase
      .from('clients')                       // look inside the clients table
      .delete()                              // remove rows...
      .eq('id', clientId)                    // ...only this client's row

    if (error) {                                         // if the delete failed
      console.error('Failed to delete client:', error)   // print it so we can debug
      alert(t.errorGeneric)                              // tell the user
      return                                             // stop here
    }

    router.push('/dashboard/clients')        // go back to the client list
  }

  function setField(field, value) {                  // updates ONE field of the client object
    setClient({ ...client, [field]: value })         // copy everything else, replace just that field
  }

  // ─── RENDER ───
  if (loading || !client) return <p className="text-muted">{t.loading}</p> // wait for login check AND client data

  return (
    <div className="max-w-2xl">

      {/* ── PAGE HEADER ── */}
      <Link href="/dashboard/clients" className="text-sm text-accent hover:underline">← {t.back}</Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold">{t.clientDetails}</h1>
      {/* ── END PAGE HEADER ── */}

      {/* ── EDIT FORM ── */}
      <form onSubmit={handleSave} className="space-y-4 rounded-xl border border-line bg-card p-6">

        {/* each labeled input edits one field of the client */}
        <div>
          <label className="mb-1 block text-sm font-medium">{t.name}</label>
          <input value={client.name || ''} onChange={(e) => setField('name', e.target.value)} required className="w-full rounded-lg border border-line px-3 py-2" />
        </div>

        {/* phone and email side by side on wider screens */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">{t.phone}</label>
            <input value={client.phone || ''} onChange={(e) => setField('phone', e.target.value)} className="w-full rounded-lg border border-line px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t.email}</label>
            <input value={client.email || ''} onChange={(e) => setField('email', e.target.value)} className="w-full rounded-lg border border-line px-3 py-2" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">{t.address}</label>
            <input value={client.address || ''} onChange={(e) => setField('address', e.target.value)} className="w-full rounded-lg border border-line px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t.city}</label>
            <input value={client.city || ''} onChange={(e) => setField('city', e.target.value)} className="w-full rounded-lg border border-line px-3 py-2" />
          </div>
        </div>

        {/* how often this client gets cleaned */}
        <div>
          <label className="mb-1 block text-sm font-medium">{t.frequency}</label>
          <select value={client.frequency || 'biweekly'} onChange={(e) => setField('frequency', e.target.value)} className="w-full rounded-lg border border-line px-3 py-2">
            <option value="weekly">{t.weekly}</option>
            <option value="biweekly">{t.biweekly}</option>
            <option value="monthly">{t.monthly}</option>
            <option value="on-call">{t.onCall}</option>
          </select>
        </div>

        {/* read-only info: how many cleanings this client has completed (drives the yellow calendar rule) */}
        <p className="text-sm text-muted">{t.cleaningCount}: {client.cleaning_count}</p>

        {/* Yanette's PRIVATE notes — the client never sees this field */}
        <div>
          <label className="mb-1 block text-sm font-medium">{t.ownerNotes}</label>
          <textarea value={client.owner_notes || ''} onChange={(e) => setField('owner_notes', e.target.value)} rows={4} className="w-full rounded-lg border border-line px-3 py-2" />
        </div>

        {/* save button + delete button + the temporary "Saved!" message */}
        <div className="flex items-center gap-3">
          <button type="submit" className="rounded-lg bg-brand px-6 py-2 font-semibold text-white hover:bg-brand-dark">{t.save}</button>
          <button type="button" onClick={handleDelete} className="rounded-lg border border-line px-4 py-2 text-red-500 hover:border-red-400">{t.deleteClient}</button>
          {saveMsg && <span className="text-sm font-medium text-brand">{saveMsg}</span>} {/* only visible right after saving */}
        </div>
      </form>
      {/* ── END EDIT FORM ── */}

    </div>
  )
}
