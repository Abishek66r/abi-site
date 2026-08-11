import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef } from 'react'
import { useMeasure, useReducedMotion } from '../../lib/hooks'
import type { Sample } from '../../lib/probability'
import { colorOf } from './types'
import type { VizProps } from './types'

/* ============================================================
   LIQUID — organic metaball blobs.
   share -> blob AREA (radius = k * sqrt(share)), so a stronger
   option owns visibly more surface. Blobs are packed edge to edge
   along one line, wobble continuously, and morph their area when
   the roll changes. Nothing numeric is ever drawn.
   ============================================================ */

const H = 258
const CY = 100
const GAP = 12
const R_MAX = 74
const R_MIN = 10
const LABEL_TOP = [186, 216]

type Slot = { key: number; label: string; r: number; cx: number; row: number }
type Frame = { r: number; cx: number }

const fmt = (v: number) => (Math.round(v * 100) / 100).toString()

/** Radius from share so that AREA is proportional to share, then packed to fit. */
function layoutBlobs(samples: Sample[], w: number): Slot[] {
  const ordered = [...samples].sort((a, b) => a.key - b.key)
  const n = ordered.length
  if (n === 0 || w <= 0) return []

  const roots = ordered.map((s) => Math.sqrt(Math.max(s.share, 0.0025)))
  const sumRoots = roots.reduce((a, b) => a + b, 0) || 1
  const maxRoot = Math.max(...roots)

  const fit = (w - GAP * (n - 1)) / (2 * sumRoots)
  const factor = Math.max(0.5, Math.min(fit, R_MAX / maxRoot))
  const radii = roots.map((r) => Math.max(R_MIN, factor * r))

  const used = radii.reduce((a, r) => a + 2 * r, 0) + GAP * (n - 1)
  let x = (w - used) / 2

  return ordered.map((s, i) => {
    const r = radii[i]
    const cx = x + r
    x += 2 * r + GAP
    return { key: s.key, label: s.label, r, cx, row: i % 2 }
  })
}

