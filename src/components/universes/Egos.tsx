import { Reveal, Universe, UniverseHead } from '../shell/Universe'
import { EGOS, POWERS } from '../../data/profile'

export default function Egos() {
  return (
    <Universe id="egos" tone="egos" bleed>
      <div className="halftone" aria-hidden="true" />

      <div className="u__inner">
        <UniverseHead
          index="10"
          title="ALTER EGOS"
          sub="Three characters, and I see myself in all of them."
        />

        <div className="egos__grid">
          {EGOS.map((ego, i) => (
            <Reveal
              as="article"
              key={ego.name}
              className={`ego ego--${i + 1}`}
              delay={0.08 * i}
            >
              <p className="ego__k">{ego.k}</p>
              <h3>{ego.name}</h3>
              <p className="ego__why">{ego.why}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="powers" delay={0.12}>
          <p className="powers__label">If I got a superpower, I refused to pick one</p>

          <div className="powers__row">
            {POWERS.map(([name, note]) => (
              <div className="power" key={name}>
                <b>{name}</b>
                <span>{note}</span>
              </div>
            ))}
          </div>

          <p className="powers__foot">
            Look at that list again &mdash; every single one is just{' '}
            <em>more information, less exposure</em>. Even my fantasies are guarded.
          </p>
        </Reveal>
      </div>
    </Universe>
  )
}
