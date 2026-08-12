import { useCallback, useEffect, useRef, useState } from 'react'

import { LAB_PANELS } from '../../data/profile'
import { fireGlobalReroll } from '../../lib/probability'
import { useReducedMotion } from '../../lib/hooks'
import { Universe, UniverseHead, Reveal } from '../shell/Universe'
import LabPanel from './LabPanel'

import './Lab.css'

/** One full turn of the refresh glyph — driven by the `.reroll.spin`
 *  transition already defined in index.css. */
function RefreshGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M22 4v6h-6" />
      <path d="M2 20v-6h6" />
      <path d="M3.6 9.2a9 9 0 0 1 14.7-3.3L22 10" />
      <path d="M20.4 14.8a9 9 0 0 1-14.7 3.3L2 14" />
    </svg>
  )
}

export default function Lab() {
  const reduced = useReducedMotion()
  const [spinning, setSpinning] = useState(false)
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const rollTheDay = useCallback(() => {
    fireGlobalReroll()
    if (reduced) return
    setSpinning(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setSpinning(false), 680)
  }, [reduced])

  return (
    <Universe id="lab" tone="lab" bleed>
      <div className="lab__bg" aria-hidden="true" />

      <div className="u__inner">
        <UniverseHead
          index="03"
          title="THE POSSIBILITY LAB"
          sub={
            <>
              Ask me my favourite anything and the honest answer is that it is all about
              <em> probability</em> and <em> possibility</em>. Nothing stays the same — every choice
              is a chance to change.
            </>
          }
        />

        <Reveal className="lab__manifesto" delay={0.06}>
          <p>
            Nobody actually picks one thing and keeps picking it. It moves — with the mood, the
            situation, the people around me, and whatever version of myself is awake that day.
          </p>
          <p>
            These are not fixed answers. They are <b>possibilities</b> — the chance that one choice
            wins on a given day and the chance it changes tomorrow.
          </p>

          <button
            type="button"
            className={`reroll reroll--big ${spinning ? 'spin' : ''}`}
            onClick={rollTheDay}
          >
            <RefreshGlyph />
            Re-roll the whole day
          </button>

          <p className="reroll__hint">
            Every panel shifts. That&rsquo;s the point — it never lands the same way twice.
          </p>
        </Reveal>

        <div className="panels">
          {LAB_PANELS.map((spec, i) => (
            <LabPanel key={spec.id} spec={spec} index={i} />
          ))}
        </div>
      </div>
    </Universe>
  )
}