/** Closed Catmull-Rom loop through wobbled points — a soft, living blob. */
function blobPath(cx: number, cy: number, r: number, t: number, seed: number): string {
  const N = 9
  const pts: Array<[number, number]> = []
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2
    const wob =
      1 +
      0.062 * Math.sin(t * 0.85 + i * 1.71 + seed * 2.3) +
      0.038 * Math.cos(t * 1.31 + i * 2.57 - seed * 1.7)
    const rr = r * wob
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.94])
  }
  let d = `M ${fmt(pts[0][0])} ${fmt(pts[0][1])}`
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % N]
    const p3 = pts[(i + 2) % N]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(p2[0])} ${fmt(p2[1])}`
  }
  return `${d} Z`
}

export default function LiquidViz({ samples, nonce }: VizProps) {
  const { ref: stageRef, size } = useMeasure<HTMLDivElement>()
  const reduced = useReducedMotion()
  const rawId = useId()
  const uid = useMemo(() => `lq${rawId.replace(/[^a-zA-Z0-9]/g, '')}`, [rawId])

  const slots = useMemo(() => layoutBlobs(samples, size.w), [samples, size.w])
  const slotByKey = useMemo(() => {
    const m = new Map<number, Slot>()
    slots.forEach((s) => m.set(s.key, s))
    return m
  }, [slots])

  const gooRefs = useRef<Array<SVGPathElement | null>>([])
  const crispRefs = useRef<Array<SVGPathElement | null>>([])
  const leadRefs = useRef<Array<SVGLineElement | null>>([])
  const labelRefs = useRef<Array<HTMLSpanElement | null>>([])
  const blurRef = useRef<SVGFEGaussianBlurElement | null>(null)

  const curRef = useRef<Frame[]>([])
  const tgtRef = useRef<Frame[]>([])
  const keysRef = useRef<number[]>([])
  const splashRef = useRef(0)
  const clockRef = useRef(0)

  const paint = useCallback((t: number) => {
    const cur = curRef.current
    for (let i = 0; i < cur.length; i++) {
      const f = cur[i]
      const d = blobPath(f.cx, CY, f.r, t, i + 1)
      gooRefs.current[i]?.setAttribute('d', d)
      crispRefs.current[i]?.setAttribute('d', d)

      const labelTop = LABEL_TOP[i % 2]
      const line = leadRefs.current[i]
      if (line) {
        const y2 = labelTop - 9
        const y1 = Math.min(CY + f.r * 0.9, y2 - 3)
        line.setAttribute('x1', fmt(f.cx))
        line.setAttribute('x2', fmt(f.cx))
        line.setAttribute('y1', fmt(y1))
        line.setAttribute('y2', fmt(y2))
      }

      const lab = labelRefs.current[keysRef.current[i]]
      if (lab) lab.style.transform = `translateX(${fmt(f.cx)}px) translateX(-50%)`
    }
    blurRef.current?.setAttribute('stdDeviation', fmt(6.5 + splashRef.current * 9))
  }, [])

  /* targets in, positions written before paint so nothing ever jumps */
  useLayoutEffect(() => {
    const next: Frame[] = slots.map((s) => ({ r: s.r, cx: s.cx }))
    tgtRef.current = next
    keysRef.current = slots.map((s) => s.key)
    if (reduced || curRef.current.length !== next.length) {
      curRef.current = next.map((f) => ({ r: f.r, cx: f.cx }))
    }
    paint(reduced ? 0 : clockRef.current)
  }, [slots, reduced, paint])

  /* a re-roll makes the surface tension let go for a moment */
  useEffect(() => {
    if (!reduced) splashRef.current = 1
  }, [nonce, reduced])

  useEffect(() => {
    if (reduced) return
    let raf = 0
    let prev = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000)
      prev = now
      clockRef.current += dt

      const k = 1 - Math.exp(-dt * 5.5)
      const cur = curRef.current
      const tgt = tgtRef.current
      for (let i = 0; i < cur.length && i < tgt.length; i++) {
        cur[i].r += (tgt[i].r - cur[i].r) * k
        cur[i].cx += (tgt[i].cx - cur[i].cx) * k
      }
      splashRef.current *= Math.exp(-dt * 2.8)
      paint(clockRef.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced, paint])

  const vw = Math.max(1, size.w)

  return (
    <div className="viz" ref={stageRef} style={{ height: H }}>
      <svg
        aria-hidden="true"
        width="100%"
        height={H}
        viewBox={`0 0 ${vw} ${H}`}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
      >
        <defs>
          <filter id={`${uid}-goo`} colorInterpolationFilters="sRGB">
            <feGaussianBlur ref={blurRef} in="SourceGraphic" stdDeviation="6.5" result="soft" />
            <feColorMatrix
              in="soft"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11"
            />
          </filter>
          {slots.map((s) => (
            <radialGradient key={s.key} id={`${uid}-f${s.key}`} cx="34%" cy="26%" r="82%">
              <stop offset="0%" stopColor={colorOf(s.key, 80, 88)} />
              <stop offset="55%" stopColor={colorOf(s.key, 58, 76)} />
              <stop offset="100%" stopColor={colorOf(s.key, 33, 62)} />
            </radialGradient>
          ))}
        </defs>

        {/* gooey merge layer — blurred + alpha-crushed so neighbours fuse */}
        <g filter={`url(#${uid}-goo)`} opacity="0.4">
          {slots.map((s, i) => (
            <path
              key={s.key}
              ref={(el) => {
                gooRefs.current[i] = el
              }}
              fill={colorOf(s.key, 56, 84)}
            />
          ))}
        </g>

        {/* crisp bodies + leader down to the label */}
        {slots.map((s, i) => (
          <g key={s.key}>
            <line
              ref={(el) => {
                leadRefs.current[i] = el
              }}
              stroke={colorOf(s.key, 80, 70, 0.42)}
              strokeWidth="1"
              strokeDasharray="2 4"
            />
            <path
              ref={(el) => {
                crispRefs.current[i] = el
              }}
              fill={`url(#${uid}-f${s.key})`}
              stroke={colorOf(s.key, 88, 92, 0.5)}
              strokeWidth="1"
            />
          </g>
        ))}
      </svg>

      {/* labels: real DOM text, in rank order for screen readers */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {samples.map((s) => {
          const slot = slotByKey.get(s.key)
          return (
            <span
              key={s.key}
              ref={(el) => {
                labelRefs.current[s.key] = el
              }}
              style={{
                position: 'absolute',
                left: 0,
                top: LABEL_TOP[(slot?.row ?? 0) % 2],
                width: 108,
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 9.5,
                lineHeight: 1.35,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: colorOf(s.key, 88, 60),
                opacity: slot ? 0.92 : 0,
                transition: 'opacity .4s ease',
              }}
            >
              {s.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
