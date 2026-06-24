'use client' // tells Next.js this component runs in the browser, not on the server

// page.js — the PUBLIC landing page that markets Yanette's business to potential new clients
// Sections in order: Nav → Cinematic scroll-to-clean experience → Client Quotes

import { useState } from 'react'                   // React tool for remembering values between renders
import { translations } from '@/lib/translations'  // all UI text in English and Spanish
import CinematicLanding from '@/components/landing/CinematicLanding' // the animated scroll-to-clean kitchen experience
import QuotesSection from '@/components/landing/QuotesSection'       // real client testimonials shown below the animation

export default function LandingPage() {
  // ─── STATE ───
  const [lang, setLang] = useState('en') // lang is the current language for visitors; default English (no login yet, so not saved to the database)

  const t = translations[lang] // t holds all the text strings for the chosen language

  // ─── HANDLERS ───
  function toggleLanguage() {                    // runs when the visitor taps the EN/ES button
    setLang(lang === 'en' ? 'es' : 'en')         // if currently English switch to Spanish, and vice versa
  }

  // ─── RENDER ───
  return (
    <main className="min-h-screen bg-page text-ink">

      {/* ── NAV ── */}
      {/* sticky top bar: company name on the left, language toggle on the right (no login button — devs use /login directly) */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-line bg-white px-6 py-4">
        {/* company name acts as the logo until Yanette provides a logo file */}
        <span className="text-lg font-bold text-brand">{t.companyName}</span>
        {/* small button that flips the whole page between English and Spanish */}
        <button onClick={toggleLanguage} className="rounded-full border border-line px-3 py-1 text-sm text-muted hover:border-brand">
          {lang === 'en' ? 'ES' : 'EN'} {/* show the language you would SWITCH TO, not the current one */}
        </button>
      </nav>
      {/* ── END NAV ── */}

      {/* ── CINEMATIC SCROLL-TO-CLEAN EXPERIENCE ── */}
      {/* the whole landing story (Who We Are → How It Works → How to Pay → Reviews → Contact)
          now lives inside this one component, which handles the desktop scroll animation and
          the calm mobile / reduced-motion fallback. All copy still comes from translations. */}
      <CinematicLanding t={t} lang={lang} />
      {/* ── END CINEMATIC SCROLL-TO-CLEAN EXPERIENCE ── */}

      {/* ── CLIENT QUOTES ── */}
      {/* a dedicated, easy-to-read band of Yanette's real client reviews, in full */}
      <QuotesSection t={t} />
      {/* ── END CLIENT QUOTES ── */}

    </main>
  )
}
