'use client' // tells Next.js this component runs in the browser, not on the server

// page.js — the PUBLIC landing page that markets Yanette's business to potential new clients
// Sections in order: Nav → Hero → Services → How It Works → Why Choose Us → Testimonials → Contact

import { useState } from 'react'                   // React tool for remembering values between renders
import Link from 'next/link'                       // Next.js link component for moving between pages
import { translations } from '@/lib/translations'  // all UI text in English and Spanish

export default function LandingPage() {
  // ─── STATE ───
  const [lang, setLang] = useState('en') // lang is the current language for visitors; default English (no login yet, so not saved to the database)

  const t = translations[lang] // t holds all the text strings for the chosen language

  // ─── HANDLERS ───
  function toggleLanguage() {                    // runs when the visitor taps the EN/ES button
    setLang(lang === 'en' ? 'es' : 'en')         // if currently English switch to Spanish, and vice versa
  }

  const reviews = t.testimonialsList // all 10 client quotes for the current language
  const marqueeReviews = [...reviews, ...reviews] // duplicate the list so the CSS loop has no visible jump

  // ─── RENDER ───
  return (
    <main className="min-h-screen bg-page text-ink">

      {/* ── NAV ── */}
      {/* sticky top bar: company name on the left, language toggle + login on the right */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-line bg-white px-6 py-4">
        {/* company name acts as the logo until Yanette provides a logo file */}
        <span className="text-lg font-bold text-brand">{t.companyName}</span>
        <div className="flex items-center gap-3">
          {/* small button that flips the whole page between English and Spanish */}
          <button onClick={toggleLanguage} className="rounded-full border border-line px-3 py-1 text-sm text-muted hover:border-brand">
            {lang === 'en' ? 'ES' : 'EN'} {/* show the language you would SWITCH TO, not the current one */}
          </button>
          {/* Log In button — visible on every section because the nav is sticky */}
          <Link href="/login" className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            {t.logIn}
          </Link>
        </div>
      </nav>
      {/* ── END NAV ── */}

      {/* ── HERO ── */}
      {/* big welcoming banner with the company name, tagline, and main call-to-action */}
      <section className="bg-card px-6 py-24 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold sm:text-5xl">{t.companyName}</h1>
        {/* tagline — placeholder until Yanette confirms hers (see open questions) */}
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">{t.tagline}</p>
        {/* main call-to-action: jumps down to the contact section */}
        <a href="#contact" className="mt-8 inline-block rounded-full bg-brand px-8 py-3 text-lg font-semibold text-white hover:bg-brand-dark">
          {t.bookCleaning}
        </a>
      </section>
      {/* ── END HERO ── */}

      {/* ── SERVICES ── */}
      <section className="px-6 py-20">
        <h2 className="text-center text-3xl font-bold">{t.servicesTitle}</h2>
        {/* three service cards side by side on desktop, stacked on mobile */}
        <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-3">
          {/* build the three cards from a small list so we don't repeat the same JSX three times */}
          {[
            { icon: '🧹', title: t.serviceStandard, desc: t.serviceStandardDesc },
            { icon: '✨', title: t.serviceDeep, desc: t.serviceDeepDesc },
            { icon: '📦', title: t.serviceMove, desc: t.serviceMoveDesc },
          ].map((service) => (
            // one card per service; key tells React which card is which
            <div key={service.title} className="rounded-2xl border border-line bg-card p-6 text-center">
              <div className="text-4xl">{service.icon}</div>
              <h3 className="mt-3 text-xl font-semibold">{service.title}</h3>
              <p className="mt-2 text-sm text-muted">{service.desc}</p>
            </div>
          ))}
        </div>
      </section>
      {/* ── END SERVICES ── */}

      {/* ── HOW IT WORKS ── */}
      <section className="bg-card px-6 py-20">
        <h2 className="text-center text-3xl font-bold">{t.howItWorksTitle}</h2>
        {/* 3-step flow: Book Online → We Show Up → You Enjoy a Clean Home */}
        <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-3">
          {[
            { num: '1', title: t.step1Title, desc: t.step1Desc },
            { num: '2', title: t.step2Title, desc: t.step2Desc },
            { num: '3', title: t.step3Title, desc: t.step3Desc },
          ].map((step) => (
            <div key={step.num} className="text-center">
              {/* green numbered circle for each step */}
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand text-xl font-bold text-white">
                {step.num}
              </div>
              <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>
      {/* ── END HOW IT WORKS ── */}

      {/* ── WHY CHOOSE US ── */}
      <section className="px-6 py-20">
        <h2 className="text-center text-3xl font-bold">{t.whyUsTitle}</h2>
        {/* trust signals: experience, happy clients, insured & bonded */}
        <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-3">
          {[
            { icon: '🏆', title: t.whyYears, desc: t.whyYearsDesc },
            { icon: '🏡', title: t.whyClients, desc: t.whyClientsDesc },
            { icon: '🛡️', title: t.whyInsured, desc: t.whyInsuredDesc },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-line bg-card p-6 text-center">
              <div className="text-4xl">{item.icon}</div>
              <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
      {/* ── END WHY CHOOSE US ── */}

      {/* ── TESTIMONIALS ── */}
      <section className="bg-card px-6 py-20">
        <h2 className="text-center text-3xl font-bold">{t.testimonialsTitle}</h2>
        {/* overflow-hidden viewport clips the scrolling row; hover pauses via CSS in globals.css */}
        <div className="marquee-viewport mx-auto mt-10 max-w-6xl overflow-hidden">
          {/* flex row of cards — duplicated list animates left in an infinite loop */}
          <div className="marquee-track flex w-max gap-6">
            {marqueeReviews.map((review, index) => (
              // index in key keeps duplicate copies unique; same quote can appear twice in the loop
              <div
                key={`${review.name}-${index}`}
                className="w-[280px] shrink-0 rounded-2xl border border-line bg-white p-6 sm:w-[320px]"
              >
                <div className="text-accent">★★★★★</div>
                <p className="mt-3 italic">&ldquo;{review.quote}&rdquo;</p>
                <p className="mt-3 text-sm font-semibold text-muted">{review.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ── END TESTIMONIALS ── */}

      {/* ── CONTACT / BOOK ── */}
      {/* id="contact" lets the hero's "Book a Cleaning" button scroll down to here */}
      <section id="contact" className="px-6 py-20 text-center">
        <h2 className="text-3xl font-bold">{t.contactTitle}</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">{t.contactDesc}</p>
        {/* contact details — placeholder phone/email until Yanette confirms hers */}
        <div className="mt-8 space-y-2 text-lg">
          <p>📞 (555) 555-5555</p>
          <p>✉️ hello@yanettescleaning.com</p>
          <p className="text-sm text-muted">{t.serviceArea}</p>
        </div>
        {/* repeat the call-to-action so visitors at the bottom don't have to scroll up */}
        <a href="#contact" className="mt-8 inline-block rounded-full bg-brand px-8 py-3 text-lg font-semibold text-white hover:bg-brand-dark">
          {t.bookCleaning}
        </a>
      </section>
      {/* ── END CONTACT / BOOK ── */}

    </main>
  )
}
