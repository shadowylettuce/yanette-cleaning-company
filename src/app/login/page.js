'use client' // tells Next.js this component runs in the browser, not on the server

// login/page.js — the ONE login page for everyone (owner, manager, cleaner, client)
// After sign-in we look up the user's `role` in the users table and send them to the right portal.

import { useState } from 'react'                   // React tool for remembering values between renders
import { useRouter } from 'next/navigation'        // lets us redirect the user after login
import Link from 'next/link'                       // link back to the landing page
import { supabase } from '@/lib/supabase'          // our shared database connection
import { translations } from '@/lib/translations'  // all UI text in English and Spanish

export default function LoginPage() {
  // ─── STATE ───
  const [email, setEmail] = useState('')           // email holds what the user types in the email box
  const [password, setPassword] = useState('')     // password holds what the user types in the password box
  const [errorMsg, setErrorMsg] = useState('')     // errorMsg holds the error text to show (empty = no error)
  const [submitting, setSubmitting] = useState(false) // submitting is true while we wait for Supabase, so we can disable the button
  const [lang, setLang] = useState('en')           // language for this page (visitor isn't logged in yet, so default English)

  const router = useRouter()      // gives us router.push() to send the user to their portal
  const t = translations[lang]    // t holds all the text strings for the chosen language

  // ─── HANDLERS ───
  async function handleSignIn(e) {
    e.preventDefault()       // stop the browser from doing a full page reload when the form submits
    setErrorMsg('')          // clear any old error message
    setSubmitting(true)      // disable the button so the user can't double-click

    // step 1: ask Supabase Auth to check the email + password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,          // the email the user typed
      password: password,    // the password the user typed
    })

    if (authError) {               // if the email/password combo was wrong
      setErrorMsg(t.loginError)    // show a friendly error message
      setSubmitting(false)         // re-enable the button so they can try again
      return                       // stop here — do not try to redirect
    }

    // step 2: look up this user's role in OUR users table (auth only proves who they are)
    const { data: profileData, error: profileError } = await supabase
      .from('users')                       // look inside the users table
      .select('role')                      // we only need the role column
      .eq('id', authData?.user?.id)        // filter: the row whose id matches the just-logged-in user

    const role = profileData?.[0]?.role    // safely grab the role; undefined if no profile row exists

    if (profileError || !role) {           // if the lookup failed OR no role was found
      setErrorMsg(t.roleError)             // tell them their account isn't set up yet
      setSubmitting(false)                 // re-enable the button
      return                               // stop here
    }

    // step 3: send each role to its own home page
    if (role === 'owner') router.push('/dashboard')            // Yanette → full dashboard
    else if (role === 'manager') router.push('/portal/manager') // driver → manager portal
    else if (role === 'cleaner') router.push('/portal/cleaner') // cleaner → cleaner portal
    else router.push('/portal/client')                          // everyone else (clients) → client portal
  }

  function toggleLanguage() {                  // runs when the visitor taps the EN/ES button
    setLang(lang === 'en' ? 'es' : 'en')       // flip between English and Spanish
  }

  // ─── RENDER ───
  return (
    // full-screen centered layout with the soft card background
    <main className="flex min-h-screen items-center justify-center bg-card px-6">

      {/* ── LOGIN CARD ── */}
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-sm">

        {/* top row: back-home link on the left, language toggle on the right */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-accent hover:underline">← {t.companyName}</Link>
          <button onClick={toggleLanguage} className="rounded-full border border-line px-3 py-1 text-sm text-muted hover:border-brand">
            {lang === 'en' ? 'ES' : 'EN'} {/* show the language you would switch TO */}
          </button>
        </div>

        <h1 className="mt-6 text-2xl font-bold">{t.loginTitle}</h1>
        <p className="mt-1 text-sm text-muted">{t.loginSubtitle}</p>

        {/* the login form — onSubmit fires when the user presses Enter or clicks the button */}
        <form onSubmit={handleSignIn} className="mt-6 space-y-4">

          {/* email field */}
          <div>
            <label className="mb-1 block text-sm font-medium">{t.email}</label>
            <input
              type="email"                              // tells phones to show the @ keyboard
              value={email}                             // the box always shows what's in state
              onChange={(e) => setEmail(e.target.value)} // every keystroke updates state
              required                                  // browser blocks submitting while empty
              className="w-full rounded-lg border border-line px-4 py-2 outline-none focus:border-brand"
            />
          </div>

          {/* password field */}
          <div>
            <label className="mb-1 block text-sm font-medium">{t.password}</label>
            <input
              type="password"                              // hides the characters as dots
              value={password}                             // the box always shows what's in state
              onChange={(e) => setPassword(e.target.value)} // every keystroke updates state
              required                                     // browser blocks submitting while empty
              className="w-full rounded-lg border border-line px-4 py-2 outline-none focus:border-brand"
            />
          </div>

          {/* only show the red error box if errorMsg has text in it */}
          {errorMsg && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{errorMsg}</p>
          )}

          {/* submit button — disabled (and grayed out) while we wait for Supabase to answer */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {submitting ? t.signingIn : t.signIn} {/* button text changes while loading */}
          </button>
        </form>
      </div>
      {/* ── END LOGIN CARD ── */}

    </main>
  )
}
