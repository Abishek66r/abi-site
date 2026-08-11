import { useMemo } from 'react'
import { useMeasure } from '../../lib/hooks'
import { colorOf } from './types'
import type { VizProps } from './types'
import './MosaicViz.css'

/* ============================================================
   MOSAIC — a squarified treemap. The whole stage is carved up so
   every option owns an AREA proportional to its share. Nothing
   is written as a number: the size of the room is the answer.
   ============================================================ */

const GUTTER = 3
const PAD_X = 11
const PAD_Y = 9

type Rect = { x: number; y: number; w: number; h: number }

/** worst aspect ratio in a candidate row laid along `side` */
function worst(row: number[], side: number, sum: number): number {
  let max = -Infinity
  let min = Infinity
  for (const v of row) {
    if (v > max) max = v
    if (v < min) min = v
  }
  const s2 = sum * sum
  const side2 = side * side
  if (s2 <= 0 || side2 <= 0 || min <= 0) return Infinity
  return Math.max((side2 * max) / s2, s2 / (side2 * min))
}

/** Classic squarified treemap. `areas` must be sorted descending and
 *  already scaled so they sum to w * h. Returns one rect per area. */
function squarify(areas: number[], x: number, y: number, w: number, h: number): Rect[] {
  const out: Rect[] = []
  let rx = x
  let ry = y
  let rw = w
  let rh = h
  let i = 0

  while (i < areas.length) {
    if (rw <= 0.5 || rh <= 0.5) {
      /* degenerate leftovers — park them with zero size rather than NaN */
      for (; i < areas.length; i++) out.push({ x: rx, y: ry, w: 0, h: 0 })
      break
    }
    const side = Math.min(rw, rh)
    const row: number[] = [areas[i]]
    let sum = areas[i]
    let j = i + 1
    while (j < areas.length) {
      const next = sum + areas[j]
      const candidate = worst([...row, areas[j]], side, next)
      if (candidate <= worst(row, side, sum)) {
        row.push(areas[j])
        sum = next
        j++
      } else break
    }

    if (rw >= rh) {
      const stripW = Math.min(rw, sum / rh)
      let yy = ry
      for (const a of row) {
        const hh = stripW > 0 ? a / stripW : 0
        out.push({ x: rx, y: yy, w: stripW, h: hh })
        yy += hh
      }
      rx += stripW
      rw -= stripW
    } else {
      const stripH = Math.min(rh, sum / rw)
      let xx = rx
      for (const a of row) {
        const ww = stripH > 0 ? a / stripH : 0
        out.push({ x: xx, y: ry, w: ww, h: stripH })
        xx += ww
      }
      ry += stripH
      rh -= stripH
    }
    i = j
  }
  return out
}

/** Font size that fits `chars` inside the tile — shrinks rather than clips. */
function fitFont(w: number, h: number, chars: number): number {
  const inner = Math.max(0, w - PAD_X * 2) * Math.max(0, h - PAD_Y * 2)
  if (inner <= 0) return 8
  let fs = Math.min(19, Math.max(9, Math.sqrt(w * h) / 8.2))
  /* rough glyph box: 0.52em wide, 1.25em tall */
  const need = chars * fs * fs * 0.52 * 1.25
  if (need > inner) fs = fs * Math.sqrt(inner / need)
  return Math.max(7.5, Math.min(19, fs))
}

export default function MosaicViz({ samples, nonce }: VizProps) {
  const { ref, size } = useMeasure()

  const tiles = useMemo(() => {
    const w = size.w
    const h = size.h
    if (!samples.length || w < 8 || h < 8) return []

    const ranked = [...samples].sort((a, b) => b.share - a.share)
    const total = ranked.reduce((a, s) => a + Math.max(s.share, 0.0005), 0)
    const scale = (w * h) / (total || 1)
    const areas = ranked.map((s) => Math.max(s.share, 0.0005) * scale)
    const rects = squarify(areas, 0, 0, w, h)

    return ranked
      .map((s, i) => {
        const r = rects[i] ?? { x: 0, y: 0, w: 0, h: 0 }
        return { sample: s, rect: r, font: fitFont(r.w, r.h, s.label.length) }
      })
      /* stable DOM order so CSS transitions animate the same node */
      .sort((a, b) => a.sample.key - b.sample.key)
  }, [samples, nonce, size.w, size.h])

  return (
    <div className="viz mosaicviz" ref={ref} role="img" aria-label={samples.map((s) => s.label).join(', ')}>
      {tiles.map(({ sample, rect, font }) => (
        <div
          key={sample.key}
          className={`mosaicviz__tile ${sample.rank === 0 ? 'is-lead' : ''}`}
          style={{
            left: `${rect.x + GUTTER / 2}px`,
            top: `${rect.y + GUTTER / 2}px`,
            width: `${Math.max(0, rect.w - GUTTER)}px`,
            height: `${Math.max(0, rect.h - GUTTER)}px`,
            background: `linear-gradient(150deg, ${colorOf(sample.key, 32, 68, 0.95)}, ${colorOf(
              sample.key,
              15,
              62,
              0.95,
            )})`,
            borderColor: colorOf(sample.key, 62, 74, sample.rank === 0 ? 0.75 : 0.34),
            boxShadow: `inset 0 0 ${(18 + sample.share * 90).toFixed(0)}px ${colorOf(
              sample.key,
              60,
              80,
              0.13 + sample.share * 0.22,
            )}`,
          }}
        >
          <span
            className="mosaicviz__crest"
            aria-hidden="true"
            style={{
              height: `${(1.5 + sample.share * 7).toFixed(1)}px`,
              background: colorOf(sample.key, 68, 88, 0.9),
            }}
          />
          <span className="mosaicviz__label" style={{ fontSize: `${font.toFixed(2)}px`, color: colorOf(sample.key, 90, 88) }}>
            {sample.label}
          </span>
        </div>
      ))}
    </div>
  )
}
