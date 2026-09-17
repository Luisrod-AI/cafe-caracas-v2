import { cn } from '@/utilities/cn'
import React from 'react'

type Props = {
  children: React.ReactNode
  className?: string
}

/**
 * The small olive tag under a café name — "Cafetería", "rooftop".
 *
 * `min-h-6` alongside the vertical padding is not redundant: the label is 10px
 * and the chips sit in a wrapping row, so without a floor a one-word chip is
 * visibly shorter than its neighbours.
 */
export const Chip: React.FC<Props> = ({ children, className }) => (
  <span
    className={cn(
      'inline-flex min-h-[23px] items-center rounded-full border border-[rgb(100_106_69/0.16)] bg-[rgb(100_106_69/0.08)] px-2 py-1 text-[10px] font-semibold leading-none text-cc-olive-ink',
      className,
    )}
  >
    {children}
  </span>
)
