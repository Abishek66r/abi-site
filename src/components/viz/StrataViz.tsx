import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef } from 'react'
import { useMeasure, useReducedMotion } from '../../lib/hooks'
import type { Sample } from '../../lib/probability'
import { colorOf } from './types'
import type { VizProps } from './types'

/* ============================================================
   STRATA — a core sample through the day.
   share -> BED THICKNESS. Layers keep their original order (as
   real sediment would) so a re-roll compresses and swells the
   beds instead of re-sorting them. Boundaries are wavy bedding
   planes, not rules; the stack always fills the stage exactly.
   Nothing numeric is ever drawn.
   ============================================================ */

const H = 250
const MIN_BED = 26

const fmt = (v: number) => (Math.round(v * 100) / 100).toString()

/** Deterministic, seeded ripple for one bedding plane. */
function waveAt(seed: number, x: number): number {
  const a1 = 2 + ((seed * 7) % 3) * 0.9
  const f1 = 0.012 + ((seed * 5) % 4) * 0.0042
  const p1 = seed * 1.73
  const a2 = 1.2 + ((seed * 3) % 2) * 0.7
  const f2 = 0.03 + ((seed * 11) % 3) * 0.0075
  const p2 = seed * 2.91
  return a1 * Math.sin(x * f1 + p1) + a2 * Math.sin(x * f2 + p2)
}

