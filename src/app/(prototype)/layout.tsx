import { Inter, Playfair_Display } from 'next/font/google'
import type { ReactNode } from 'react'
import React from 'react'

import '../(app)/globals.css'

/**
 * A root layout of its own, separate from the storefront's.
 *
 * The `(app)` group wraps everything in the store's `Header`, `Footer` and a
 * `<main>`. This page brings its own header and footer, so rendering it inside
 * that group stacks two of each. A route group with its own root layout gives
 * the prototype a clean document while keeping the URL at `/cafe-caracas`.
 *
 * It is also the right shape for what comes next: when this becomes a
 * CMS-driven site it will still want its own chrome, not the store's.
 */

/**
 * The prototype's two typefaces.
 *
 * Loaded through `next/font/google` rather than the `<link>` the original uses:
 * the files are self-hosted from our own origin, which removes a
 * render-blocking request to a third party and the layout shift it causes. Same
 * families, same weights.
 */
const inter = Inter({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-cc-inter',
  weight: ['400', '500', '600', '700'],
})

const playfair = Playfair_Display({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-cc-playfair',
  weight: ['600', '700'],
})

export default function PrototypeLayout({ children }: { children: ReactNode }) {
  return (
    /**
     * `data-theme` is not decoration — without it the page renders invisibly.
     *
     * globals.css sets `html { opacity: 0 }` and only restores it for
     * `html[data-theme='light']` or `[data-theme='dark']`. It is the storefront's
     * anti-flash trick: the document stays hidden until `InitTheme` has read the
     * user's preference and stamped the attribute, so nobody sees a light page
     * repaint to dark.
     *
     * That script lives in the `(app)` layout. This route group does not use it
     * — the prototype has one fixed palette — so the attribute is set
     * statically. Omitting it produces a fully rendered, fully styled, entirely
     * invisible page: correct DOM, correct computed styles, blank screen, and
     * not a single console error to point at it.
     */
    <html className={`${inter.variable} ${playfair.variable}`} data-theme="light" lang="es">
      <body className="bg-cc-page font-cc-sans text-cc-ink antialiased">{children}</body>
    </html>
  )
}
