import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useMeasure, useReducedMotion } from '../../lib/hooks'
import type { Sample } from '../../lib/probability'
import { colorOf } from './types'
import type { VizProps } from './types'

/* ============================================================
   PULSE — a vitals monitor, one trace per option.
   share -> BEAT RATE and BEAT AMPLITUDE. The strongest option
   beats fastest and tallest; the weakest ticks along, flat and
   slow. Paper speed is identical for every row, so the spacing
   between beats is directly readable. Nothing numeric is drawn.
   ============================================================ */

const H = 250
const PAPER = 54 /* px per second, same for every row */

type Row = { key: number; label: string; rel: number; cy: number; rowH: number }
type Vitals = { amp: number; period: number }

/** One synthetic heartbeat, phase 0..1, peak height 1. */
function ecg(p: number): number {
  const bump = (c: number, wd: number) => Math.exp(-(((p - c) / wd) ** 2))
  return (
    0.13 * bump(0.13, 0.036) -
    0.17 * bump(0.29, 0.013) +
    1 * bump(0.332, 0.0135) -
    0.3 * bump(0.382, 0.017) +
    0.24 * bump(0.6, 0.055)
  )
}

function rowsOf(samples: Sample[], h: number): Row[] {
  const ordered = [...samples].sort((a, b) => a.key - b.key)
  const n = ordered.length
  if (n === 0) return []
  const rowH = h / n
  const maxShare = Math.max(...ordered.map((s) => s.share)) || 1
  return ordered.map((s, i) => ({
    key: s.key,
    label: s.label,
    rel: s.share / maxShare,
    cy: (i + 0.5) * rowH,
    rowH,
  }))
}

function vitalsFor(r: Row): Vitals {
  const room = Math.min(r.rowH * 0.36, 26)
  return {
    amp: room * (0.34 + 0.66 * r.rel),
    period: 152 - 84 * r.rel,
  }
}

