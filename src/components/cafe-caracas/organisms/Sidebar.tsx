import { BrandMark } from '../atoms/BrandMark'
import { SidebarCard } from '../molecules/SidebarCard'
import React from 'react'

/**
 * The right rail: an events panel in its empty state, and an ad placeholder.
 *
 * The 70px top offset is not arbitrary padding — it lines the first panel up
 * with the top of the first card row, past the section heading. Without it the
 * rail starts level with the heading and the whole right side sits high.
 */
export const Sidebar: React.FC = () => (
  <aside aria-label="Información destacada" className="mt-[70px] flex flex-col gap-4">
    <SidebarCard eyebrow="AGENDA" title="Eventos en cafés">
      <div className="mt-5 flex flex-col items-center text-center">
        <BrandMark size={44} />

        <h3 className="mt-3 font-cc-display text-xl font-bold text-cc-ink">Próximamente</h3>

        <p className="mt-2 text-sm leading-relaxed text-cc-muted">
          Muy pronto podrás descubrir talleres, catas, música en vivo y encuentros en cafés de
          Caracas.
        </p>

        <span className="mt-3 text-xs text-cc-muted-soft">
          Solo mostraremos eventos verificados.
        </span>
      </div>
    </SidebarCard>

    <SidebarCard eyebrow="PRÓXIMAMENTE" title="Espacio destacado">
      <p className="mt-2 text-sm leading-relaxed text-cc-muted">
        Publicidad para marcas, eventos y negocios relacionados con el café.
      </p>

      <div className="mt-4 grid min-h-[150px] place-items-center rounded-[18px] border border-dashed border-[rgb(79_84_54_/_0.3)]">
        <span className="font-cc-display text-xl text-cc-olive-deep">Tu negocio aquí</span>
      </div>
    </SidebarCard>
  </aside>
)
