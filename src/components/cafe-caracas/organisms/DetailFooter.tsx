import Link from 'next/link'
import React from 'react'

import { Brand } from '../molecules/Brand'

const LINKS = [
  { href: '/cafe-caracas', label: 'Explorar cafeterías' },
  { href: '/cafe-caracas', label: 'Guía de café' },
  { href: '/cafe-caracas', label: 'Acerca de' },
  { href: '/cafe-caracas', label: 'Contacto' },
] as const

/**
 * The detail page's footer: brand, four links, copyright.
 *
 * Distinct from `SiteFooter`, which is the single olive band the directory home
 * uses. The original ships two different footers and this is the larger one;
 * merging them behind a variant prop would hide that they are different
 * compositions, not two states of one.
 *
 * Three of the four links point back to the directory because the pages they
 * name do not exist yet. Marked here so they are not mistaken for finished.
 */
export const DetailFooter: React.FC = () => (
  <footer className="mt-12 border-t border-[rgb(51_38_31/0.1)] bg-cc-header px-12 py-10 max-[900px]:px-6">
    <div className="flex flex-col items-center gap-6 text-center">
      <Brand />

      <nav aria-label="Navegación del footer" className="flex flex-wrap justify-center gap-6">
        {LINKS.map((link) => (
          <Link
            className="text-[13px] font-medium text-cc-muted transition-colors duration-200 hover:text-cc-ink"
            href={link.href}
            key={link.label}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <p className="m-0 text-xs text-cc-muted-soft">
        © 2026 Caracas Café. Todos los derechos reservados.
      </p>
    </div>
  </footer>
)
