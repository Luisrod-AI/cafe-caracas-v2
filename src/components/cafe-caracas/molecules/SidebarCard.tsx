import { cn } from '@/utilities/cn'

import { Eyebrow } from '../atoms/Eyebrow'
import React from 'react'

type Props = {
  eyebrow: string
  title: string
  children: React.ReactNode
  className?: string
}

/**
 * The translucent panel shared by both sidebar sections.
 *
 * The background is `white/72`, not a solid colour: it lets the cream page tint
 * through, which is what stops the panel reading as a white box pasted onto a
 * warm page.
 */
export const SidebarCard: React.FC<Props> = ({ children, className, eyebrow, title }) => (
  <section
    className={cn(
      'rounded-3xl border border-[rgb(91_70_54/0.14)] bg-white/72 p-5 shadow-cc-card',
      className,
    )}
  >
    <Eyebrow>{eyebrow}</Eyebrow>

    <h2 className="mt-1.5 font-cc-display text-[26px] font-bold leading-[1.1] text-cc-ink">
      {title}
    </h2>

    {children}
  </section>
)
