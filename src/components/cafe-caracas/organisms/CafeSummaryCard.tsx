import React from 'react'

import type { CafeDetail } from '@/modules/cafes'
import { WEEKDAY_LABELS, WEEKDAY_ORDER } from '@/modules/cafes'

import { Eyebrow } from '../atoms/Eyebrow'

type Props = {
  cafe: CafeDetail
}

/**
 * Converts `"17:00"` into `"5:00 p. m."`.
 *
 * Done by hand rather than with `Intl.DateTimeFormat`, which would need a Date
 * — and therefore an invented calendar day and a timezone — to format a time
 * that has neither. On a Worker that timezone is UTC, which would shift every
 * café's hours for every visitor.
 */
function formatTime(value: string): string {
  const [rawHour, rawMinute] = value.split(':')
  const hour = Number(rawHour)

  if (Number.isNaN(hour)) return value

  const suffix = hour < 12 ? 'a. m.' : 'p. m.'
  const display = hour % 12 === 0 ? 12 : hour % 12

  return `${display}:${rawMinute ?? '00'} ${suffix}`
}

/** One label/value line in the summary panel. */
const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-4 border-t border-[rgb(91_70_54/0.12)] py-3">
    <span className="text-[13px] text-cc-muted">{label}</span>
    <span className="text-[13px] font-semibold text-cc-ink">{value}</span>
  </div>
)

/**
 * The right-hand summary panel: rating, price, zone, opening hours and the
 * directions button.
 *
 * Days with no recorded window render "Cerrado" rather than being skipped. A
 * schedule that silently omits Monday reads as "we forgot Monday", not as
 * "closed on Mondays", and the two are different facts.
 */
export const CafeSummaryCard: React.FC<Props> = ({ cafe }) => (
  <aside className="rounded-3xl border border-[rgb(51_38_31/0.12)] bg-[rgb(255_253_249/0.88)] p-6 shadow-[0_16px_38px_rgb(51_38_31/0.08)]">
    <Eyebrow>RESUMEN</Eyebrow>

    <div className="mt-3 flex items-center justify-between">
      <span className="flex items-baseline gap-2">
        <span aria-hidden="true" className="text-xl text-cc-ink">
          ★
        </span>
        <span className="font-cc-display text-[32px] font-bold leading-none text-cc-ink">
          {cafe.rating === null ? 'N/A' : cafe.rating.toFixed(1)}
        </span>
      </span>

      <button
        aria-label={`Guardar ${cafe.name} en favoritos`}
        className="grid h-11 w-11 place-items-center rounded-full border border-[rgb(51_38_31/0.14)] bg-cc-surface text-xl text-cc-ink-strong transition-transform duration-200 hover:scale-105"
        type="button"
      >
        ♡
      </button>
    </div>

    <div className="mt-4">
      <Row label="Precio" value={cafe.price ?? 'Por verificar'} />
      <Row label="Zona" value={cafe.zone} />
    </div>

    <h2 className="mt-6 font-cc-display text-[26px] font-bold leading-tight text-cc-ink">Horario</h2>

    <dl className="mt-3">
      {WEEKDAY_ORDER.map((day) => {
        const window = cafe.hours[day]

        return (
          <div className="flex items-baseline justify-between gap-4 py-1" key={day}>
            <dt className="text-[13px] text-cc-muted">{WEEKDAY_LABELS[day]}</dt>
            <dd className="text-[13px] font-medium text-cc-ink">
              {/*
                Three outcomes, not two. A café with no schedule at all says
                "Horario por verificar"; one with a schedule that omits this day
                says "Cerrado". Collapsing them would claim a café is shut on
                days nobody has checked.
              */}
              {cafe.hoursUnknown
                ? 'Horario por verificar'
                : window
                  ? `${formatTime(window.open)} – ${formatTime(window.close)}`
                  : 'Cerrado'}
            </dd>
          </div>
        )
      })}
    </dl>

    {/* Rendered only when there is somewhere to go. A disabled-looking button
        that navigates nowhere is worse than no button. */}
    {cafe.mapUrl ? (
      <a
        className="mt-6 flex min-h-12 items-center justify-center rounded-full bg-cc-olive px-6 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
        href={cafe.mapUrl}
        rel="noreferrer noopener"
        target="_blank"
      >
        Cómo llegar
      </a>
    ) : null}
  </aside>
)
