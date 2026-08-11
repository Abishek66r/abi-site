import type { ReactNode } from 'react'
import { Reveal, Universe } from '../shell/Universe'
import { LIGHT, SHADOW, TOTAL } from '../../data/profile'

type Trait = { title: string; note: string }

/** One half of the dual-tone split. Each list item reveals on a stagger. */
function SplitSide({
  variant,
  label,
  title,
  items,
}: {
  variant: 'dark' | 'light'
  label: string
  title: ReactNode
  items: readonly Trait[]
}) {
  return (
    <div className={`split__side split__side--${variant}`}>
      <div className="split__inner">
        <p className="split__label">{label}</p>
        <h3 className="split__title">{title}</h3>
        <ul className="split__list">
          {items.map((item, i) => (
            <Reveal as="li" key={item.title} delay={0.08 * i}>
              <b>{item.title}</b>
              <span>{item.note}</span>
            </Reveal>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function Duality() {
  return (
    <Universe id="duality" tone="duality" bleed>
      <Reveal as="header" className="duality__head">
        <p className="u__index">
          08 / {TOTAL}
        </p>
        <h2 className="duality__title">LIGHT &amp; SHADOW</h2>
        <p className="duality__sub">The same traits, pointed in two directions.</p>
      </Reveal>

      <div className="split">
        <SplitSide
          variant="dark"
          label="Shadow"
          title={
            <>
              What I&rsquo;d admit
              <br />
              without being asked
            </>
          }
          items={SHADOW}
        />
        <SplitSide
          variant="light"
          label="Light"
          title={
            <>
              What I&rsquo;m
              <br />
              actually proud of
            </>
          }
          items={LIGHT}
        />
      </div>

      <p className="duality__foot">
        Both columns are the same person. Most of my strengths and most of my flaws are the same
        trait pointed in different directions.
      </p>
    </Universe>
  )
}
