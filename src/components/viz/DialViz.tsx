import { useMemo } from 'react'
import { colorOf } from './types'
import type { VizProps } from './types'
import './DialViz.css'

/* ============================================================
   DIAL — an analogue instrument. A 180 degree arc, carved into
   one band per option: ARC LENGTH is the share. The needle
   settles into whichever band is strongest this roll, with a
   little overshoot, the way a real meter does.
   ============================================================ */

const W = 420
const H = 214
const CX = W / 2
const CY = 190
/** mid-radius of the band */
const R = 140
const BAND = 30
/** normalised path length — lets us do dash maths in clean units */
const L = 1000
/** gap between neighbouring bands, in path-length units */
const GAP = 7
const TICKS = 33

const ARC = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`

type Segment = {
  key: number
  label: string
  rank: number
  share: number
  start: number
  len: number
}

export default function DialViz({ samples, nonce }: VizProps) {
  const { segments, needle } = useMemo(() => {
    /* stable key order along the arc, so each option keeps its
       territory and the needle is the thing that travels */
    const ordered = [...samples].sort((a, b) => a.key - b.key)
    const total = ordered.reduce((a, s) => a + s.share, 0) || 1
    let cursor = 0
    const segs: Segment[] = ordered.map((s) => {
      const len = (s.share / total) * L
      const seg = { key: s.key, label: s.label, rank: s.rank, share: s.share, start: cursor, len }
      cursor += len
      return seg
    })
    const lead = segs.find((s) => s.rank === 0) ?? segs[0]
    const centre = lead ? (lead.start + lead.len / 2) / L : 0.5
    return { segments: segs, needle: (centre - 0.5) * 180 }
  }, [samples, nonce])

  const ticks = useMemo(
    () =>
      Array.from({ length: TICKS }, (_, i) => {
        const a = Math.PI + (i / (TICKS - 1)) * Math.PI
        const major = i % 8 === 0
        const r1 = R - BAND / 2 - 4
        const r2 = r1 - (major ? 10 : 5)
        return {
          x1: CX + Math.cos(a) * r1,
          y1: CY + Math.sin(a) * r1,
          x2: CX + Math.cos(a) * r2,
          y2: CY + Math.sin(a) * r2,
          o: major ? 0.42 : 0.18,
        }
      }),
    [],
  )

  const legend = useMemo(() => [...samples].sort((a, b) => a.rank - b.rank), [samples])

  return (
    <div className="viz dialviz">
      {/* the instrument is decoration: the legend below carries the readable labels */}
      <svg className="dialviz__arc" viewBox={`0 0 ${W} ${H}`} width="100%" aria-hidden="true">
        <defs>
          <filter id="dialviz-soft" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        <g aria-hidden="true">
          {/* the empty instrument */}
          <path
            d={ARC}
            fill="none"
            stroke="rgba(255,255,255,.07)"
            strokeWidth={BAND + 8}
            strokeLinecap="butt"
          />
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1.toFixed(1)}
              y1={t.y1.toFixed(1)}
              x2={t.x2.toFixed(1)}
              y2={t.y2.toFixed(1)}
              stroke="#ffffff"
              strokeOpacity={t.o}
              strokeWidth={1}
            />
          ))}

          {/* soft bloom behind each band — intensity rides the share */}
          {segments.map((s) => (
            <path
              key={`glow-${s.key}`}
              className="dialviz__seg dialviz__seg--glow"
              d={ARC}
              pathLength={L}
              fill="none"
              stroke={colorOf(s.key, 62, 92)}
              strokeWidth={BAND + 10}
              strokeLinecap="butt"
              style={{
                strokeDasharray: `${Math.max(1, s.len - GAP).toFixed(2)} ${L}`,
                strokeDashoffset: (-(s.start + GAP / 2)).toFixed(2),
                strokeOpacity: 0.08 + Math.min(0.34, s.share * 0.9),
              }}
            />
          ))}

          {/* the bands themselves */}
          {segments.map((s) => (
            <path
              key={s.key}
              className={`dialviz__seg ${s.rank === 0 ? 'is-lead' : ''}`}
              d={ARC}
              pathLength={L}
              fill="none"
              stroke={colorOf(s.key, s.rank === 0 ? 66 : 54, 82)}
              strokeWidth={BAND}
              strokeLinecap="butt"
              style={{
                strokeDasharray: `${Math.max(1, s.len - GAP).toFixed(2)} ${L}`,
                strokeDashoffset: (-(s.start + GAP / 2)).toFixed(2),
              }}
            />
          ))}

          {/* inner + outer rails */}
          <path d={ARC} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth={1} />
          <path
            d={`M ${CX - (R - BAND / 2)} ${CY} A ${R - BAND / 2} ${R - BAND / 2} 0 0 1 ${CX + (R - BAND / 2)} ${CY}`}
            fill="none"
            stroke="rgba(255,255,255,.16)"
            strokeWidth={1}
          />
          <path
            d={`M ${CX - (R + BAND / 2)} ${CY} A ${R + BAND / 2} ${R + BAND / 2} 0 0 1 ${CX + (R + BAND / 2)} ${CY}`}
            fill="none"
            stroke="rgba(255,255,255,.16)"
            strokeWidth={1}
          />
          <line
            x1={CX - (R + BAND / 2)}
            y1={CY}
            x2={CX - (R - BAND / 2)}
            y2={CY}
            stroke="rgba(255,255,255,.16)"
            strokeWidth={1}
          />
          <line
            x1={CX + (R - BAND / 2)}
            y1={CY}
            x2={CX + (R + BAND / 2)}
            y2={CY}
            stroke="rgba(255,255,255,.16)"
            strokeWidth={1}
          />

          {/* needle */}
          <g
            className="dialviz__needle"
            style={{
              transform: `rotate(${needle.toFixed(2)}deg)`,
              transformBox: 'view-box',
              transformOrigin: `${CX}px ${CY}px`,
            }}
          >
            <path
              d={`M ${CX - 5} ${CY} L ${CX - 1.5} ${CY - (R + 8)} L ${CX + 1.5} ${CY - (R + 8)} L ${CX + 5} ${CY} Z`}
              fill="#f6f4ff"
              filter="url(#dialviz-soft)"
              opacity={0.5}
            />
            <path
              d={`M ${CX - 5} ${CY} L ${CX - 1.5} ${CY - (R + 8)} L ${CX + 1.5} ${CY - (R + 8)} L ${CX + 5} ${CY} Z`}
              fill="#ffffff"
            />
          </g>
          <circle cx={CX} cy={CY} r={13} fill="#0a0c22" stroke="rgba(255,255,255,.3)" strokeWidth={1} />
          <circle cx={CX} cy={CY} r={4.5} fill="#ffffff" opacity={0.9} />
        </g>
      </svg>

      <ul className="dialviz__legend">
        {legend.map((s) => (
          <li key={s.key} className={`dialviz__entry ${s.rank === 0 ? 'is-lead' : ''}`}>
            <span
              className="dialviz__chip"
              aria-hidden="true"
              style={{
                background: colorOf(s.key, 62, 86),
                boxShadow: s.rank === 0 ? `0 0 0 2px ${colorOf(s.key, 62, 86, 0.28)}` : 'none',
              }}
            />
            <span className="dialviz__name">{s.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
