import React from 'react'

type Props = {
  /** `null` when the source has no rating. */
  value: number | null
}

/**
 * The star and score beside a café name.
 *
 * An absent rating renders "N/A", never 0 — a café nobody has rated is not a
 * café everybody hated, and the grid sorts and reads very differently if those
 * two states collapse.
 *
 * The star is `aria-hidden` and the score is plain text, so a screen reader
 * announces "4.5" instead of "black star 4.5".
 */
export const Rating: React.FC<Props> = ({ value }) => (
  <span className="inline-flex shrink-0 items-center gap-[5px] text-xs font-semibold text-cc-ink-strong">
    <span aria-hidden="true" className="text-cc-olive">
      ★
    </span>
    {value === null ? 'N/A' : value.toFixed(1)}
  </span>
)
