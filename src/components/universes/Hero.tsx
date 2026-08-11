import { Fragment, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import { Reveal } from '../shell/Universe'
import { useReducedMotion } from '../../lib/hooks'
import { IDENTITY } from '../../data/profile'

/** The name, one letter per span, so each can be staggered. */
const LETTERS = IDENTITY.name.split('')

/** The tagline, broken at its sentence boundary so it sets on two lines. */
const TAGLINE_LINES = IDENTITY.tagline.split(/(?<=\.)\s+/).filter((s) => s.length > 0)

/** Trait words for the bottom ticker. Every one of these is stated elsewhere
 *  in the archive — this strip is a decorative index of them. */
const TRAITS = [
  'ambivert',
  'reads people',
  'slow to trust',
  'money & psychology',
  'calm about fate',
  'white',
  'BMW',
  'overthinker',
]

/** How far the orb lags behind the page, as a fraction of scroll distance. */
const ORB_PARALLAX = 0.16

export default function Hero() {
  const reduced = useReducedMotion()
  const orbRef = useRef<HTMLDivElement | null>(null)
  const [lit, setLit] = useState(false)

  /* Letters draw themselves in on mount rather than on scroll — the hero is
     already in view when the page loads. */
  useEffect(() => {
    if (reduced) {
      setLit(true)
      return
    }
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setLit(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [reduced])

  /* Orb parallax — one write per frame, only while scrolling. */
  useEffect(() => {
    if (reduced) return
    const el = orbRef.current
    if (!el) return

    let frame = 0
    const apply = () => {
      frame = 0
      el.style.transform = `translate3d(0, ${(window.scrollY * ORB_PARALLAX).toFixed(2)}px, 0)`
    }
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(apply)
    }

    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
      el.style.transform = ''
    }
  }, [reduced])

  const letterStyle = (i: number): CSSProperties =>
    ({
      '--d': `${(i * 0.055).toFixed(3)}s`,
      opacity: lit ? 1 : 0,
      transform: lit ? 'none' : 'translate3d(0, 0.34em, 0)',
      transition: reduced
        ? 'none'
        : 'opacity .95s cubic-bezier(.16,1,.3,1) var(--d), transform .95s cubic-bezier(.16,1,.3,1) var(--d)',
      willChange: lit ? 'auto' : 'opacity, transform',
    }) as CSSProperties

  return (
    <section id="hero" className="u u--hero">
      <div className="hero__sweep" aria-hidden="true" />
      <div className="hero__orb" ref={orbRef} aria-hidden="true" />

      <div className="u__inner hero__inner">
        <Reveal as="p" className="hero__eyebrow">
          <span>{IDENTITY.age}</span>
          <i aria-hidden="true" />
          <span>IT</span>
          <i aria-hidden="true" />
          <span>{IDENTITY.zodiac}</span>
        </Reveal>

        <h1 className="hero__name">
          {LETTERS.map((ch, i) => (
            <span key={`${ch}-${i}`} style={letterStyle(i)}>
              {ch}
            </span>
          ))}
        </h1>

        <Reveal as="p" className="hero__alias" delay={0.1}>
          — a name is only the first part of the story.
        </Reveal>

        <Reveal as="p" className="hero__line" delay={0.18}>
          {TAGLINE_LINES.map((line, i) => (
            <Fragment key={line}>
              {i > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </Reveal>

        <Reveal className="hero__note" delay={0.26}>
          <p>This is an archive, not a résumé. Twelve small worlds — mind, taste, contradictions.</p>
          <p>
            <b>Nothing in here is a single fixed answer.</b> Everything is a probability, because it
            shifts with mood, situation and mindset.
          </p>
        </Reveal>

        <Reveal delay={0.34}>
          <a className="hero__scroll" href="#mind">
            enter the archive
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <path
                d="M12 4v15m0 0-6.5-6.5M12 19l6.5-6.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </Reveal>
      </div>

      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          {[0, 1].map((copy) =>
            TRAITS.map((trait) => (
              <Fragment key={`${copy}-${trait}`}>
                <span>{trait}</span>
                <i style={{ fontStyle: 'normal', opacity: 0.5 }}>◇</i>
              </Fragment>
            )),
          )}
        </div>
      </div>
    </section>
  )
}
