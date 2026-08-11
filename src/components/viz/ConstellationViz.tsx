import { useMemo } from 'react'
import { colorOf } from './types'
import type { VizProps } from './types'
import './ConstellationViz.css'

/* ============================================================
   CONSTELLATION — a star map. Every option owns a FIXED seat in
   the sky, derived from its key, so the shape of the sky never
   changes. Only the brightness and size of each star moves.
   share -> star radius + glow. Links -> nearest two neighbours.
   ============================================================ */

const W = 420
const H = 262
const X0 = 74
const X1 = 346
const Y0 = 44
const Y1 = 218
const COLS = 4
const ROWS = 3
/** a scattered walk through the 12 lattice cells — keeps low keys apart */
const CELLS = [5, 0, 8, 3, 10, 6, 1, 11, 4, 9, 2, 7]
const R_MIN = 2.6
const R_MAX = 10.4
const LABEL_GAP = 9

const frac = (v: number) => v - Math.floor(v)
const hash = (n: number, seed: number) => frac(Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453)

type Star = {
  key: number
  label: string
  rank: number
  x: number
  y: number
  size: number
  glow: number
  /** label points back toward the middle so it can never leave the frame */
  side: 1 | -1
}

export default function ConstellationViz({ samples, nonce }: VizProps) {
  /* deterministic dust — pure decoration, never re-seeded */
  const dust = useMemo(
    () =>
      Array.from({ length: 54 }, (_, i) => ({
        x: 6 + hash(i + 1, 3) * (W - 12),
        y: 6 + hash(i + 1, 7) * (H - 12),
        r: 0.35 + hash(i + 1, 11) * 0.9,
        o: 0.1 + hash(i + 1, 13) * 0.3,
      })),
    [],
  )

  const stars = useMemo<Star[]>(() => {
    const shares = samples.map((s) => s.share)
    const lo = shares.length ? Math.min(...shares) : 0
    const hi = shares.length ? Math.max(...shares) : 0
    const span = hi - lo
    const cw = (X1 - X0) / COLS
    const ch = (Y1 - Y0) / ROWS

    return samples
      .map((s) => {
        const cell = CELLS[s.key % CELLS.length]
        const col = cell % COLS
        const row = Math.floor(cell / COLS)
        const x = X0 + cw * (col + 0.5) + (hash(s.key + 1, 1) - 0.5) * cw * 0.6
        const y = Y0 + ch * (row + 0.5) + (hash(s.key + 1, 2) - 0.5) * ch * 0.6
        const t = span > 1e-6 ? (s.share - lo) / span : 1
        return {
          key: s.key,
          label: s.label,
          rank: s.rank,
          x,
          y,
          size: R_MIN + t * (R_MAX - R_MIN),
          glow: 0.2 + t * 0.55,
          side: (x > W / 2 ? -1 : 1) as 1 | -1,
        }
      })
      .sort((a, b) => a.key - b.key)
  }, [samples, nonce])

  /** each star reaches for its two nearest neighbours; pairs de-duplicated */
  const links = useMemo(() => {
    const maxShare = samples.reduce((m, s) => Math.max(m, s.share), 0) || 1
    const shareOf = new Map(samples.map((s) => [s.key, s.share]))
    const seen = new Set<string>()
    const out: { id: string; x1: number; y1: number; x2: number; y2: number; op: number; hueKey: number }[] = []

    for (const a of stars) {
      const near = stars
        .filter((b) => b.key !== a.key)
        .map((b) => ({ b, d: (b.x - a.x) ** 2 + (b.y - a.y) ** 2 }))
        .sort((p, q) => p.d - q.d)
        .slice(0, 2)

      for (const { b } of near) {
        const id = a.key < b.key ? `${a.key}-${b.key}` : `${b.key}-${a.key}`
        if (seen.has(id)) continue
        seen.add(id)
        const combined = (shareOf.get(a.key) ?? 0) + (shareOf.get(b.key) ?? 0)
        out.push({
          id,
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
          op: 0.05 + Math.min(1, combined / (maxShare * 2)) * 0.42,
          hueKey: (shareOf.get(a.key) ?? 0) >= (shareOf.get(b.key) ?? 0) ? a.key : b.key,
        })
      }
    }
    /* stable order so React keeps the same line nodes across rolls */
    return out.sort((p, q) => (p.id < q.id ? -1 : 1))
  }, [stars, samples])

  return (
    <div className="viz constviz">
      <svg
        className="constviz__svg"
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={samples.map((s) => s.label).join(', ')}
      >
        <g aria-hidden="true">
          {dust.map((d, i) => (
            <circle key={i} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r={d.r.toFixed(2)} fill="#ffffff" opacity={d.o} />
          ))}
        </g>

        <g aria-hidden="true">
          {links.map((l) => (
            <line
              key={l.id}
              className="constviz__link"
              x1={l.x1.toFixed(1)}
              y1={l.y1.toFixed(1)}
              x2={l.x2.toFixed(1)}
              y2={l.y2.toFixed(1)}
              stroke={colorOf(l.hueKey, 72, 70)}
              strokeWidth={0.75}
              style={{ strokeOpacity: l.op }}
            />
          ))}
        </g>

        {stars.map((s) => (
          <g key={s.key} transform={`translate(${s.x.toFixed(1)} ${s.y.toFixed(1)})`}>
            <g className="constviz__star" aria-hidden="true" style={{ transform: `scale(${s.size.toFixed(2)})` }}>
              <circle
                className="constviz__halo"
                r={3.4}
                fill={colorOf(s.key, 62, 92, s.glow * 0.4)}
                style={{ animationDelay: `${(s.key * 0.73).toFixed(2)}s`, animationDuration: `${3.1 + (s.key % 3) * 0.7}s` }}
              />
              <circle className="constviz__flare" r={1.7} fill={colorOf(s.key, 70, 95, s.glow)} />
              <circle r={0.85} fill="#ffffff" opacity={0.94} />
            </g>
            <g className="constviz__labelwrap" style={{ transform: `translateX(${(s.side * (s.size + LABEL_GAP)).toFixed(1)}px)` }}>
              <text
                className={`constviz__label ${s.rank === 0 ? 'is-lead' : ''}`}
                textAnchor={s.side === 1 ? 'start' : 'end'}
                dominantBaseline="middle"
                fill={colorOf(s.key, 90, 92)}
              >
                {s.label}
              </text>
            </g>
          </g>
        ))}
      </svg>
    </div>
  )
}
