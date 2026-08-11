import type { ReactNode } from 'react'
import { useReveal } from '../../lib/hooks'
import { TOTAL } from '../../data/profile'

/** Fades its children in on scroll. `delay` in seconds. */
export function Reveal({
  children,
  delay = 0,
  className = '',
  as: As = 'div',
}: {
  children: ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'section' | 'article' | 'header' | 'li' | 'p'
}) {
  const { ref, shown } = useReveal()
  return (
    <As
      ref={ref as never}
      className={`reveal ${shown ? 'in' : ''} ${className}`}
      style={{ '--d': `${delay}s` } as React.CSSProperties}
    >
      {children}
    </As>
  )
}

/** The outer shell every universe shares. `tone` selects the palette
 *  (see the `.u--*` blocks in index.css). */
export function Universe({
  id,
  tone,
  children,
  className = '',
  bleed = false,
}: {
  id: string
  tone: string
  children: ReactNode
  className?: string
  /** skip the centred inner column (for full-bleed layouts) */
  bleed?: boolean
}) {
  return (
    <section id={id} className={`u u--${tone} ${className}`}>
      {bleed ? children : <div className="u__inner">{children}</div>}
    </section>
  )
}

/** Standard universe heading: index, title, subtitle. */
export function UniverseHead({
  index,
  title,
  sub,
  titleClass = '',
}: {
  index: string
  title: string
  sub: ReactNode
  titleClass?: string
}) {
  return (
    <Reveal as="header" className="u__head">
      <p className="u__index">
        {index} / {TOTAL}
      </p>
      <h2 className={`u__title ${titleClass}`}>{title}</h2>
      <p className="u__sub">{sub}</p>
    </Reveal>
  )
}
