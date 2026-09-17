import Image from 'next/image'
import React from 'react'

import type { MenuItem } from '@/modules/cafes'

import { Eyebrow } from '../atoms/Eyebrow'

type Props = {
  items: MenuItem[]
}

/** The prototype shows four dishes per page and paginates the rest. */
const PER_PAGE = 4

/**
 * The featured-menu block.
 *
 * Pagination is rendered but inert — the buttons show how many pages the menu
 * has and which one you are on, and clicking does nothing yet. Paging needs
 * client state, and this page is a server component; wiring it means splitting
 * out a `'use client'` island, which is a separate decision.
 *
 * Hiding the controls instead would be worse: a café with 40 dishes would look
 * like it has four.
 */
export const CafeMenu: React.FC<Props> = ({ items }) => {
  const pageCount = Math.ceil(items.length / PER_PAGE)
  const visible = items.slice(0, PER_PAGE)

  return (
    <div>
      <Eyebrow className="text-cc-olive-deep">MENÚ</Eyebrow>

      <h2 className="mt-1.5 font-cc-display text-[30px] font-bold leading-tight tracking-[-0.02em] text-cc-ink-strong">
        Menú destacado
      </h2>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-cc-muted">
          Este café aún no tiene menú publicado en Caracas Café.
        </p>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-4 gap-3 max-[900px]:grid-cols-2">
            {visible.map((item) => (
              <article
                className="overflow-hidden rounded-2xl border border-[rgb(51_38_31/0.1)] bg-cc-surface shadow-cc-pill"
                key={item.name}
              >
                <div className="relative aspect-square bg-[rgb(230_221_207/0.5)]">
                  {item.imageUrl ? (
                    <Image
                      alt={item.name}
                      className="h-full w-full object-cover"
                      fill
                      sizes="140px"
                      src={item.imageUrl}
                    />
                  ) : (
                    /* The original ships a placeholder JPG for this. A drawn
                       mark needs no request and cannot 404. */
                    <div
                      aria-hidden="true"
                      className="grid h-full w-full place-items-center text-center"
                    >
                      <span className="px-2 font-cc-display text-[11px] leading-tight text-[rgb(51_38_31/0.45)]">
                        Imagen próximamente
                      </span>
                    </div>
                  )}
                </div>

                <div className="px-3 py-3">
                  <strong className="block text-[13px] font-semibold leading-snug text-cc-ink-strong">
                    {item.name}
                  </strong>

                  {item.price ? (
                    <span className="mt-1 block text-[13px] text-cc-muted">{item.price}</span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          {pageCount > 1 ? (
            <nav
              aria-label="Páginas del menú"
              className="mt-5 flex items-center justify-center gap-2"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full border border-[rgb(51_38_31/0.12)] text-cc-muted opacity-40">
                ‹
              </span>

              {Array.from({ length: Math.min(pageCount, 5) }, (_, index) => (
                <span
                  aria-current={index === 0 ? 'page' : undefined}
                  className={
                    index === 0
                      ? 'grid h-9 w-9 place-items-center rounded-full bg-cc-olive text-[13px] font-semibold text-white'
                      : 'grid h-9 w-9 place-items-center rounded-full border border-[rgb(51_38_31/0.12)] bg-cc-surface text-[13px] font-semibold text-cc-muted-deep'
                  }
                  key={index}
                >
                  {index + 1}
                </span>
              ))}

              <span className="grid h-9 w-9 place-items-center rounded-full border border-[rgb(51_38_31/0.12)] bg-cc-surface text-cc-muted-deep">
                ›
              </span>
            </nav>
          ) : null}

          <button
            className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-cc-olive px-6 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
            type="button"
          >
            <span aria-hidden="true">▣</span>
            Ver menú completo
          </button>
        </>
      )}
    </div>
  )
}
