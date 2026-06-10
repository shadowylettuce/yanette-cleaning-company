'use client' // tells Next.js this code runs in the browser, not on the server

// useUser.js — a custom React hook that every protected page uses to:
//   1. check who is logged in (and kick them to /login if nobody is)
//   2. load their profile row from the `users` table (role, language preference)
//   3. figure out their business_id
//   4. give every page the right translation object for their language
//
// Usage in a page:
//   const { user, profile, businessId, lang, setLang, t, loading } = useUser()

import { useState, useEffect } from 'react'          // React tools for state and side effects
import { useRouter } from 'next/navigation'           // lets us redirect the user to another page
import { supabase } from '@/lib/supabase'             // our shared database connection
import { translations } from '@/lib/translations'     // all UI text in English and Spanish

export function useUser() {
  // ─── STATE ───
  const [user, setUser] = useState(null)         // user holds the logged-in auth account (id, email); starts empty
  const [profile, setProfile] = useState(null)   // profile holds this user's row from our `users` table (role, language)
  const [businessId, setBusinessId] = useState(null) // businessId is which business this user belongs to
  const [lang, setLangState] = useState('en')    // lang is the current language ('en' or 'es'); default English
  const [loading, setLoading] = useState(true)   // loading is true until all the lookups below finish

  const router = useRouter() // gives us router.push() to send the user to another page

  // ─── EFFECTS ───
  useEffect(() => {     // runs once after the page first loads
    loadUser()          // kick off the chain of lookups below
  }, [])                // empty array = only run once, when the component first mounts

  // ─── FETCH ───
  async function loadUser() {
    // step 1: ask Supabase who is currently logged in
    const { data: authData } = await supabase.auth.getUser() // returns { data: { user } }
    const authUser = authData?.user                          // safely pull the user out (null if nobody is logged in)

    if (!authUser) {            // if nobody is logged in
      router.push('/login')     // send them to the login page
      return                    // stop here — nothing else to load
    }

    setUser(authUser) // remember the logged-in auth account in state

    // step 2: load this user's profile row from our `users` table
    const { data: profileData, error: profileError } = await supabase
      .from('users')             // look inside the users table
      .select('*')               // get every column (role, language_preference, business_id, ...)
      .eq('id', authUser.id)     // filter: only the row whose id matches the logged-in user's id

    if (profileError) {                                          // if the query failed
      console.error('Failed to load user profile:', profileError) // print the error so we can debug it
    }

    const userProfile = profileData?.[0]   // safely grab the first row; undefined if no profile exists
    setProfile(userProfile || null)        // store it in state (or null if missing)

    // step 3: remember their saved language preference, if they have one
    if (userProfile?.language_preference) {        // if the profile has a language saved
      setLangState(userProfile.language_preference) // use it as the current language
    }

    // step 4: figure out their business_id
    if (userProfile?.role === 'owner') {   // owners are linked through the businesses table
      // Query the businesses table to find the business owned by the currently logged-in user
      const { data: bizData } = await supabase
        .from('businesses')              // look in the businesses table
        .select('id')                    // we only need the id column, nothing else
        .eq('owner_id', authUser.id)     // filter: only rows where owner_id matches the logged-in user's id

      const ownerBizId = bizData?.[0]?.id  // safely grab the first result's id; undefined if nothing was found
      setBusinessId(ownerBizId || null)    // store it in state
    } else {                                              // everyone else (manager, cleaner, client)
      setBusinessId(userProfile?.business_id || null)     // their business_id is stored right on their users row
    }

    setLoading(false) // all lookups done — pages can render now
  }

  // ─── HANDLERS ───
  async function setLang(newLang) {   // called when the user taps the language toggle
    setLangState(newLang)             // update the language on screen immediately

    if (user) {                       // if someone is logged in, also save the choice to the database
      const { error } = await supabase
        .from('users')                          // look in the users table
        .update({ language_preference: newLang }) // change their saved language
        .eq('id', user.id)                      // only on their own row

      if (error) {                                              // if saving failed
        console.error('Failed to save language choice:', error)  // log it; the screen already switched so no harm done
      }
    }
  }

  async function logOut() {           // called when the user taps "Log Out"
    await supabase.auth.signOut()     // tell Supabase to end the session
    router.push('/login')             // send them back to the login page
  }

  const t = translations[lang]        // t is the set of UI strings for the current language

  // hand everything back to the page that called this hook
  return { user, profile, businessId, lang, setLang, t, loading, logOut }
}
