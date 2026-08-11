import { Reveal, Universe, UniverseHead } from '../shell/Universe'
import { ROOTS } from '../../data/profile'

export default function Roots() {
  return (
    <Universe id="roots" tone="roots">
      <UniverseHead index="09" title="ROOTS" sub="Where the shape came from." />

      <div className="roots__grid">
        {ROOTS.map((root, i) => (
          <Reveal
            as="article"
            key={root.tag}
            className={`slab${root.wide ? ' slab--wide' : ''}`}
            delay={0.08 * i}
          >
            <p className="slab__tag">{root.tag}</p>
            <h3>{root.title}</h3>
            <p>{root.body}</p>
          </Reveal>
        ))}
      </div>
    </Universe>
  )
}
