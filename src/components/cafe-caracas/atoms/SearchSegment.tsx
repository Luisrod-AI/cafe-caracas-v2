import React from 'react'

type Props = {
  label: string
  value: string
  isOpen?: boolean
  onClick?: () => void
}

export const SearchSegment: React.FC<Props> = ({
  label,
  value,
  isOpen = false,
  onClick,
}) => (
  <button
    aria-expanded={isOpen}
    className={`flex min-w-0 flex-1 flex-col items-start justify-center gap-1 rounded-full px-3 py-1.5 text-left transition-colors duration-150 ${
      isOpen
        ? 'bg-cc-olive/8'
        : 'hover:bg-black/[0.035]'
    }`}
    onClick={onClick}
    type="button"
  >
    <strong className="text-xs font-bold text-cc-ink-strong">
      {label}
    </strong>

    <span
      className={`max-w-full truncate text-xs transition-colors ${
        isOpen
          ? 'text-cc-ink-strong'
          : 'text-cc-muted-soft'
      }`}
    >
      {value}
    </span>
  </button>
)