import { useLayoutEffect, useMemo, useRef } from 'react'
import { useReducedMotion } from '../../lib/hooks'
import { colorOf } from './types'
import type { VizProps } from './types'
import './OrbitViz.css'

/* ============================================================
   ORBIT — a small luminous core with bodies falling around it.
   share  ->  body size (bigger) + orbit radius (tighter)
   The favourite hugs the core and travels fastest.
   Nothing is ever printed as a number.
   ============================================================ */

const W = 400
const H = 260
const CX = W / 2
const CY = H / 2 + 2
/** vertical squash — reads as an inclined orbital plane */
const SQUASH = 0.6
const ORBIT_MIN = 36
const ORBIT_MAX = 92
const BODY_MIN = 4.2
const BODY_MAX = 13
const LABEL_GAP = 8
const EDGE = 5
/** golden angle — spreads the starting phases without clustering */
const GOLDEN = 2.399963229728653

type Target = { orbit: number; body: number; speed: number; angle0: number }
type Live = { orbit: number; body: number; angle: number }
type Nodes = {
  ring: SVGEllipseElement | null
  tether: SVGLineElement | null
  halo: SVGCircleElement | null
  body: SVGCircleElement | null
  label: SVGTextElement | null
}

const blankNodes = (): Nodes => ({ ring: null, tether: null, halo: null, body: null, label: null })

