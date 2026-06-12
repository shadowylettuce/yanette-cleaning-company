'use client' // tells Next.js this component runs in the browser, not on the server

// dashboard/layout.js — the shared frame around EVERY owner dashboard page
// Next.js automatically wraps each page inside app/dashboard/ with this component.
// Desktop-first (Yanette mostly uses a computer): sidebar on the left, page content on the right.
// On mobile the sidebar becomes a scrollable bar across the top.

import Link from 'next/link'                  // Next.js link component for moving between pages
import { usePathname } from 'next/navigation' // tells us which page we are currently on (to highlight it)
import { useUser } from '@/lib/useUser'       // our hook: who is logged in, their language, log out

export default function DashboardLayout({ children }) { // children = whichever dashboard page is being shown
  // ─── STATE ───
  const { t, lang, setLang, logOut } = useUser() // pull language tools and logout from our shared hook
  const pathname = usePathname()                 // the current URL path, e.g. "/dashboard/clients"

  // the list of sidebar links — label comes from the translation object so it switches languages
  const navLinks = [
    { href: '/dashboard', label: t.calendar },
    { href: '/dashboard/clients', label: t.clients },
    { href: '/dashboard/workers', label: t.workers },
    { href: '/dashboard/appointments', label: t.appointments },
    { href: '/dashboard/revenue', label: t.revenue },
    { href: '/dashboard/payroll', label: t.payroll },
    { href: '/dashboard/payments', label: t.payments },
    { href: '/dashboard/reminders', label: t.reminders },
    { href: '/dashboard/import', label: t.importCalendar }, // brings Google Calendar events into the app
  ]

  // ─── HANDLERS ───
  function isActive(href) {                       // decides whether a nav link is the current page
    if (href === '/dashboard') return pathname === '/dashboard' // exact match only, or every link would light up
    return pathname.startsWith(href)              // sub-pages like /dashboard/clients/123 keep "Clients" highlighted
  }

  // ─── RENDER ───
  return (
    // on desktop (md and up): sidebar + content side by side; on mobile: stacked vertically
    <div className="flex min-h-screen flex-col bg-page md:flex-row">

      {/* ── SIDEBAR ── */}
      {/* fixed-width column on desktop; full-width top bar on mobile */}
      <aside className="border-b border-line bg-card md:min-h-screen md:w-56 md:border-b-0 md:border-r">
        {/* business name at the top of the sidebar */}
        <div className="px-4 py-4 text-lg font-bold text-brand">{t.companyName}</div>

        {/* nav links — horizontal scroll on mobile, vertical list on desktop */}
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:pb-0">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              // green highlight on the page we're currently on; gray hover on the rest
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                isActive(link.href) ? 'bg-brand text-white' : 'text-ink hover:bg-line'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* bottom controls: language toggle + log out */}
        <div className="flex gap-2 px-4 py-4 md:mt-auto">
          {/* flips the saved language between English and Spanish */}
          <button onClick={() => setLang(lang === 'en' ? 'es' : 'en')} className="rounded-lg border border-line px-3 py-1 text-sm text-muted hover:border-brand">
            {lang === 'en' ? 'ES' : 'EN'} {/* show the language you would switch TO */}
          </button>
          <button onClick={logOut} className="rounded-lg border border-line px-3 py-1 text-sm text-muted hover:border-red-400 hover:text-red-500">
            {t.logOut}
          </button>
        </div>
      </aside>
      {/* ── END SIDEBAR ── */}

      {/* ── PAGE CONTENT ── */}
      {/* whichever dashboard page is active renders here */}
      <main className="flex-1 p-4 md:p-8">{children}</main>
      {/* ── END PAGE CONTENT ── */}

    </div>
  )
}
