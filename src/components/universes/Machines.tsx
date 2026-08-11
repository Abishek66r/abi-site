import { Reveal, Universe, UniverseHead } from '../shell/Universe'
import { MACHINE_TILES } from '../../data/profile'

/** 06 — Machines & companions. Showroom-silver tile grid.
 *  The BMW material lives in its own universe (05) and is deliberately
 *  not repeated here. */
export default function Machines() {
  return (
    <Universe id="machines" tone="machines">
      <UniverseHead
        index="06"
        title="MACHINES & COMPANIONS"
        sub="Things that never disappoint me."
      />

      <div className="machines__grid">
        {MACHINE_TILES.map((tile, i) => (
          <Reveal key={tile.n} as="article" className="tile" delay={i * 0.08}>
            <span className="tile__num">{tile.n}</span>
            <h4>{tile.title}</h4>
            <p>{tile.body}</p>
          </Reveal>
        ))}
      </div>
    </Universe>
  )
}
