import React from 'react'

type Props = {
  /** Café name, used to build an accessible label. */
  cafeName: string
}

/**
 * The heart on a card image.
 *
 * Inert on purpose: this page is a visual target, and a button that looks
 * interactive but stores nothing is worse than one that plainly does not yet.
 * It keeps its real `aria-label` so the markup does not have to change when the
 * behaviour arrives.
 *
 * It sits inside the card's link, so `stopPropagation` will be needed the day
 * it does something — noted here rather than added now, since an empty handler
 * is exactly the kind of code that gets copied without its reason.
 */
export const FavoriteButton: React.FC<Props> = ({ cafeName }) => (
  <button
    aria-label={`Guardar ${cafeName} en favoritos`}
    className="absolute right-3.5 top-3.5 grid h-[38px] w-[38px] place-items-center rounded-full border border-white/70 bg-[rgb(255_253_249_/_0.88)] text-[21px] leading-none text-cc-ink-strong backdrop-blur-[10px] transition-transform duration-200 hover:scale-105"
    type="button"
  >
    ♡
  </button>
)