export default function OrbitViz({ samples, nonce }: VizProps) {
  const reduced = useReducedMotion()

  const layout = useMemo(() => {
    const shares = samples.map((s) => s.share)
    const lo = shares.length ? Math.min(...shares) : 0
    const hi = shares.length ? Math.max(...shares) : 0
    const span = hi - lo
    const targets = new Map<number, Target>()
    for (const s of samples) {
      const t = span > 1e-6 ? (s.share - lo) / span : 1
      const orbit = ORBIT_MIN + (1 - t) * (ORBIT_MAX - ORBIT_MIN)
      targets.set(s.key, {
        orbit,
        body: BODY_MIN + t * (BODY_MAX - BODY_MIN),
        /* keplerian-ish: the further out, the lazier */
        speed: 140 / Math.pow(orbit, 1.5),
        angle0: s.key * GOLDEN,
      })
    }
    /* draw in stable key order so the DOM never reshuffles between rolls */
    return { targets, order: [...samples].sort((a, b) => a.key - b.key) }
  }, [samples, nonce])

  const nodes = useRef(new Map<number, Nodes>())
  const live = useRef(new Map<number, Live>())
  const widths = useRef(new Map<number, number>())

  const nodeFor = (key: number) => {
    let n = nodes.current.get(key)
    if (!n) {
      n = blankNodes()
      nodes.current.set(key, n)
    }
    return n
  }

  useLayoutEffect(() => {
    const { targets, order } = layout

    /* measure each label once per roll so a body near the edge can
       flip its label inward instead of letting it clip */
    for (const s of order) {
      const label = nodes.current.get(s.key)?.label
      if (!label) continue
      let w = 0
      try {
        w = label.getComputedTextLength()
      } catch {
        w = 0
      }
      widths.current.set(s.key, w > 0 ? w : s.label.length * 5.6)
    }

    for (const [key, t] of targets) {
      if (!live.current.has(key)) {
        /* first paint: bodies bloom out of nothing */
        live.current.set(key, { orbit: t.orbit, body: 0, angle: t.angle0 })
      }
    }

    const paint = () => {
      for (const [key, l] of live.current) {
        const n = nodes.current.get(key)
        if (!n) continue
        const rx = l.orbit
        const ry = l.orbit * SQUASH
        const x = CX + Math.cos(l.angle) * rx
        const y = CY + Math.sin(l.angle) * ry

        if (n.ring) {
          n.ring.setAttribute('rx', rx.toFixed(1))
          n.ring.setAttribute('ry', ry.toFixed(1))
        }
        if (n.tether) {
          n.tether.setAttribute('x2', x.toFixed(1))
          n.tether.setAttribute('y2', y.toFixed(1))
        }
        const bodyRadius = Math.max(0, l.body)
        if (n.halo) {
          n.halo.setAttribute('cx', x.toFixed(1))
          n.halo.setAttribute('cy', y.toFixed(1))
          n.halo.setAttribute('r', (bodyRadius * 2.7).toFixed(1))
        }
        if (n.body) {
          n.body.setAttribute('cx', x.toFixed(1))
          n.body.setAttribute('cy', y.toFixed(1))
          n.body.setAttribute('r', bodyRadius.toFixed(1))
        }
        if (n.label) {
          const tw = widths.current.get(key) ?? 44
          const off = l.body + LABEL_GAP
          let side = Math.cos(l.angle) >= 0 ? 1 : -1
          if (side > 0 && x + off + tw > W - EDGE) side = -1
          if (side < 0 && x - off - tw < EDGE) side = 1
          n.label.setAttribute('x', (x + side * off).toFixed(1))
          n.label.setAttribute('y', y.toFixed(1))
          n.label.setAttribute('text-anchor', side > 0 ? 'start' : 'end')
        }
      }
    }

    if (reduced) {
      for (const [key, t] of targets) {
        live.current.set(key, { orbit: t.orbit, body: t.body, angle: t.angle0 })
      }
      paint()
      return
    }

    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const ease = 1 - Math.exp(-dt * 5)
      for (const [key, l] of live.current) {
        const t = targets.get(key)
        if (!t) continue
        l.orbit += (t.orbit - l.orbit) * ease
        l.body += (t.body - l.body) * ease
        l.angle += t.speed * dt
      }
      paint()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [layout, reduced])

  return (
    <div className="viz orbitviz">
      <svg
        className="orbitviz__svg"
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={samples.map((s) => s.label).join(', ')}
      >
        <defs>
          <radialGradient id="orbitviz-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="38%" stopColor="#a99cff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#8b7cf6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* rings + tethers — decoration only */}
        <g aria-hidden="true">
          {layout.order.map((s) => (
            <ellipse
              key={`ring-${s.key}`}
              ref={(el) => {
                nodeFor(s.key).ring = el
              }}
              cx={CX}
              cy={CY}
              rx={0}
              ry={0}
              fill="none"
              stroke={colorOf(s.key, 66, 72, 0.24)}
              strokeWidth={1}
              strokeDasharray="2 6"
            />
          ))}
          {layout.order.map((s) => (
            <line
              key={`tether-${s.key}`}
              ref={(el) => {
                nodeFor(s.key).tether = el
              }}
              x1={CX}
              y1={CY}
              x2={CX}
              y2={CY}
              stroke={colorOf(s.key, 70, 80, 0.16)}
              strokeWidth={1}
            />
          ))}
          <circle className="orbitviz__glow" cx={CX} cy={CY} r={30} fill="url(#orbitviz-core)" />
          <circle cx={CX} cy={CY} r={5.5} fill="#f4f2ff" />
          <circle cx={CX} cy={CY} r={9.5} fill="none" stroke="#ffffff" strokeOpacity={0.22} strokeWidth={1} />
        </g>

        {/* bodies + their labels */}
        {layout.order.map((s) => (
          <g key={s.key} className={`orbitviz__body ${s.rank === 0 ? 'is-lead' : ''}`}>
            <circle
              ref={(el) => {
                nodeFor(s.key).halo = el
              }}
              aria-hidden="true"
              cx={CX}
              cy={CY}
              r={0}
              fill={colorOf(s.key, 62, 88, 0.2)}
            />
            <circle
              ref={(el) => {
                nodeFor(s.key).body = el
              }}
              aria-hidden="true"
              cx={CX}
              cy={CY}
              r={0}
              fill={colorOf(s.key, 66, 86)}
              stroke="#ffffff"
              strokeOpacity={0.4}
              strokeWidth={0.75}
            />
            <text
              ref={(el) => {
                nodeFor(s.key).label = el
              }}
              className="orbitviz__label"
              x={CX}
              y={CY}
              dominantBaseline="middle"
              textAnchor="start"
              fill={colorOf(s.key, 88, 90)}
            >
              {s.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