/** Catmull-Rom through points, emitted as cubic segments. */
function curveThrough(p: Array<[number, number]>): string {
  let d = ''
  const n = p.length
  for (let i = 0; i < n - 1; i++) {
    const p0 = p[Math.max(0, i - 1)]
    const p1 = p[i]
    const p2 = p[i + 1]
    const p3 = p[Math.min(n - 1, i + 2)]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(p2[0])} ${fmt(p2[1])}`
  }
  return d
}

type Plane = { fwd: string; rev: string; yEnd: number }

function plane(w: number, y: number, seed: number, amp: number): Plane {
  const step = Math.max(12, w / 22)
  const pts: Array<[number, number]> = []
  for (let x = 0; x < w; x += step) pts.push([x, y + amp * waveAt(seed, x)])
  pts.push([w, y + amp * waveAt(seed, w)])
  return {
    fwd: `M ${fmt(pts[0][0])} ${fmt(pts[0][1])}${curveThrough(pts)}`,
    rev: curveThrough([...pts].reverse()),
    yEnd: pts[pts.length - 1][1],
  }
}

function beddingPath(w: number, y: number, seed: number): string {
  const step = Math.max(16, w / 14)
  const pts: Array<[number, number]> = []
  for (let x = 4; x < w - 4; x += step) pts.push([x, y + 0.7 * waveAt(seed, x)])
  pts.push([w - 4, y + 0.7 * waveAt(seed, w - 4)])
  return `M ${fmt(pts[0][0])} ${fmt(pts[0][1])}${curveThrough(pts)}`
}

type Bed = { key: number; label: string; thick: number }

function bedsOf(samples: Sample[]): Bed[] {
  const ordered = [...samples].sort((a, b) => a.key - b.key)
  const n = ordered.length
  if (n === 0) return []
  const min = Math.min(MIN_BED, H / n)
  const free = Math.max(0, H - min * n)
  return ordered.map((s) => ({ key: s.key, label: s.label, thick: min + free * s.share }))
}

export default function StrataViz({ samples, nonce }: VizProps) {
  const { ref: stageRef, size } = useMeasure<HTMLDivElement>()
  const reduced = useReducedMotion()
  const rawId = useId()
  const uid = useMemo(() => `st${rawId.replace(/[^a-zA-Z0-9]/g, '')}`, [rawId])

  const beds = useMemo(() => bedsOf(samples), [samples])

  const fillRefs = useRef<Array<SVGPathElement | null>>([])
  const edgeRefs = useRef<Array<SVGPathElement | null>>([])
  const bedARefs = useRef<Array<SVGPathElement | null>>([])
  const bedBRefs = useRef<Array<SVGPathElement | null>>([])
  const labelRefs = useRef<Array<HTMLSpanElement | null>>([])

  const curRef = useRef<number[]>([])
  const tgtRef = useRef<number[]>([])
  const keysRef = useRef<number[]>([])
  const widthRef = useRef(0)
  const rafRef = useRef(0)
  const runningRef = useRef(false)
  const prevRef = useRef(0)

  const paint = useCallback(() => {
    const w = widthRef.current
    const cur = curRef.current
    const n = cur.length
    if (w <= 0 || n === 0) return

    const total = cur.reduce((a, b) => a + b, 0) || 1
    const scale = H / total
    const tops: number[] = []
    const thicks: number[] = []
    let y = 0
    for (let i = 0; i < n; i++) {
      const t = cur[i] * scale
      tops.push(y)
      thicks.push(t)
      y += t
    }

    const planes: Plane[] = []
    for (let b = 0; b <= n; b++) {
      const py = b < n ? tops[b] : H
      planes.push(plane(w, py, b + 3, b === 0 || b === n ? 0 : 1))
    }

    for (let i = 0; i < n; i++) {
      const top = planes[i]
      const bot = planes[i + 1]
      fillRefs.current[i]?.setAttribute(
        'd',
        `${top.fwd} L ${fmt(w)} ${fmt(bot.yEnd)}${bot.rev} Z`,
      )
      if (i > 0) edgeRefs.current[i]?.setAttribute('d', top.fwd)
      bedARefs.current[i]?.setAttribute(
        'd',
        beddingPath(w, tops[i] + thicks[i] * 0.36, keysRef.current[i] * 5 + 17),
      )
      bedBRefs.current[i]?.setAttribute(
        'd',
        beddingPath(w, tops[i] + thicks[i] * 0.72, keysRef.current[i] * 9 + 41),
      )
      const lab = labelRefs.current[keysRef.current[i]]
      if (lab) lab.style.transform = `translateY(${fmt(tops[i] + thicks[i] / 2)}px) translateY(-50%)`
    }
  }, [])

  const loop = useCallback(
    (now: number) => {
      const dt = Math.min(0.05, (now - prevRef.current) / 1000)
      prevRef.current = now
      const k = 1 - Math.exp(-dt * 4.6)
      const cur = curRef.current
      const tgt = tgtRef.current
      let worst = 0
      for (let i = 0; i < cur.length && i < tgt.length; i++) {
        cur[i] += (tgt[i] - cur[i]) * k
        worst = Math.max(worst, Math.abs(tgt[i] - cur[i]))
      }
      if (worst < 0.08) {
        for (let i = 0; i < cur.length && i < tgt.length; i++) cur[i] = tgt[i]
        runningRef.current = false
        paint()
        return
      }
      paint()
      rafRef.current = requestAnimationFrame(loop)
    },
    [paint],
  )

  useLayoutEffect(() => {
    widthRef.current = size.w
    tgtRef.current = beds.map((b) => b.thick)
    keysRef.current = beds.map((b) => b.key)
    if (reduced || curRef.current.length !== beds.length) {
      curRef.current = beds.map((b) => b.thick)
    }
    paint()
    if (reduced) return
    if (!runningRef.current) {
      runningRef.current = true
      prevRef.current = performance.now()
      rafRef.current = requestAnimationFrame(loop)
    }
  }, [beds, nonce, size.w, reduced, paint, loop])

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current)
      runningRef.current = false
    },
    [],
  )

  const vw = Math.max(1, size.w)
  const ticks = useMemo(() => {
    const out: number[] = []
    for (let y = 10; y < H; y += 10) out.push(y)
    return out
  }, [])

  return (
    <div className="viz" ref={stageRef} style={{ height: H }}>
      <svg
        aria-hidden="true"
        width="100%"
        height={H}
        viewBox={`0 0 ${vw} ${H}`}
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <clipPath id={`${uid}-clip`}>
            <rect x="0" y="0" width={vw} height={H} rx="12" />
          </clipPath>
          <pattern
            id={`${uid}-hatch`}
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(38)"
          >
            <line x1="0" y1="0" x2="0" y2="7" stroke="#000" strokeWidth="2.4" opacity="0.5" />
          </pattern>
          <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="4" result="n" />
            <feColorMatrix
              in="n"
              type="matrix"
              values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .5 0"
            />
          </filter>
          {beds.map((b) => (
            <linearGradient key={b.key} id={`${uid}-r${b.key}`} x1="0" y1="0" x2="0.15" y2="1">
              <stop offset="0%" stopColor={colorOf(b.key, 49, 44)} />
              <stop offset="45%" stopColor={colorOf(b.key, 38, 40)} />
              <stop offset="100%" stopColor={colorOf(b.key, 27, 36)} />
            </linearGradient>
          ))}
        </defs>

        <g clipPath={`url(#${uid}-clip)`}>
          {beds.map((b, i) => (
            <g key={b.key}>
              <path
                ref={(el) => {
                  fillRefs.current[i] = el
                }}
                fill={`url(#${uid}-r${b.key})`}
              />
              <path
                ref={(el) => {
                  bedARefs.current[i] = el
                }}
                fill="none"
                stroke={colorOf(b.key, 78, 40, 0.16)}
                strokeWidth="1"
              />
              <path
                ref={(el) => {
                  bedBRefs.current[i] = el
                }}
                fill="none"
                stroke="#000"
                strokeWidth="1"
                opacity="0.16"
              />
            </g>
          ))}

          {/* grain + hatch: rock, not chart */}
          <rect
            x="0"
            y="0"
            width={vw}
            height={H}
            fill={`url(#${uid}-hatch)`}
            opacity="0.07"
          />
          <rect
            x="0"
            y="0"
            width={vw}
            height={H}
            filter={`url(#${uid}-grain)`}
            opacity="0.16"
            style={{ mixBlendMode: 'overlay' }}
          />

          {/* bedding planes drawn over the grain so they stay legible */}
          {beds.map((b, i) =>
            i === 0 ? null : (
              <path
                key={b.key}
                ref={(el) => {
                  edgeRefs.current[i] = el
                }}
                fill="none"
                stroke={colorOf(b.key, 82, 52, 0.42)}
                strokeWidth="1"
              />
            ),
          )}

          {/* core-sample depth ticks */}
          <g stroke="#fff" opacity="0.16">
            {ticks.map((y) => (
              <line
                key={y}
                x1={vw - (y % 50 === 0 ? 12 : 6)}
                y1={y}
                x2={vw}
                y2={y}
                strokeWidth="1"
              />
            ))}
          </g>
        </g>
      </svg>

      {/* labels: real DOM text inside their bed, rank order for screen readers */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {samples.map((s) => (
          <span
            key={s.key}
            ref={(el) => {
              labelRefs.current[s.key] = el
            }}
            style={{
              position: 'absolute',
              left: 14,
              top: 0,
              maxWidth: Math.max(90, vw - 42),
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              lineHeight: 1.25,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#fff',
              opacity: 0.92,
              textShadow: '0 1px 3px rgba(0,0,0,.6)',
            }}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}
