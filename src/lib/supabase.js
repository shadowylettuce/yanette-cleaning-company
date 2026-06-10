// supabase.js — creates the ONE Supabase client the whole app shares
// Import it anywhere with:  import { supabase } from "@/lib/supabase"

import { createClient } from '@supabase/supabase-js' // the official Supabase library

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL           // your project's URL, read from .env.local
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY      // your public "anon" key, read from .env.local

// safety net: if .env.local still has the placeholder text (not a real https:// URL),
// use harmless dummy values so the app can still build and start instead of crashing.
// Every database call will fail until the real keys are pasted in — see SETUP_GUIDE.md Step 3.
const supabaseUrl = envUrl?.startsWith('http') ? envUrl : 'https://placeholder.supabase.co' // ?. protects if the variable is missing entirely
const supabaseAnonKey = envKey && !envKey.startsWith('PASTE') ? envKey : 'placeholder-anon-key' // use the real key only if it isn't the placeholder

// create and export the client — this object is how we talk to the database and auth
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
