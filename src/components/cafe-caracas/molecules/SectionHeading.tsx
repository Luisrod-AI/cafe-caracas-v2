import React from 'react'

type Props = {
  title: string
  /** Rendered as the live result count on the right. */
  count: string
  id?: string
}

/**
 * The "Explora cafés en Caracas / 110 cafés" row.
 *
 * `aria-live="polite"` on the count is kept from the prototype: once filtering
 * works, the number changes without the page navigating, and that is precisely
 * the change a screen reader would otherwise miss.
 */
export const SectionHeading: React.FC<Props> = ({ count, id, title }) => (
  <div className="mb-3.5 flex min-h-14 items-center justify-between gap-6">
    <h2
      className="m-0 font-cc-display text-[43.2px] font-bold leading-none tracking-[-0.03em] text-cc-ink"
      id={id}
    >
      {title}
    </h2>

    <p aria-live="polite" className="m-0 shrink-0 text-[14.4px] font-semibold text-cc-brown">
      {count}
    </p>
  </div>
)
