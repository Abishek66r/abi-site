import './her.css'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import { Reveal, Universe, UniverseHead } from '../shell/Universe'
import { useMeasure, useReducedMotion } from '../../lib/hooks'
import {
  HER_APERTURE,
  HER_BEHAVIOUR,
  HER_LOOK,
  HER_PERSON,
  HER_TRUTHS,
} from '../../data/profile'
import type { Pull } from '../../data/profile'

/* ============================================================
   1 · BOKEH BACKDROP
   Six blurred circles drifting slowly behind everything.
   Purely decorative.
   ============================================================ */

type Bokeh = {
  x: string
  y: string
  s: string
  b: string
  o: number
  t: string
  dl: string
  dx: string
  dy: string
  c1: string
  c2: string
}

const PINK_1 = 'rgba(240,163,184,.5)'
const PINK_2 = 'rgba(240,163,184,.1)'
const PEACH_1 = 'rgba(255,201,163,.42)'
const PEACH_2 = 'rgba(255,201,163,.08)'

const BOKEH: Bokeh[] = [
  { x: '-8%', y: '2%', s: '34vw', b: '58px', o: .5, t: '23s', dl: '0s', dx: '8vw', dy: '6vh', c1: PINK_1, c2: PINK_2 },
  { x: '68%', y: '-6%', s: '26vw', b: '46px', o: .42, t: '29s', dl: '-6s', dx: '-6vw', dy: '9vh', c1: PEACH_1, c2: PEACH_2 },
  { x: '22%', y: '58%', s: '30vw', b: '64px', o: .34, t: '35s', dl: '-13s', dx: '7vw', dy: '-7vh', c1: PINK_1, c2: PINK_2 },
  { x: '82%', y: '48%', s: '20vw', b: '40px', o: .46, t: '19s', dl: '-4s', dx: '-9vw', dy: '-5vh', c1: PEACH_1, c2: PEACH_2 },
  { x: '44%', y: '18%', s: '16vw', b: '34px', o: .3, t: '26s', dl: '-9s', dx: '5vw', dy: '8vh', c1: PINK_1, c2: PINK_2 },
  { x: '4%', y: '80%', s: '22vw', b: '52px', o: .28, t: '32s', dl: '-17s', dx: '10vw', dy: '-6vh', c1: PEACH_1, c2: PEACH_2 },
]

/* ============================================================
   4 · THE GRAVITY FIELD
   Two attractors. Every trait orbits one of them. Radius grows
   with `pull`; orbit distance is the inverse of `pull`, so the
   things that pull hardest sit closest in. Nothing is ever
   printed as a value.
   ============================================================ */

type Hub = { cx: number; cy: number; a0: number; span: number; name: string }

type FieldLayout = {
  vbw: number
  vbh: number
  hubs: [Hub, Hub]
  /** orbit distance for the strongest / weakest pull */
  rMin: number
  rMax: number
  /** orb diameter for the weakest / strongest pull */
  dMin: number
  dMax: number
  rings: number[]
  thread: string
}

/* wide: clusters side by side.  a0/span define the arc a cluster is
   allowed to occupy, so no node ever drifts into the other cluster. */
const FIELD_WIDE: FieldLayout = {
  vbw: 1000,
  vbh: 620,
  hubs: [
    { cx: 272, cy: 310, a0: 45, span: 270, name: 'the look' },
    { cx: 728, cy: 310, a0: -135, span: 270, name: 'the person' },
  ],
  rMin: 112,
  rMax: 196,
  dMin: 46,
  dMax: 94,
  rings: [110, 154, 198],
  thread: 'M272 310 C 380 206 620 414 728 310',
}

/* narrow: clusters stacked, thread runs top to bottom */
const FIELD_NARROW: FieldLayout = {
  vbw: 620,
  vbh: 1100,
  hubs: [
    { cx: 310, cy: 272, a0: 160, span: 220, name: 'the look' },
    { cx: 310, cy: 820, a0: -20, span: 220, name: 'the person' },
  ],
  rMin: 98,
  rMax: 174,
  dMin: 42,
  dMax: 86,
  rings: [96, 136, 176],
  thread: 'M310 272 C 418 452 202 640 310 820',
}

