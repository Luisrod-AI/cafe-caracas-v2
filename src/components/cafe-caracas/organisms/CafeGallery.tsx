import Image from 'next/image'
import React from 'react'

type Props = {
  name: string
  imageUrl: string | null
}

const FILTER = 'saturate(0.82) contrast(1.04) brightness(0.98) sepia(0.08)'

/** One tile of the mosaic. `priority` only on the large one, which is LCP. */
const Tile: React.FC<{
  alt: string
  className?: string
  priority?: boolean
  sizes: string
  src: string | null
}> = ({ alt, className = '', priority = false, sizes, src }) => (
  <div className={`relative overflow-hidden bg-[rgb(230_221_207/0.72)] ${className}`}>
    {src ? (
      <Image
        alt={alt}
        className="h-full w-full object-cover"
        fill
        priority={priority}
        sizes={sizes}
        src={src}
        style={{ filter: FILTER }}
      />
    ) : (
      <div
        aria-hidden="true"
        className="grid h-full w-full place-items-center bg-gradient-to-br from-[#e9e2d7] via-[#d9d2c3] to-[#7b8060]"
      >
        <span className="font-cc-display text-lg text-[rgb(51_38_31/0.72)]">Caracas Café</span>
      </div>
    )}
  </div>
)

/**
 * The four-tile photo mosaic: one large on the left, two stacked on the right,
 * one wide underneath them.
 *
 * All four show the SAME photo, because that is what the original does — every
 * café in the dataset has exactly one image, and the prototype repeats it to
 * fill the grid. Rendering a single wide photo instead would be a different
 * layout, not a faithful copy.
 *
 * The `overflow-hidden` and radius live on the container, not on each tile, so
 * the four pieces read as one rounded block with hairline seams rather than as
 * four separate rounded cards.
 */
export const CafeGallery: React.FC<Props> = ({ imageUrl, name }) => (
  <div className="grid h-[460px] grid-cols-[1.15fr_1fr] gap-2 overflow-hidden rounded-[22px] max-[900px]:h-[300px] max-[900px]:grid-cols-1">
    <Tile
      alt={`${name} — foto principal`}
      priority
      sizes="(max-width: 900px) 100vw, 573px"
      src={imageUrl}
    />

    <div className="grid grid-rows-2 gap-2 max-[900px]:hidden">
      <div className="grid grid-cols-2 gap-2">
        <Tile alt={`${name} — foto 2`} sizes="245px" src={imageUrl} />
        <Tile alt={`${name} — foto 3`} sizes="245px" src={imageUrl} />
      </div>

      <div className="relative">
        <Tile alt={`${name} — foto 4`} className="h-full" sizes="499px" src={imageUrl} />

        <button
          className="absolute bottom-4 right-4 inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-black/15 bg-white px-[15px] py-[10px] text-[14px] font-semibold text-neutral-900 shadow-[0_3px_12px_rgb(0_0_0/0.12)] transition-transform duration-200 hover:scale-[1.02]"
          type="button"
        >
          <span aria-hidden="true">▦</span>
          Ver todas las fotos
        </button>
      </div>
    </div>
  </div>
)
