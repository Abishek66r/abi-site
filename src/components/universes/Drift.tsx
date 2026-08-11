import { useEffect, useRef } from 'react'

import { useReducedMotion } from '../../lib/hooks'
import { Reveal, Universe, UniverseHead } from '../shell/Universe'

import './Drift.css'

/** How far the sky slides across the whole scroll pass, in % of its own height. */
const TRAVEL = 10

export default function Drift() {
  const reduced = useReducedMotion()
  const skyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (reduced) return
    const sky = skyRef.current
    const section = sky?.parentElement
    if (!sky || !section) return

    let frame = 0

    const apply = () => {
      frame = 0
      const rect = section.getBoundingClientRect()
      const vh = window.innerHeight || 1
      /* 0 as the section enters from the bottom, 1 as it leaves past the top */
      const raw = (vh - rect.top) / (vh + rect.height)
      const p = raw < 0 ? 0 : raw > 1 ? 1 : raw
      sky.style.setProperty('--drift-y', `${((p - 0.5) * TRAVEL).toFixed(2)}%`)
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(apply)
    }

    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      sky.style.removeProperty('--drift-y')
    }
  }, [reduced])

  return (
    <Universe id="drift" tone="drift" bleed>
      <div className="drift__sky" ref={skyRef} aria-hidden="true">
        <span className="drift__sun" />
        <span className="drift__haze" />
        <span className="drift__horizon" />
        <span className="drift__horizon drift__horizon--low" />
      </div>

      <div className="u__inner">
        <UniverseHead index="11" title="DRIFT" sub="No pins on the map." />

        <Reveal className="drift__body" delay={0.08}>
          <p className="drift__big">I don&rsquo;t have a dream destination.</p>
          <p>
            People always expect a name here &mdash; Dubai, Switzerland, Japan. I don&rsquo;t have
            one. I just love going. The specific place has never been the point.
          </p>
          <p>
            Which makes this the cleanest example of the whole philosophy:{' '}
            <em>no fixed answer, no fixed plan</em>, and completely calm about it.
          </p>
        </Reveal>
      </div>
    </Universe>
  )
}
