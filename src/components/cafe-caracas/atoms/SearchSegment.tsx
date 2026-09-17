import React from 'react'

type Props = {
  label: string
  /** The current selection, or the prompt shown when nothing is selected. */
  value: string
}

/**
 * One third of the search bar — a bold label over a muted value.
 *
 * `items-start` rather than centred: the two lines are read as a stacked pair,
 * and centring them makes the three segments drift apart when their values have
 * different lengths.
 */
export const SearchSegment: React.FC<Props> = ({ label, value }) => (
  <button
    className="flex min-w-0 flex-col items-start justify-center gap-1 rounded-full px-3 text-left"
    type="button"
  >
    <strong className="text-xs font-bold text-cc-ink-strong">{label}</strong>
    <span className="max-w-full truncate text-xs text-cc-muted-soft">{value}</span>
  </button>
)
