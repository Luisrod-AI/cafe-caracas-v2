import { cn } from '@/utilities/cn'
import React from 'react'

type Props = {
  children: React.ReactNode
  className?: string
}

/** The burgundy kicker above a sidebar heading — "AGENDA", "PRÓXIMAMENTE". */
export const Eyebrow: React.FC<Props> = ({ children, className }) => (
  <span
    className={cn(
      'inline-block text-[11.84px] font-semibold tracking-[0.2em] text-cc-burgundy',
      className,
    )}
  >
    {children}
  </span>
)
