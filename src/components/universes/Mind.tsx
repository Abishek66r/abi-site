import { FEARS, MIND_CARDS, MIND_READOUT } from '../../data/profile'
import { useReducedMotion } from '../../lib/hooks'
import { Reveal, Universe, UniverseHead } from '../shell/Universe'

/** Column width, in mono characters, that every readout key is padded to. */
const KEY_WIDTH = 20

/** `origin` -> `origin ............` so the value column lines up in the mono grid. */
const padKey = (key: string) => `${key} `.padEnd(KEY_WIDTH, '.')

export default function Mind() {
  const reduced = useReducedMotion()

  return (
    <Universe id="mind" tone="mind" bleed>
      <div className="scanline" aria-hidden="true" />

      <div className="u__inner">
        <UniverseHead
          index="01"
          title="THE MIND"
          sub="The instrument I trust most, and trust least."
        />

        <Reveal className="term">
          <div className="term__bar">
            <i aria-hidden="true" />
            <i aria-hidden="true" />
            <i aria-hidden="true" />
            <span>abi@self — /psychology</span>
          </div>

          <div className="term__body">
            <p>
              <b>&gt;</b> read --self
            </p>

            {MIND_READOUT.map(([k, value, comment]) => (
              <p className="term__out" key={k}>
                {padKey(k)} <em>{value}</em>{' '}
                <span className="term__dim">// {comment}</span>
              </p>
            ))}

            <p>
              <b>&gt;</b>{' '}
              <span
                className="term__cursor"
                aria-hidden="true"
                style={reduced ? { animation: 'none' } : undefined}
              />
            </p>
          </div>
        </Reveal>

        <div className="mind__grid">
          {MIND_CARDS.map((card, i) => (
            <Reveal key={card.title} delay={i * 0.09} className="flex">
              <article className="card--mind grow">
                <h3>{card.title}</h3>
                {card.body.map((para) => (
                  <p key={para}>{para}</p>
                ))}
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="fears" delay={0.06}>
          <p className="fears__label">// fear registry — all four are live</p>

          <ul className="fears__list">
            {FEARS.map((fear) => (
              <li key={fear.n}>
                <span>{fear.n}</span>
                <b>{fear.title}</b>
                <i>{fear.note}</i>
              </li>
            ))}
          </ul>

          <p className="fears__foot">
            I didn&rsquo;t pick one. Honestly, it&rsquo;s all of them — they just take turns.
          </p>
        </Reveal>
      </div>
    </Universe>
  )
}