export default function PulseViz({ samples, nonce }: VizProps) {
  const { ref: stageRef, size } = useMeasure<HTMLDivElement>()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const reduced = useReducedMotion()

  const rows = useMemo(() => rowsOf(samples, H), [samples])
  const gutter = useMemo(
    () => (size.w <= 0 ? 0 : Math.round(Math.max(94, Math.min(156, size.w * 0.38)))),
    [size.w],
  )

  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const rowsRef = useRef<Row[]>([])
  const curRef = useRef<Vitals[]>([])
  const tgtRef = useRef<Vitals[]>([])
  const widthRef = useRef(0)
  const gutterRef = useRef(0)
  const scrollRef = useRef(0)

  const draw = useCallback(() => {
    const ctx = ctxRef.current
    const w = widthRef.current
    const rs = rowsRef.current
    const cur = curRef.current
    if (!ctx || w <= 0 || rs.length === 0) return

    const x0 = gutterRef.current
    const x1 = w - 3
    ctx.clearRect(0, 0, w, H)
    if (x1 - x0 < 20) return

    /* monitor paper: faint dot grid + row rules */
    ctx.fillStyle = 'rgba(255,255,255,.055)'
    for (let x = x0; x <= x1; x += 14) {
      for (let y = 8; y < H; y += 14) ctx.fillRect(x, y, 1, 1)
    }
    ctx.strokeStyle = 'rgba(255,255,255,.05)'
    ctx.lineWidth = 1
    for (let i = 1; i < rs.length; i++) {
      const y = Math.round(i * rs[i].rowH) + 0.5
      ctx.beginPath()
      ctx.moveTo(x0 - 8, y)
      ctx.lineTo(x1, y)
      ctx.stroke()
    }

    for (let i = 0; i < rs.length; i++) {
      const r = rs[i]
      const v = cur[i]
      if (!v) continue
      const period = Math.max(24, v.period)
      const phase = r.key * 37

      /* isoelectric line */
      ctx.setLineDash([1, 5])
      ctx.strokeStyle = colorOf(r.key, 70, 55, 0.22)
      ctx.beginPath()
      ctx.moveTo(x0, Math.round(r.cy) + 0.5)
      ctx.lineTo(x1, Math.round(r.cy) + 0.5)
      ctx.stroke()
      ctx.setLineDash([])

      /* the trace itself */
      ctx.beginPath()
      let head = 0
      for (let x = x0; x <= x1; x++) {
        const u = x + scrollRef.current + phase
        const p = (((u % period) + period) % period) / period
        const e = ecg(p)
        const y = r.cy - v.amp * e
        if (x === x0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
        if (x === x1) head = e
      }
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.strokeStyle = colorOf(r.key, 62, 88, 0.1)
      ctx.lineWidth = 6
      ctx.stroke()
      ctx.strokeStyle = colorOf(r.key, 70, 90, 0.24)
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.strokeStyle = colorOf(r.key, 82, 92)
      ctx.lineWidth = 1.5
      ctx.stroke()

      /* leading marker — swells as each beat passes under it */
      const hr = 2 + 3.4 * Math.max(0, head)
      ctx.fillStyle = colorOf(r.key, 90, 95, 0.9)
      ctx.beginPath()
      ctx.arc(x1, r.cy - v.amp * head, hr, 0, Math.PI * 2)
      ctx.fill()
    }

    /* traces dissolve as they scroll off into the label gutter */
    ctx.globalCompositeOperation = 'destination-out'
    const fade = ctx.createLinearGradient(x0, 0, x0 + 30, 0)
    fade.addColorStop(0, 'rgba(0,0,0,1)')
    fade.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = fade
    ctx.fillRect(x0, 0, 30, H)
    ctx.globalCompositeOperation = 'source-over'
  }, [])

  useLayoutEffect(() => {
    const cv = canvasRef.current
    if (!cv || size.w <= 0) return
    const dpr = Math.min(2, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1)
    cv.width = Math.round(size.w * dpr)
    cv.height = Math.round(H * dpr)
    cv.style.width = `${size.w}px`
    cv.style.height = `${H}px`
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctxRef.current = ctx

    widthRef.current = size.w
    gutterRef.current = gutter
    rowsRef.current = rows
    tgtRef.current = rows.map(vitalsFor)
    if (reduced || curRef.current.length !== rows.length) {
      curRef.current = tgtRef.current.map((v) => ({ amp: v.amp, period: v.period }))
    }
    if (reduced) scrollRef.current = 0
    draw()
  }, [rows, gutter, nonce, size.w, reduced, draw])

  useEffect(() => {
    if (reduced) return
    let raf = 0
    let prev = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000)
      prev = now
      scrollRef.current += dt * PAPER

      const k = 1 - Math.exp(-dt * 3.4)
      const cur = curRef.current
      const tgt = tgtRef.current
      for (let i = 0; i < cur.length && i < tgt.length; i++) {
        cur[i].amp += (tgt[i].amp - cur[i].amp) * k
        cur[i].period += (tgt[i].period - cur[i].period) * k
      }
      draw()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced, draw])

  const rowByKey = useMemo(() => {
    const m = new Map<number, Row>()
    rows.forEach((r) => m.set(r.key, r))
    return m
  }, [rows])

  return (
    <div className="viz" ref={stageRef} style={{ height: H }}>
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'absolute', inset: 0 }} />
      {/* labels: real DOM text in the gutter, rank order for screen readers */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {samples.map((s) => {
          const r = rowByKey.get(s.key)
          if (!r) return null
          return (
            <span
              key={s.key}
              style={{
                position: 'absolute',
                left: 0,
                top: r.cy,
                width: Math.max(70, gutter - 12),
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'var(--font-mono)',
                fontSize: 9.5,
                lineHeight: 1.3,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: colorOf(s.key, 88, 62),
                opacity: 0.92,
              }}
            >
              <i
                aria-hidden="true"
                style={{
                  flex: 'none',
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: colorOf(s.key, 72, 90),
                }}
              />
              {s.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
