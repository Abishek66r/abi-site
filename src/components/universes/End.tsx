import { IDENTITY, SOCIALS, TOTAL } from '../../data/profile'
import { fireGlobalReroll } from '../../lib/probability'
import { Reveal } from '../shell/Universe'

export default function End() {
  return (
    <section id="end" className="u u--end">
      <div className="u__inner">
        <Reveal>
          <p className="end__index">12 / {TOTAL}</p>
          <h2 className="end__title">That&rsquo;s most of it.</h2>
          <p className="end__body">
            Twelve worlds, one person, and almost no straight answers &mdash; because I don&rsquo;t
            think people <em>are</em> straight answers. We&rsquo;re all just probability spread
            across a mood.
          </p>
          <p className="end__sig">
            &mdash; {IDENTITY.name} <span>({IDENTITY.alias})</span>
          </p>
        </Reveal>

        <Reveal className="socials" delay={0.1}>
          {SOCIALS.map((social) =>
            social.url ? (
              <a key={social.label} href={social.url} target="_blank" rel="noreferrer noopener">
                {social.label}
              </a>
            ) : (
              <span key={social.label} title={`${social.label} — not linked yet`}>
                {social.label}
              </span>
            ),
          )}
        </Reveal>
      </div>

      <footer className="foot">
        <span>{IDENTITY.name} &middot; personal archive</span>
        <button
          type="button"
          className="reroll reroll--foot"
          onClick={() => fireGlobalReroll()}
        >
          re-roll everything
        </button>
      </footer>
    </section>
  )
}