type FieldNode = {
  label: string
  note: string
  hub: number
  hue: number
  /** normalised pull, 0..1, across both clusters */
  str: number
  cx: number
  cy: number
  /** base orbit distance */
  r: number
  /** base angle, radians */
  a: number
  /** orb diameter, viewBox units */
  d: number
  amp: number
  s1: number
  s2: number
  p1: number
  p2: number
}

const CLUSTERS: { items: Pull[]; hue: number }[] = [
  { items: HER_LOOK, hue: 342 },
  { items: HER_PERSON, hue: 26 },
]

function buildField(L: FieldLayout): FieldNode[] {
  const all = [...HER_LOOK, ...HER_PERSON].map((p) => p.pull)
  const lo = Math.min(...all)
  const hi = Math.max(...all)
  const span = hi - lo
  const nodes: FieldNode[] = []

  CLUSTERS.forEach((cluster, ci) => {
    const hub = L.hubs[ci]
    const n = cluster.items.length
    cluster.items.forEach((p, i) => {
      const str = span < 1e-6 ? 1 : (p.pull - lo) / span
      const step = n > 1 ? (i * hub.span) / (n - 1) : hub.span / 2
      const k = nodes.length
      nodes.push({
        label: p.label,
        note: p.note,
        hub: ci,
        hue: cluster.hue,
        str,
        cx: hub.cx,
        cy: hub.cy,
        r: L.rMin + (1 - str) * (L.rMax - L.rMin),
        d: L.dMin + str * (L.dMax - L.dMin),
        a: ((hub.a0 + step) * Math.PI) / 180,
        amp: 0.17 * (1 - str * 0.5),
        s1: 0.17 + k * 0.014,
        s2: 0.23 + k * 0.019,
        p1: k * 1.7,
        p2: k * 2.6 + 0.8,
      })
    })
  })

  return nodes
}

/* ============================================================
   5 · THE APERTURE
   Concentric rings, radius driven by `reach`. Labels sit outside
   the diagram and are joined to their ring by a leader line.
   ============================================================ */

type ApLayout = {
  vbw: number
  vbh: number
  cx: number
  cy: number
  /** radius = r0 + reach * rk */
  r0: number
  rk: number
  angles: number[]
  rows: number[]
  /** x the leader terminates on, just short of the label */
  stem: number
  /** x each leader drops through (below-mode only) */
  gutters: number[]
  label: { left: number; width: number }
  mode: 'side' | 'below'
}

const AP_WIDE: ApLayout = {
  vbw: 980,
  vbh: 520,
  cx: 280,
  cy: 260,
  r0: 30,
  rk: 195,
  angles: [-62, -30, 8, 46],
  rows: [55, 185, 315, 445],
  stem: 578,
  gutters: [],
  label: { left: 596, width: 356 },
  mode: 'side',
}

const AP_NARROW: ApLayout = {
  vbw: 620,
  vbh: 1010,
  cx: 300,
  cy: 285,
  r0: 26,
  rk: 182,
  angles: [125, 132, 140, 150],
  rows: [536, 666, 796, 926],
  stem: 182,
  gutters: [160, 120, 80, 40],
  label: { left: 190, width: 400 },
  mode: 'below',
}

const f1 = (n: number) => n.toFixed(1)

type ApRing = {
  label: string
  note: string
  r: number
  d: string
  px: number
  py: number
  row: number
  faint: boolean
}

