import type { ProductListItem } from '@/modules/catalog'

import clsx from 'clsx'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { Price } from '@/components/Price'

type Props = {
  product: ProductListItem
}

/**
 * A cell in the shop grid.
 *
 * Takes a domain entity, not a CMS document. That is what lets it render
 * without knowing whether the data arrived through the Local API or REST, and
 * why the "which price do we show" decision is not repeated here — the mapper
 * already resolved it.
 */
export const ProductGridItem: React.FC<Props> = ({ product }) => {
  const { image, priceInUSD, slug, title } = product

  return (
    <Link className="relative inline-block h-full w-full group" href={`/products/${slug}`}>
      {image ? (
        <Image
          alt={image.alt}
          className={clsx(
            'relative aspect-square object-cover border rounded-2xl p-8 bg-primary-foreground',
            'transition duration-300 ease-in-out group-hover:scale-102',
          )}
          height={image.height ?? 80}
          src={image.url}
          width={image.width ?? 80}
        />
      ) : null}

      <div className="font-mono text-primary/50 group-hover:text-primary flex justify-between items-center mt-4">
        <div>{title}</div>

        {priceInUSD !== null && (
          <div>
            <Price amount={priceInUSD} />
          </div>
        )}
      </div>
    </Link>
  )
}
