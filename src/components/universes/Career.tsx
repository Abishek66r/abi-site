import { Reveal, Universe, UniverseHead } from '../shell/Universe'
import { CV, TRACKS } from '../../data/profile'

/** 07 — Work. Swiss-brutalist CV ledger plus the two parallel tracks. */
export default function Career() {
  return (
    <Universe id="career" tone="career">
      <UniverseHead index="07" title="WORK" sub="Two tracks, run at the same time." />

      <div className="cv">
        {CV.map(([key, value, note], i) => (
          <Reveal key={key} className="cv__row" delay={i * 0.07}>
            <span className="cv__k">{key}</span>
            <span className="cv__v">
              {value} <i>{note}</i>
            </span>
          </Reveal>
        ))}
      </div>

      <div className="tracks">
        {TRACKS.map((track, i) => (
          <Reveal
            key={track.tag}
            as="article"
            className={i === 1 ? 'track track--accent' : 'track'}
            delay={0.08 + i * 0.1}
          >
            <p className="track__tag">{track.tag}</p>
            <h3>{track.title}</h3>
            <p>{track.body}</p>
          </Reveal>
        ))}
      </div>

      <Reveal as="p" className="career__kicker" delay={0.28}>
        I don't want to choose between them. Five years from now I want both to be true.
      </Reveal>
    </Universe>
  )
}