function buildAperture(L: ApLayout): ApRing[] {
  const last = HER_APERTURE.length - 1
  return HER_APERTURE.map((a, i) => {
    const r = L.r0 + a.reach * L.rk
    const th = (L.angles[i] * Math.PI) / 180
    const px = L.cx + r * Math.cos(th)
    const py = L.cy + r * Math.sin(th)
    const row = L.rows[i]
    const gutter = L.gutters[i] ?? L.stem
    const d =
      L.mode === 'side'
        ? `M${f1(px)} ${f1(py)} L${L.stem} ${row}`
        : `M${f1(px)} ${f1(py)} H${gutter} V${row} H${L.stem}`
    return { label: a.label, note: a.note, r, d, px, py, row, faint: i === last }
  })
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function Her() {
  const reduced = useReducedMotion()

  const { ref: fieldRef, size: fieldSize } = useMeasure<HTMLDivElement>()
  const { ref: apRef, size: apSize } = useMeasure<HTMLDivElement>()

  const field = fieldSize.w > 0 && fieldSize.w < 700 ? FIELD_NARROW : FIELD_WIDE
  const ap = apSize.w > 0 && apSize.w < 700 ? AP_NARROW : AP_WIDE

  const nodes = useMemo(() => buildField(field), [field])
  const rings = useMemo(() => buildAperture(ap), [ap])

  const nodeEls = useRef<(HTMLButtonElement | null)[]>([])
  const tetherEls = useRef<(SVGLineElement | null)[]>([])
  const [active, setActive] = useState(-1)

  /* drift: one rAF loop drives every node and its tether. Frozen
     to the resting layout when reduced motion is requested. */
  useEffect(() => {
    const place = (t: number) => {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        const ang = n.a + n.amp * Math.sin(t * n.s1 + n.p1)
        const dist = n.r + 8 * Math.sin(t * n.s2 + n.p2)
        const cos = Math.cos(ang)
        const sin = Math.sin(ang)

        const el = nodeEls.current[i]
        if (el) {
          el.style.left = `${((n.cx + dist * cos) / field.vbw) * 100}%`
          el.style.top = `${((n.cy + dist * sin) / field.vbh) * 100}%`
        }

        const tether = tetherEls.current[i]
        if (tether) {
          const from = field.rMin * 0.52
          const to = Math.max(from, dist - n.d * 0.56)
          tether.setAttribute('x1', f1(n.cx + from * cos))
          tether.setAttribute('y1', f1(n.cy + from * sin))
          tether.setAttribute('x2', f1(n.cx + to * cos))
          tether.setAttribute('y2', f1(n.cy + to * sin))
        }
      }
    }

    place(0)
    if (reduced) return

    let raf = 0
    const t0 = performance.now()
    const loop = (now: number) => {
      place((now - t0) / 1000)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [nodes, field, reduced])

  const shown = active >= 0 && active < nodes.length ? nodes[active] : null

  /* mood fan — pull only ever becomes a scale and a glow */
  const moods = useMemo(() => {
    const pulls = HER_BEHAVIOUR.map((b) => b.pull)
    const lo = Math.min(...pulls)
    const hi = Math.max(...pulls)
    const span = hi - lo
    return HER_BEHAVIOUR.map((b, i) => ({
      ...b,
      t: span < 1e-6 ? 1 : (b.pull - lo) / span,
      i,
    }))
  }, [])

  return (
    <Universe id="her" tone="her" bleed>
      <div className="her-bokeh" aria-hidden="true">
        {BOKEH.map((b, i) => (
          <i
            key={i}
            style={
              {
                '--x': b.x,
                '--y': b.y,
                '--s': b.s,
                '--b': b.b,
                '--o': b.o,
                '--t': b.t,
                '--dl': b.dl,
                '--dx': b.dx,
                '--dy': b.dy,
                '--c1': b.c1,
                '--c2': b.c2,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="u__inner">
        <UniverseHead
          index="04"
          title="HER"
          sub="The one part of me that has no fixed type at all."
        />

        <Reveal className="her__lead">
          <p>
            If you ask me my type, I&rsquo;ll say <em>all of them</em> &mdash; and I mean it.
            There&rsquo;s no single face I&rsquo;m looking for. There are just pulls, and some pull
            harder than others.
          </p>
        </Reveal>

        {/* ---------- the gravity field ---------- */}
        <Reveal className="her-sec" delay={0.05}>
          <p className="her-sec__label">the gravity field</p>

          <div className="her-field" ref={fieldRef}>
            <svg
              className="her-field__svg"
              viewBox={`0 0 ${field.vbw} ${field.vbh}`}
              width="100%"
              aria-hidden="true"
            >
              <defs>
                <radialGradient id="her-hub-0">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity=".34" />
                  <stop offset="38%" stopColor="#f0a3b8" stopOpacity=".16" />
                  <stop offset="100%" stopColor="#f0a3b8" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="her-hub-1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity=".3" />
                  <stop offset="38%" stopColor="#ffc9a3" stopOpacity=".15" />
                  <stop offset="100%" stopColor="#ffc9a3" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* the two halves decide each other */}
              <path className="her-field__thread" d={field.thread} />

              {field.hubs.map((hub, hi) => (
                <g key={hub.name}>
                  <circle
                    cx={hub.cx}
                    cy={hub.cy}
                    r={field.rMax * 1.05}
                    fill={`url(#her-hub-${hi})`}
                  />
                  {field.rings.map((r, ri) => (
                    <circle
                      key={r}
                      className={`her-field__ring ${ri % 2 ? 'her-field__ring--rev' : ''}`}
                      cx={hub.cx}
                      cy={hub.cy}
                      r={r}
                      style={{ '--i': ri } as CSSProperties}
                    />
                  ))}
                  <circle className="her-field__core" cx={hub.cx} cy={hub.cy} r={4.5} />
                </g>
              ))}

              {nodes.map((n, i) => (
                <line
                  key={n.label}
                  ref={(el) => {
                    tetherEls.current[i] = el
                  }}
                  className="her-field__tether"
                  x1={n.cx}
                  y1={n.cy}
                  x2={n.cx}
                  y2={n.cy}
                />
              ))}
            </svg>

            {field.hubs.map((hub, hi) => (
              <p
                key={hub.name}
                className={`her-field__hub ${hi ? 'her-field__hub--b' : ''}`}
                aria-hidden="true"
                style={{
                  left: `${(hub.cx / field.vbw) * 100}%`,
                  top: `${(hub.cy / field.vbh) * 100}%`,
                }}
              >
                {hub.name}
              </p>
            ))}

            {nodes.map((n, i) => (
              <button
                key={n.label}
                type="button"
                ref={(el) => {
                  nodeEls.current[i] = el
                }}
                className={`her-node ${active === i ? 'is-on' : ''}`}
                style={
                  {
                    /* resting position — the rAF loop takes over from here */
                    left: `${(((n.cx + n.r * Math.cos(n.a)) / field.vbw) * 100).toFixed(3)}%`,
                    top: `${(((n.cy + n.r * Math.sin(n.a)) / field.vbh) * 100).toFixed(3)}%`,
                    '--orb': `calc(${((n.d / field.vbw) * 100).toFixed(2)} * 1cqw)`,
                    '--h': n.hue,
                    '--str': n.str.toFixed(3),
                  } as CSSProperties
                }
                aria-expanded={active === i}
                aria-controls="her-field-read"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive((a) => (a === i ? -1 : a))}
                onFocus={() => setActive(i)}
                onBlur={() => setActive((a) => (a === i ? -1 : a))}
                onClick={() => setActive((a) => (a === i ? -1 : i))}
              >
                <span className="her-node__orb" aria-hidden="true" />
                <span className="her-node__label">{n.label}</span>
              </button>
            ))}
          </div>

          <p
            id="her-field-read"
            className={`her-field__read ${shown ? '' : 'her-field__read--idle'}`}
            aria-live="polite"
          >
            {shown ? (
              <>
                <b style={{ color: `hsl(${shown.hue} 78% 74%)` }}>{shown.label}</b>
                <span>{shown.note}</span>
              </>
            ) : (
              <>
                <b>two halves, one field</b>
                <span>The closer something orbits, the harder it pulls. Hover, or tab through.</span>
              </>
            )}
          </p>
        </Reveal>

        {/* ---------- the aperture ---------- */}
        <Reveal className="her-sec" delay={0.05}>
          <p className="her-sec__label">the aperture</p>

          <div className="her-ap" ref={apRef}>
            <svg
              className="her-ap__svg"
              viewBox={`0 0 ${ap.vbw} ${ap.vbh}`}
              width="100%"
              aria-hidden="true"
            >
              <defs>
                <radialGradient id="her-ap-core">
                  <stop offset="0%" stopColor="#ffc9a3" stopOpacity=".2" />
                  <stop offset="100%" stopColor="#f0a3b8" stopOpacity="0" />
                </radialGradient>
              </defs>

              <line
                className="her-ap__grid"
                x1={ap.cx}
                y1={ap.cy - rings[0].r}
                x2={ap.cx}
                y2={ap.cy + rings[0].r}
              />
              <line
                className="her-ap__grid"
                x1={ap.cx - rings[0].r}
                y1={ap.cy}
                x2={ap.cx + rings[0].r}
                y2={ap.cy}
              />

              <circle
                cx={ap.cx}
                cy={ap.cy}
                r={rings[rings.length - 1].r * 2.4}
                fill="url(#her-ap-core)"
              />

              {rings.map((r, i) => (
                <circle
                  key={r.label}
                  className={`her-ap__ring ${r.faint ? 'her-ap__ring--faint' : ''}`}
                  cx={ap.cx}
                  cy={ap.cy}
                  r={r.r}
                  style={{ '--i': i } as CSSProperties}
                />
              ))}

              {rings.map((r) => (
                <g key={`lead-${r.label}`}>
                  <path className="her-ap__lead" d={r.d} />
                  <circle className="her-ap__dot" cx={r.px} cy={r.py} r={3} />
                </g>
              ))}
            </svg>

            {rings.map((r) => (
              <p
                key={`label-${r.label}`}
                className={`her-ap__label ${r.faint ? 'her-ap__label--faint' : ''}`}
                style={
                  {
                    '--lx': `${((ap.label.left / ap.vbw) * 100).toFixed(3)}%`,
                    '--ly': `${((r.row / ap.vbh) * 100).toFixed(3)}%`,
                    '--lw': `${((ap.label.width / ap.vbw) * 100).toFixed(3)}%`,
                  } as CSSProperties
                }
              >
                <b>{r.label}</b>
                <i>{r.note}</i>
              </p>
            ))}
          </div>

          <p className="her-cap">How far in you actually get.</p>
        </Reveal>

        {/* ---------- how I behave ---------- */}
        <Reveal className="her-sec" delay={0.05}>
          <p className="her-sec__label">how I behave</p>

          <div className="her-fan">
            {moods.map((m) => (
              <button
                key={m.label}
                type="button"
                className="her-fan__card"
                style={
                  {
                    '--rot': `${(m.i - 1) * 7}deg`,
                    '--s': (0.94 + m.t * 0.14).toFixed(3),
                    '--ty': `${Math.abs(m.i - 1) * 12}px`,
                    '--z': m.i === 1 ? 3 : 2 - Math.abs(m.i - 1),
                    '--glow': m.t.toFixed(3),
                  } as CSSProperties
                }
              >
                <span className="her-fan__mark" aria-hidden="true" />
                <span className="her-fan__label">{m.label}</span>
                <span className="her-fan__note">{m.note}</span>
              </button>
            ))}
          </div>

          <p className="her-cap">Mood and the person decide this more than I do.</p>
        </Reveal>

        {/* ---------- the truths ---------- */}
        <div className="her__truth">
          {HER_TRUTHS.map((t, i) => (
            <Reveal key={t.title} as="article" className="her__truthcard" delay={i * 0.08}>
              <h3>{t.title}</h3>
              {t.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </Reveal>
          ))}
        </div>
      </div>
    </Universe>
  )
}
