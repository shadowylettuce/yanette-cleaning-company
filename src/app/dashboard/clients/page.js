'use client' // tells Next.js this component runs in the browser, not on the server

// dashboard/clients/page.js — list all clients, add a new client, delete a client

import { useState, useEffect } from 'react'  // React tools for state and side effects
import Link from 'next/link'                 // for clicking through to a single client's page
import { supabase } from '@/lib/supabase'    // our shared database connection
import { useUser } from '@/lib/useUser'      // who is logged in + their business + language

export default function ClientsPage() {
  // ─── STATE ───
  const [clients, setClients] = useState([])         // clients holds the list of all clients; starts empty
  const [showForm, setShowForm] = useState(false)    // showForm controls whether the "add client" form is visible
  // newClient holds everything typed into the add form, in one object
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', address: '', city: '', frequency: 'biweekly' })

  const { businessId, t, loading } = useUser() // businessId scopes every query; t gives translated text

  // ─── EFFECTS ───
  useEffect(() => {              // runs after load and whenever businessId becomes known
    if (businessId) {            // only fetch once we know which business we are
      fetchClients()             // go get the client list from the database
    }
  }, [businessId])               // re-run if businessId changes

  // ─── FETCH ───
  async function fetchClients() {
    const { data, error } = await supabase   // send a request to Supabase; it gives back { data, error }
      .from('clients')                       // look inside the clients table
      .select('*')                           // get every column
      .eq('business_id', businessId)         // filter: only this business's clients
      .order('name', { ascending: true })    // sort alphabetically by name

    if (error) {                                         // if Supabase returned an error instead of data
      console.error('Failed to load clients:', error)    // print it so we can debug
      return                                             // exit early — do not use broken data
    }

    setClients(data || [])                   // store the results (or an empty list)
  }

  // ─── HANDLERS ───
  async function handleAddClient(e) {
    e.preventDefault()                       // stop the browser from reloading the page on form submit

    const { error } = await supabase
      .from('clients')                                   // look inside the clients table
      .insert([{ ...newClient, business_id: businessId }]) // add one new row: everything from the form + our business id

    if (error) {                                         // if the insert failed
      console.error('Failed to add client:', error)      // print it so we can debug
      alert(t.errorGeneric)                              // tell the user something went wrong
      return                                             // stop here
    }

    setNewClient({ name: '', phone: '', email: '', address: '', city: '', frequency: 'biweekly' }) // clear the form for next time
    setShowForm(false)                       // hide the form again
    fetchClients()                           // reload the list so the new client appears
  }

  async function handleDeleteClient(clientId) {
    if (!confirm(t.confirmDelete)) return    // pop a yes/no box; stop if the user clicks Cancel

    const { error } = await supabase
      .from('clients')                       // look inside the clients table
      .delete()                              // remove rows...
      .eq('id', clientId)                    // ...but only the one with this exact id

    if (error) {                                         // if the delete failed
      console.error('Failed to delete client:', error)   // print it so we can debug
      alert(t.errorGeneric)                              // tell the user something went wrong
      return                                             // stop here
    }

    fetchClients()                           // reload the list so the deleted client disappears
  }

  // ─── RENDER ───
  if (loading) return <p className="text-muted">{t.loading}</p> // wait until we know who's logged in

  return (
    <div>

      {/* ── PAGE HEADER ── */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.clients}</h1>
        {/* toggles the add-client form open and closed */}
        <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark">
          + {t.addClient}
        </button>
      </div>
      {/* ── END PAGE HEADER ── */}

      {/* ── ADD CLIENT FORM ── */}
      {/* only rendered while showForm is true */}
      {showForm && (
        <form onSubmit={handleAddClient} className="mb-6 grid gap-3 rounded-xl border border-line bg-card p-4 sm:grid-cols-2">
          {/* each input updates ONE field inside the newClient object, keeping the rest unchanged (...newClient) */}
          <input value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} placeholder={t.name} required className="rounded-lg border border-line px-3 py-2" />
          <input value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} placeholder={t.phone} className="rounded-lg border border-line px-3 py-2" />
          <input value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} placeholder={t.email} className="rounded-lg border border-line px-3 py-2" />
          <input value={newClient.address} onChange={(e) => setNewClient({ ...newClient, address: e.target.value })} placeholder={t.address} className="rounded-lg border border-line px-3 py-2" />
          <input value={newClient.city} onChange={(e) => setNewClient({ ...newClient, city: e.target.value })} placeholder={t.city} className="rounded-lg border border-line px-3 py-2" />
          {/* dropdown for how often this client gets cleaned */}
          <select value={newClient.frequency} onChange={(e) => setNewClient({ ...newClient, frequency: e.target.value })} className="rounded-lg border border-line px-3 py-2">
            <option value="weekly">{t.weekly}</option>
            <option value="biweekly">{t.biweekly}</option>
            <option value="monthly">{t.monthly}</option>
            <option value="on-call">{t.onCall}</option>
          </select>
          <button type="submit" className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark sm:col-span-2">
            {t.save}
          </button>
        </form>
      )}
      {/* ── END ADD CLIENT FORM ── */}

      {/* ── CLIENT LIST ── */}
      {/* friendly empty message when there are no clients yet */}
      {clients.length === 0 && <p className="text-muted">{t.noClients}</p>}

      <div className="space-y-2">
        {clients.map((client) => (
          // one row per client: info on the left, action buttons on the right
          <div key={client.id} className="flex items-center justify-between rounded-xl border border-line bg-card p-4">
            <div>
              <p className="font-semibold">{client.name}</p>
              <p className="text-sm text-muted">{client.address}{client.city && `, ${client.city}`}</p> {/* only add ", City" if a city was saved */}
              <p className="text-sm text-accent">{t[client.frequency === 'on-call' ? 'onCall' : client.frequency]} · {client.cleaning_count} {t.completedJobs}</p> {/* translate the frequency word + show the cleaning count */}
            </div>
            <div className="flex gap-2">
              {/* link to this client's full detail/edit page */}
              <Link href={`/dashboard/clients/${client.id}`} className="rounded-lg border border-line px-3 py-1 text-sm hover:border-brand">
                {t.edit}
              </Link>
              <button onClick={() => handleDeleteClient(client.id)} className="rounded-lg border border-line px-3 py-1 text-sm text-red-500 hover:border-red-400">
                {t.delete}
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* ── END CLIENT LIST ── */}

    </div>
  )
}
