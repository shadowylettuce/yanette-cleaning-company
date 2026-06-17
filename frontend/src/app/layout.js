// layout.js — the root layout that wraps EVERY page in the app
// This is a server component (no 'use client') because it only sets up fonts and HTML structure.

import { Plus_Jakarta_Sans } from 'next/font/google' // import our brand font from Google Fonts
import './globals.css'                               // load the global styles on every page

// configure the font: which character sets and weights to download
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],                      // only download Latin characters (covers English + Spanish)
  weight: ['400', '500', '600', '700', '800'], // the font thicknesses we use across the app
})

// metadata controls the browser tab title and search engine description
export const metadata = {
  title: "Yanette's House Cleaning Company",
  description: 'Professional house cleaning in the Bay Area. Book a cleaning today!',
}

// RootLayout receives every page as `children` and wraps it in the HTML shell
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* apply our brand font to the entire app via the body tag */}
      <body className={jakarta.className}>{children}</body>
    </html>
  )
}
