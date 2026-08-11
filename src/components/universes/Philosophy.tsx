import { Fragment } from 'react'
import { Reveal, Universe, UniverseHead } from '../shell/Universe'

/** The two halves of the same shrug: the reading, then the letting go. */
const COLUMNS: { h: string; body: string[] }[] = [
  {
    h: "It's fascination, not cynicism",
    body: [
      'Money and psychology are the two levers that move almost everything. Strip a situation far enough down and one of them is usually sitting underneath it, and I find that genuinely interesting rather than bleak.',
      'If you want to know who someone is, watch how they behave the moment money enters the room. It is the fastest honest read there is — and reading a market is just reading people at scale.',
    ],
  },
  {
    h: 'And then: whatever happens, happens',
    body: [
      'I analyse everything — situations, people, outcomes — usually far past the point of usefulness. Then I let go of the result. The analysis is the part I control; the outcome was never on that list.',
      'It is not laziness. I believe in god and fate, and fate is permission to stop panicking, not an excuse to stop trying. If it is meant to happen, it will happen. I am not chasing it and I am not avoiding it.',
    ],
  },
]

const STATS: { word: string; label: string }[] = [
  { word: 'Analyse', label: 'the part I control' },
  { word: 'Release', label: "the part I don't" },
  { word: 'Stay calm', label: 'the whole point' },
]

export default function Philosophy() {
  return (
    <Universe id="philosophy" tone="philosophy">
      <UniverseHead index="02" title="PHILOSOPHY" sub="Two forces, one shrug." />

      <Reveal>
        <blockquote className="pull">
          <p>
            Everything in this world runs on <em>money</em> and <em>psychology</em>.
          </p>
          <cite>— the lens I look through</cite>
        </blockquote>
      </Reveal>

      <div className="phil__cols">
        {COLUMNS.map((col, i) => (
          <Reveal key={col.h} delay={i * 0.1}>
            <h3 className="phil__h">{col.h}</h3>
            {col.body.map((para) => (
              <p key={para}>{para}</p>
            ))}
          </Reveal>
        ))}
      </div>

      <Reveal className="phil__stack" delay={0.12}>
        {STATS.map((stat, i) => (
          <Fragment key={stat.word}>
            {i > 0 && (
              <svg
                className="phil__arrow"
                viewBox="0 0 40 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M1 6h36M32 2l5 4-5 4" />
              </svg>
            )}
            <div className="phil__stat">
              <b>{stat.word}</b>
              <span>{stat.label}</span>
            </div>
          </Fragment>
        ))}
      </Reveal>
    </Universe>
  )
}
